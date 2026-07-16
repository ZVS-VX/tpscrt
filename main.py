import os
import json
import uuid
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DeepSpace")

# Настройка CORS, чтобы ваш HTML-файл мог делать запросы к Python-серверу
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # на этапе разработки разрешаем запросы отовсюду
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAVES_DIR = "saves"
os.makedirs(SAVES_DIR, exist_ok=True)

# Описание структуры сохранения для валидации FastAPI (Pydantic)
class CharacterStats(BaseModel):
    strength: int
    endurance: int
    agility: int
    powers: int
    charisma: int

class SaveModel(BaseModel):
    name: str
    story: str
    char_name: str
    char_appearance: str
    char_features: str
    stats: CharacterStats
    powers: List[str]

# --- 1. РОУТ СТАТУСА ПАНЕЛИ УПРАВЛЕНИЯ ---
@app.get("/api/status")
def get_server_status():
    save_files = [f for f in os.listdir(SAVES_DIR) if f.endswith(".json")]
    return {
        "playerTwoOnline": True,  # Имитируем, что ваш коллега в сети
        "hasSaveFile": len(save_files) > 0,
        "role": "developer",       # Фиксируем роль админа для вызова панели отладки ИИ
        "deepseekTokens": 1250000  # Текущая квота токенов
    }

# --- 2. РОУТЫ УПРАВЛЕНИЯ JSON-СОХРАНЕНИЯМИ ---
@app.post("/api/saves")
def create_save(save_data: SaveModel):
    print("SAVE 12321")
    save_id = str(uuid.uuid4())[:8] # Генерируем короткий ID для файла
    file_path = os.path.join(SAVES_DIR, f"{save_id}.json")
    
    full_data = save_data.model_dump()
    full_data["id"] = save_id
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(full_data, f, ensure_ascii=False, indent=4)
    return {"status": "success", "id": save_id}

# --- НОВЫЙ РОУТ ДЛЯ ПЕРЕЗАПИСИ (ОБНОВЛЕНИЯ) МИРА ---
@app.put("/api/saves/{save_id}")
def update_save(save_id: str, save_data: SaveModel):
    print("PUTTT")
    file_path = os.path.join(SAVES_DIR, f"{save_id}.json")
    
    # Проверяем, существует ли вообще файл, который мы хотим обновить
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Сохранение для обновления не найдено")
        
    # Читаем старый файл, чтобы не потерять текущий инвентарь или логи, нажитые в игре
    with open(file_path, "r", encoding="utf-8") as f:
        old_data = json.load(f)
    
    # model_dump() преобразует Pydantic-модель в чистый словарь Python
    updated_data = save_data.model_dump()
    
    # Сохраняем неизменным ID сохранения
    updated_data["id"] = save_id
    # Переносим инвентарь из старого сейва (чтобы перезапись характеристик его не стирала)
    updated_data["inventory"] = old_data.get("inventory", [])
    updated_data["stats"]["endurance_max"] = old_data["stats"].get("endurance_max", 10)
    
    # Перезаписываем старый файл новыми данными
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(updated_data, f, ensure_ascii=False, indent=4)
        
    return {"status": "updated", "id": save_id}

@app.get("/api/saves")
def get_all_saves():
    saves_list = []
    for filename in os.listdir(SAVES_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(SAVES_DIR, filename), "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    saves_list.append({"id": data["id"], "name": data["name"]})
                except Exception:
                    continue
    return saves_list

@app.get("/api/saves/{save_id}")
def get_save_by_id(save_id: str):
    file_path = os.path.join(SAVES_DIR, f"{save_id}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Сохранение не найдено")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.delete("/api/saves/{save_id}")
def delete_save(save_id: str):
    file_path = os.path.join(SAVES_DIR, f"{save_id}.json")
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Файл не найден")

# --- 3. ИГРОВОЙ WEBSOCKET КАНАЛ (ЧАТ И СИНХРОНИЗАЦИЯ) ---
@app.websocket("/ws/game/{save_id}")
async def websocket_game_endpoint(websocket: WebSocket, save_id: str):
    await websocket.accept()
    
    # Загружаем JSON-файл сохранения, чтобы отправить стартовые параметры персонажа на фронтенд
    file_path = os.path.join(SAVES_DIR, f"{save_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            save_data = json.load(f)
            
        # Отправляем пакет синхронизации характеристик и инвентаря
        await websocket.send_json({
            "type": "sync",
            "char": {
                "name": save_data["char_name"],
                "appearance": save_data["char_appearance"],
                "inventory": save_data.get("inventory", []),
                "stats": save_data["stats"]
            }
        })
        
        # Отправляем стартовое приветственное сообщение из предыстории мира
        await websocket.send_json({
            "type": "message",
            "text": f"Добро пожаловать, {save_data["char_name"]}"
        })

    try:
        while True:
            # Ожидаем действия от пользователя из чата
            data = await websocket.receive_json()
            if data["type"] == "action":
                user_text = data["text"]
                print(f"Игрок совершил действие: {user_text}")
                
                # ТУТ В БУДУЩЕМ БУДЕТ КЛЮЧ DEEPSEEK!
                # А пока возвращаем эхо-ответ от сервера для проверки чата:
                ai_response = f"Вы написали: '{user_text}'."
                
                await websocket.send_json({
                    "type": "message",
                    "text": ai_response
                })
    except WebSocketDisconnect:
        print(f"Игрок отключился от сессии: {save_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
