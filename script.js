let isDeveloper = false; 
let isParallaxEnabled = true; // Флаг состояния параллакса
let editingSaveId = null; // null — создаем новый мир, если хранит ID — редактируем существующий


// Объект с путями к изображениям фонов
const backgroundFiles = {
    "Лес": "media/forest.jpg",
    "Звездное небо": "media/bg-stars.jpg",
    "Горы": "media/mountains.jpg",
    "Серый": "media/grey.jpg"
};

// Список фонов для карусели
const backgrounds = ["Лес", "Звездное небо", "Горы", "Серый"];
let currentBgIndex = 1; // "Звездное небо" по умолчанию
let savedBgIndex = 1;   

// Функция изменения фонового изображения на странице
function changeBackground(bgName) {
    const filePath = backgroundFiles[bgName];
    if (filePath) {
        document.body.style.setProperty('--bg-image', `url('${filePath}')`);
    }
}

// Функция применения масштаба к интерфейсу
function applyInterfaceScale(percentValue) {
    const wrapper = document.querySelector('.wrapper');
    if (wrapper) {
        const scaleCoefficient = percentValue / 100;
        wrapper.style.setProperty('--interface-scale', scaleCoefficient);
    }
}

// Загрузка настроек из localStorage при старте
function loadSettings() {
    // 1. Загрузка фона
    const storedBg = localStorage.getItem('game_bg_name');
    if (storedBg && backgrounds.includes(storedBg)) {
        currentBgIndex = backgrounds.indexOf(storedBg);
        savedBgIndex = currentBgIndex;
    }
    const bgNameEl = document.getElementById('bg-name');
    if (bgNameEl) bgNameEl.textContent = backgrounds[currentBgIndex];
    changeBackground(backgrounds[currentBgIndex]);

    // 2. Загрузка масштаба
    const storedScale = localStorage.getItem('game_interface_scale') || 100;
    const scaleRange = document.getElementById('scale-range');
    const scaleVal = document.getElementById('scale-val');
    if (scaleRange) scaleRange.value = storedScale;
    if (scaleVal) scaleVal.textContent = `${storedScale}%`;
    applyInterfaceScale(storedScale); 

    // 3. Загрузка звука
    const storedSound = localStorage.getItem('game_sound_enabled');
    const soundToggle = document.getElementById('sound-toggle');
    if (storedSound !== null && soundToggle) {
        soundToggle.checked = storedSound === 'true';
    }

    // Загрузка переключателя параллакса
    const storedParallax = localStorage.getItem('game_parallax_enabled');
    const parallaxToggle = document.getElementById('parallax-toggle');
    if (storedParallax !== null && parallaxToggle) {
        isParallaxEnabled = storedParallax === 'true';
        parallaxToggle.checked = isParallaxEnabled;
    } else {
        isParallaxEnabled = true; // Включен по умолчанию
    }
    if (!isParallaxEnabled) {
        document.body.style.setProperty('--bg-x', '0px');
        document.body.style.setProperty('--bg-y', '0px');
    }

    // 4. Загрузка режима разработчика
    const storedDev = localStorage.getItem('game_dev_mode_enabled');
    const devToggle = document.getElementById('dev-toggle');
    if (storedDev !== null && devToggle) {
        devToggle.checked = storedDev === 'true';
    }
}

// Сохранение настроек в localStorage
function saveSettings() {
    localStorage.setItem('game_bg_name', backgrounds[currentBgIndex]);
    
    const scaleRange = document.getElementById('scale-range');
    if (scaleRange) localStorage.setItem('game_interface_scale', scaleRange.value);
    
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) localStorage.setItem('game_sound_enabled', soundToggle.checked);

    const parallaxToggle = document.getElementById('parallax-toggle');
    if (parallaxToggle) {
        isParallaxEnabled = parallaxToggle.checked;
        localStorage.setItem('game_parallax_enabled', isParallaxEnabled);
    }
    if (!isParallaxEnabled) {
        document.body.style.setProperty('--bg-x', '0px');
        document.body.style.setProperty('--bg-y', '0px');
    }
    
    const devToggle = document.getElementById('dev-toggle');
    if (devToggle) localStorage.setItem('game_dev_mode_enabled', devToggle.checked);
}

// Распределение серверных данных по строкам главного экрана
function updateDashboard(data) {
    const pTwo = document.getElementById('player-two-status');
    const save = document.getElementById('save-status');
    const admin = document.getElementById('admin-status');
    const tokens = document.getElementById('tokens-status');
    
    const btnCreate = document.getElementById('btn-create');
    const btnContinue = document.getElementById('btn-continue');
    const devRow = document.getElementById('dev-setting-row');
    
    if (pTwo) pTwo.classList.remove('loading');
    if (save) save.classList.remove('loading');
    if (admin) admin.classList.remove('loading');
    if (tokens) tokens.classList.remove('loading');

    if (btnCreate) btnCreate.classList.remove('disabled');

    if (pTwo) {
        if (data.playerTwoOnline) {
            pTwo.textContent = "В сети (2 / 2)";
            pTwo.style.color = "#4caf50";
        } else {
            pTwo.textContent = "Не в сети (1 / 2)";
            pTwo.style.color = "rgba(255, 255, 255, 0.4)";
        }
    }

    if (save && btnContinue) {
        if (data.hasSaveFile) {
            save.textContent = "Обнаружен";
            save.style.color = "#49a3ff";
            btnContinue.classList.remove('disabled');
        } else {
            save.textContent = "Отсутствует";
            save.style.color = "#ff9800";
        }
    }

    if (admin && devRow) {
        if (data.role && data.role.toLowerCase() === 'developer') {
            isDeveloper = true;
            admin.textContent = "Developer"; 
            admin.style.color = "rgba(195, 145, 255, 1)";
            devRow.style.display = "flex";
        } else {
            isDeveloper = false;
            admin.textContent = "Player";
            admin.style.color = "rgba(255, 255, 255, 0.9)";
            devRow.style.display = "none";
        }
    }

    if (tokens && data.deepseekTokens !== undefined) {
        const formattedTokens = (data.deepseekTokens / 1000).toFixed(1);
        tokens.textContent = `${formattedTokens}k`;
    }
}

// Переключаем адрес в зависимости от того, где запущен сервер (локально или на хостинге)
const API_URL = "http://127.0.0.1:8000";
const WS_URL = "ws://127.0.0.1:8000";
let gameSocket = null; // Глобальный объект для WebSocket-соединения

// 1. РЕАЛЬНЫЙ ЗАПРОС СТАТУСА ПАНЕЛИ
async function fetchGameStatus() {
    try {
        const response = await fetch(`${API_URL}/api/status`);
        if (!response.ok) throw new Error("Сеть ответила с ошибкой");
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error("Ошибка обновления дашборда:", error);
        document.querySelectorAll('.status-value.loading').forEach(el => {
            el.classList.remove('loading');
            el.textContent = "Ошибка связи";
            el.style.color = "#f44336";
        });
    }
}




// --- ИНИЦИАЛИЗАЦИЯ И ЛОГИКА ИНТЕРФЕЙСА ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    fetchGameStatus();

    const mainScreen = document.getElementById('main-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const btnSettings = document.getElementById('btn-settings');
    const btnCancel = document.getElementById('settings-cancel');
    const btnApply = document.getElementById('settings-apply');
    const scaleRange = document.getElementById('scale-range');
    const scaleVal = document.getElementById('scale-val');
    const bgName = document.getElementById('bg-name');
    const btnPrev = document.getElementById('bg-prev');
    const btnNext = document.getElementById('bg-next');
    const chatInput = document.getElementById('game-chat-input');
    const btnSendMessage = document.getElementById('btn-send-message');
    const chatMessagesBox = document.getElementById('chat-messages-box');
    const btnCreateWorld = document.getElementById('btn-create');
    const createScreen = document.getElementById('create-screen');
    const btnCreatePrev = document.getElementById('create-prev');
    const btnCreateNext = document.getElementById('create-next');
    const createStepTitle = document.getElementById('create-step-title');
    const btnContinue = document.getElementById('btn-continue');
    const savesScreen = document.getElementById('saves-screen');
    const btnSavesCancel = document.getElementById('saves-cancel');
    const savesContainer = document.getElementById('saves-list-container');
    const gameScreen = document.getElementById('game-screen');
    const btnGameExit = document.getElementById('game-exit-menu');
    const gameDevPanel = document.getElementById('game-dev-panel');



    // Функция переключения отображения панели отладки в зависимости от режима разработчика
    function checkGameDevPanel() {
    if (!gameDevPanel) return;
    // Проверяем тогл режима разработчика в localStorage или глобальный флаг
    const isDevMode = localStorage.getItem('game_dev_mode_enabled') === 'true';
    
    if (isDevMode && isDeveloper) {
        gameDevPanel.style.display = "flex";
    } else {
        gameDevPanel.style.display = "none";
    }
    }

    // Переход на экран настроек
    if (btnSettings && mainScreen && settingsScreen) {
        btnSettings.addEventListener('click', (e) => {
            e.preventDefault();
            mainScreen.classList.remove('active');
            setTimeout(() => {
                settingsScreen.classList.add('active');
            }, 200); 
        });
    }

    // Кнопка Отмена (возврат без изменений)
    if (btnCancel && mainScreen && settingsScreen) {
        btnCancel.addEventListener('click', () => {
            currentBgIndex = savedBgIndex; 
            if (bgName) bgName.textContent = backgrounds[currentBgIndex];
            changeBackground(backgrounds[currentBgIndex]); 

            const storedScale = localStorage.getItem('game_interface_scale') || 100;
            if (scaleRange) scaleRange.value = storedScale;
            if (scaleVal) scaleVal.textContent = `${storedScale}%`;
            applyInterfaceScale(storedScale); 

            const storedSound = localStorage.getItem('game_sound_enabled');
            const soundToggle = document.getElementById('sound-toggle');
            if (storedSound !== null && soundToggle) soundToggle.checked = storedSound === 'true';

            const storedDev = localStorage.getItem('game_dev_mode_enabled');
            const devToggle = document.getElementById('dev-toggle');
            if (storedDev !== null && devToggle) devToggle.checked = storedDev === 'true';

            settingsScreen.classList.remove('active');
            setTimeout(() => {
                mainScreen.classList.add('active');
            }, 200);
        });
    }

    // Кнопка Применить (сохранение настроек)
    if (btnApply && mainScreen && settingsScreen) {
        btnApply.addEventListener('click', () => {
            savedBgIndex = currentBgIndex; 
            saveSettings(); 
            
            const successModal = document.getElementById('save-success-modal');
            if (successModal) {
                successModal.classList.add('modal-active');
                setTimeout(() => {
                    successModal.classList.remove('modal-active');
                    settingsScreen.classList.remove('active');
                    setTimeout(() => {
                        mainScreen.classList.add('active');
                    }, 200);
                }, 600); // 0.6 секунды на показ модалки
            }
        });
    }

    // Изменение масштаба: цифра меняется на лету, а сам интерфейс масштабируется только после отпускания ползунка
    if (scaleRange && scaleVal) {
        // 1. Пока тянем: плавно обновляем только текст процентов, страница не дёргается
        scaleRange.addEventListener('input', (e) => {
            scaleVal.textContent = `${e.target.value}%`;
        });

        // 2. Мышку отпустили (или кликнули): интерфейс плавно и стабильно масштабируется без багов
        scaleRange.addEventListener('change', (e) => {
            applyInterfaceScale(e.target.value); 
        });
    }

    // Логика карусели фонов
    if (bgName && btnPrev && btnNext) {
        bgName.textContent = backgrounds[currentBgIndex];

        btnNext.addEventListener('click', () => {
            currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
            bgName.textContent = backgrounds[currentBgIndex];
            changeBackground(backgrounds[currentBgIndex]); 
        });
        btnPrev.addEventListener('click', () => {
            currentBgIndex = (currentBgIndex - 1 + backgrounds.length) % backgrounds.length;
            bgName.textContent = backgrounds[currentBgIndex];
            changeBackground(backgrounds[currentBgIndex]); 
        });
    }

    // 2. РЕАЛЬНЫЙ ВЫВОД СПИСКА СОХРАНЕНИЙ ИЗ БЕКЕНДА
    async function loadAndRenderSaves() {
    try {
        const response = await fetch(`${API_URL}/api/saves`);
        if (!response.ok) throw new Error("Не удалось загрузить сохранения");
        const saves = await response.json();
        
        const savesContainer = document.getElementById('saves-list-container');
        if (!savesContainer) return;
        savesContainer.innerHTML = ""; 

        if (saves.length === 0) {
            savesContainer.innerHTML = `<p class="step-description" style="text-align:center; padding: 2vh 0;">Сохранения не найдены. Создайте новый мир.</p>`;
            return;
        }

        saves.forEach(save => {
            const saveRow = document.createElement('div');
            saveRow.className = 'save-row';
            saveRow.innerHTML = `
                <span class="save-name">${save.name}</span>
                <div class="save-actions-group">
                    <button class="save-action-icon btn-save-play" data-id="${save.id}" title="Играть"><img src="media/icons/game.png" alt="Играть"></button>
                    <button class="save-action-icon btn-save-edit" data-id="${save.id}" title="Изменить"><img src="media/icons/pencil.png" alt="Изменить"></button>
                    <button class="save-action-icon btn-save-delete" data-id="${save.id}" title="Удалить"><img src="media/icons/trash.png" alt="Удалить"></button>
                </div>
            `;
            savesContainer.appendChild(saveRow);
        });

        // Привязка кнопки "Играть" -> Инициализирует WebSocket сессию
        // Привязка кнопки "Играть" -> Инициализирует WebSocket сессию
        document.querySelectorAll('.btn-save-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const saveId = e.currentTarget.dataset.id;
                initGameSession(saveId);
            });
        });

        // Привязка кнопки "Изменить" -> Загружает данные обратно в форму
        document.querySelectorAll('.btn-save-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const saveId = e.currentTarget.dataset.id;
                editSaveWorld(saveId); // Вызываем реальную функцию загрузки
            });
        });

        // Привязка кнопки "Удалить" -> Отправляет DELETE-запрос на бэкенд
        document.querySelectorAll('.btn-save-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const saveId = e.currentTarget.dataset.id;
                deleteSaveWorld(saveId); // Вызываем реальную функцию удаления
            });
        });


    } catch (error) {
        console.error("Ошибка рендера сохранений:", error);
    }
    }

    // 3. РЕАЛЬНОЕ УДАЛЕНИЕ МИРА С СЕРВЕРА
    async function deleteSaveWorld(saveId) {
    if (!confirm("Вы уверены, что хотите безвозвратно удалить этот мир?")) return;
    try {
        const response = await fetch(`${API_URL}/api/saves/${saveId}`, { method: 'DELETE' });
        if (response.ok) {
            loadAndRenderSaves(); // Перерисовываем список
            fetchGameStatus();    // Обновляем дашборд (вдруг удалили единственный сейв)
        }
    } catch (error) {
        console.error("Ошибка удаления:", error);
    }
    }

    // 4. РЕАЛЬНОЕ РЕДАКТИРОВАНИЕ МИРА (Загрузка данных в поля)
    async function editSaveWorld(saveId) {
    try {
        const response = await fetch(`${API_URL}/api/saves/${saveId}`);
        const save = await response.json();
        
        editingSaveId = saveId;

        // Заполняем поля создания данными этого сохранения
        document.getElementById('new-save-name').value = save.name;
        document.querySelector('.textarea-huge').value = save.story;
        document.getElementById('char-name').value = save.char_name;
        document.getElementById('stat-strength').value = save.stats.strength;
        document.getElementById('stat-endurance').value = save.stats.endurance;
        document.getElementById('stat-agility').value = save.stats.agility;
        document.getElementById('stat-powers').value = save.stats.powers;
        document.getElementById('stat-charisma').value = save.stats.charisma;
        document.getElementById('char-appearance').value = save.char_appearance;
        document.getElementById('char-features').value = save.char_features;
        
        // Вписываем способности обратно в 3 текстовых поля (если они есть в сейве)
        const savedPowers = save.powers || [];
        document.getElementById('char-power-1').value = savedPowers[0] || '';
        document.getElementById('char-power-2').value = savedPowers[1] || '';
        document.getElementById('char-power-3').value = savedPowers[2] || '';


        // Перекидываем пользователя на экран создания (редактирования)
        currentStep = 1; // явно указываем глобальный шаг
        updateCreateStepUI(); // вызываем глобальную функцию
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('saves-screen').classList.remove('active');
        setTimeout(() => { document.getElementById('create-screen').classList.add('active'); }, 200);
    } catch (error) {
        console.error("Ошибка загрузки для редактирования:", error);
    }
    }

    // 5. ПОДКЛЮЧЕНИЕ ЧАТА ЧЕРЕЗ WEBSOCKET
    function initGameSession(saveId) {
    const mainScreen = document.getElementById('main-screen');
    const savesScreen = document.getElementById('saves-screen');
    const createScreen = document.getElementById('create-screen');
    const gameScreen = document.getElementById('game-screen');
    const chatMessagesBox = document.getElementById('chat-messages-box');
    
    if (chatMessagesBox) chatMessagesBox.innerHTML = ""; // Очищаем старый демо-чат

    // Закрываем старое соединение, если оно было активно
    if (gameSocket) gameSocket.close();

    // Открываем WebSocket соединение с FastAPI, передавая ID сохранения
    gameSocket = new WebSocket(`${WS_URL}/ws/game/${saveId}`);

    gameSocket.onopen = () => {
        console.log("WebSocket соединение установлено для сохранения:", saveId);
        checkGameDevPanel();
        
        // Скрываем все возможные экраны откуда пришли и открываем игру
        if (mainScreen) mainScreen.classList.remove('active');
        if (savesScreen) savesScreen.classList.remove('active');
        if (createScreen) createScreen.classList.remove('active');
        setTimeout(() => { gameScreen.classList.add('active'); }, 200);
    };

    // Прием сообщений от сервера (от ИИ)
    gameSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Если сервер прислал обновление характеристик или инвентаря
        if (data.type === "sync") {
            document.getElementById('game-char-name').textContent = data.char.name;
            document.getElementById('game-char-appearance').textContent = data.char.appearance;
            document.getElementById('g-val-strength').textContent = data.char.stats.strength;
            document.getElementById('g-val-agility').textContent = data.char.stats.agility;
            document.getElementById('g-val-powers').textContent = data.char.stats.powers;
            document.getElementById('g-val-charisma').textContent = data.char.stats.charisma;
            
            // Динамический цвет выносливости
            const endEl = document.getElementById('g-val-endurance');
            const endMaxEl = document.getElementById('g-val-endurance-max');
            if (endEl && endMaxEl) {
                endEl.textContent = data.char.stats.endurance;
                endMaxEl.textContent = data.char.stats.endurance_max;
                endEl.parentElement.className = parseInt(data.char.stats.endurance) < 5 ? "stat-val redtext" : "stat-val greentext";
            }

            // Рендерим текстовый инвентарь по 13 строкам
            const inventoryLines = document.querySelectorAll('.inventory-line');
            inventoryLines.forEach((line, index) => {
                const item = data.char.inventory[index];
                if (item) {
                    line.textContent = item;
                    line.classList.add('has-item');
                } else {
                    line.textContent = "Пусто";
                    line.classList.remove('has-item');
                }
            });
        } 
        
        // Если пришло обычное текстовое сообщение истории
        if (data.type === "message") {
            console.log("Пришло сообщение от сервера!");
            appendMessage(data.text, false);
        }
    };

    gameSocket.onclose = () => console.log("Игровая WebSocket сессия закрыта");
    }

    // 6. ОТПРАВКА СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ В WEBSOCKET
    function appendMessage(text, isUser) {
        if (!chatMessagesBox || !text.trim()) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = isUser ? 'msg msg-user' : 'msg msg-system';
        msgDiv.innerHTML = `<span class="msg-author">${isUser ? 'Вы:' : 'История:'}</span><p class="msg-text">${text}</p>`;
        chatMessagesBox.appendChild(msgDiv);
        
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    
    
        if (isUser) {
            if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
                gameSocket.send(JSON.stringify({ type: "action", text: text }));
            } else {
                console.error("WebSocket не готов. Текущий статус readyState:", gameSocket ? gameSocket.readyState : "сокет не создан");
                appendMessage("Ошибка: Нет связи с сервером. Попробуйте перезайти в мир.", false);
            }
        }
    }

    // --- ЛОГИКА СОЗДАНИЯ НОВОГО МИРА ---
    let currentStep = 1;
    const maxSteps = 2; // ТЕПЕРЬ ВСЕГО 2 ЭТАПА ВВОДА ДАННЫХ

    function updateCreateStepUI() {

        document.querySelectorAll('.create-step-content').forEach(el => el.classList.remove('active'));
        const activeContent = document.querySelector(`.create-step-content[data-step="${currentStep}"]`);
        if (activeContent) activeContent.classList.add('active');



        if (currentStep === 1) {
            btnCreatePrev.textContent = "Отмена";
            btnCreatePrev.className = "action-btn btn-cancel"; 
            btnCreateNext.textContent = "Далее \u203A";
            btnCreateNext.className = "action-btn btn-apply";
            createStepTitle.textContent = `Создание мира: Этап 1 из ${maxSteps}`;
        } else if (currentStep <= maxSteps) {
            btnCreatePrev.textContent = "\u2039 Назад";
            btnCreatePrev.className = "action-btn btn-apply"; 
            btnCreateNext.textContent = currentStep === maxSteps ? "Сохранить" : "Далее \u203A";
            btnCreateNext.className = "action-btn btn-apply";
            createStepTitle.textContent = `Создание мира: Этап ${currentStep} из ${maxSteps}`;
        } else if (currentStep === 3) {
            btnCreatePrev.className = "action-btn btn-cancel"; 
            btnCreatePrev.textContent = "Выйти";
            btnCreateNext.textContent = "Играть";
            btnCreateNext.className = "action-btn btn-apply";

        }

    }

    if (btnCreateWorld && mainScreen && createScreen) {
        btnCreateWorld.addEventListener('click', (e) => {
            e.preventDefault();
            currentStep = 1; 
            editingSaveId = null; // СБРОС: Мы создаем НОВЫЙ мир с нуля
            updateCreateStepUI();
            mainScreen.classList.remove('active');
            setTimeout(() => { createScreen.classList.add('active'); }, 200);
        });
    }

    // Умный обработчик кнопки «Вперед / Сгенерировать / Войти в игру»
    if (btnCreateNext) {
        btnCreateNext.addEventListener('click', async (e) => {
            e.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

            if (currentStep < maxSteps) {
                // Шаг вперед на промежуточных этапах (переход с 1 на 2 этап)
                currentStep++;
                updateCreateStepUI();
            } 
            else if (currentStep === maxSteps) {
                // МЫ НА ВТОРОМ ЭТАПЕ — НАЖАЛИ «СГЕНЕРИРОВАТЬ»
                
                                // Считываем значения из трех новых полей способностей
                const p1 = document.getElementById('char-power-1') ? document.getElementById('char-power-1').value : "";
                const p2 = document.getElementById('char-power-2') ? document.getElementById('char-power-2').value : "";
                const p3 = document.getElementById('char-power-3') ? document.getElementById('char-power-3').value : "";
                
                // Фильтруем массив, чтобы на бэкенд не улетали пустые строки, если заполнено только 1 или 2 поля
                const powersArray = [p1, p2, p3].filter(p => p.trim() !== "");

                const savePayload = {
                    name: document.getElementById('new-save-name').value || "Новый мир",
                    story: document.querySelector('.textarea-huge').value || "Стартовая легенда отсутствует",
                    char_name: document.getElementById('char-name').value || "Герой",
                    char_appearance: document.getElementById('char-appearance').value || "Не указана",
                    char_features: document.getElementById('char-features').value || "Нет предыстории", // Ваша "предыстория"
                    stats: {
                        strength: parseInt(document.getElementById('stat-strength').value) || 5,
                        endurance: parseInt(document.getElementById('stat-endurance').value) || 10,
                        agility: parseInt(document.getElementById('stat-agility').value) || 5,
                        powers: parseInt(document.getElementById('stat-powers').value) || 5,
                        charisma: parseInt(document.getElementById('stat-charisma').value) || 5 // Ваше "влияние"
                    },
                    powers: powersArray // Отправляем чистый массив строк
                };

                if (!editingSaveId) {
                    try {
                    // Отправляем POST-запрос в FastAPI
                    const response = await fetch(`${API_URL}/api/saves`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(savePayload)
                    });

                    if (response.ok) {
                        const jsonResult = await response.json();
                        console.log("Мир успешно создан на сервере с ID:", jsonResult.id);
                        
                        // Только после успешного ответа сервера переключаем экран на финал (Шаг 3)
                        currentStep = 3;
                        updateCreateStepUI();
                        
                        // Сразу обновляем статус панели управления и подтягиваем новый сейв
                        fetchGameStatus();   
                    } else {
                        alert("Сервер вернул ошибку при попытке сохранить мир.");
                    }
                    } catch (err) {
                    console.error("Ошибка сети при отправке данных на бэкенд:", err);
                    alert("Не удалось связаться с Python-сервером. Проверьте, запущен ли main.py.");
                    }
                } else {
                try {
                    const response = await fetch(`${API_URL}/api/saves/${editingSaveId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(savePayload)
                    });
                
                    if (response.ok) {
        console.log(`Сохранение ${editingSaveId} успешно обновлено.`);
        
        // Переводим интерфейс на финальный экран успеха (Шаг 3)
        currentStep = 3; 
        updateCreateStepUI();
        
        // Сразу обновляем дашборд главного меню
        fetchGameStatus();   
                    } else {
        alert("Бэкенд вернул ошибку при попытке обновить мир.");
                    }
                } catch (err) {
                    console.error("Ошибка сети при отправке PUT-запроса:", err);
                    alert("Не удалось связаться с сервером для обновления данных.");
                }
                }
                
            } 
            else if (currentStep === 3) {
                // МЫ НА ФИНАЛЬНОМ ЭКРАНЕ — НАЖАЛИ «ВОЙТИ В ИГРУ»
                const cName = document.getElementById('char-name').value || "Без имени";
                const cAppearance = document.getElementById('char-appearance').value || "Не указана";

                const sStr = document.getElementById('stat-strength').value;
                const sEnd = document.getElementById('stat-endurance').value;
                const sAgl = document.getElementById('stat-agility').value;
                const sPwr = document.getElementById('stat-powers').value;
                const sChr = document.getElementById('stat-charisma').value;

                // Синхронизируем статы с левым листом персонажа в игре
                document.getElementById('game-char-name').textContent = cName;
                document.getElementById('game-char-appearance').textContent = cAppearance;
                
                document.getElementById('g-val-strength').textContent = sStr;
                document.getElementById('g-val-endurance').textContent = sEnd;
                document.getElementById('g-val-endurance-max').textContent = sEnd; 
                document.getElementById('g-val-agility').textContent = sAgl;
                document.getElementById('g-val-powers').textContent = sPwr;
                document.getElementById('g-val-charisma').textContent = sChr;

                // Переключаемся на окно игры
                checkGameDevPanel(); 
                if (createScreen && gameScreen) {
                    createScreen.classList.remove('active');
                    setTimeout(() => { gameScreen.classList.add('active'); }, 200);
                }
            }
        });
    }

    if (btnCreatePrev && mainScreen && createScreen) {
        btnCreatePrev.addEventListener('click', () => {
            if (currentStep === 1 || currentStep === 3) {
                createScreen.classList.remove('active');
                setTimeout(() => { mainScreen.classList.add('active'); }, 200);
            } else {
                currentStep--;
                updateCreateStepUI();
            }
        });
    }

    // --- ВАЛИДАЦИЯ И КОНТРОЛЬ ЧИСЛОВЫХ ПОЛЕЙ ХАРАКТЕРИСТИК ---
    const numberInputs = document.querySelectorAll('.stat-number-input');
    numberInputs.forEach(input => {
        // Пока мы пишем — просто убираем любые буквы, позволяя стереть всё до пустоты
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        // Когда убираем фокус с поля — если оно пустое, ставим 0
        input.addEventListener('blur', (e) => {
            if (e.target.value === '') {
                e.target.value = '0';
            }
        });
    });

    // --- ЛОГИКА ЭКРАНА СОХРАНЕНИЙ ---

    if (btnContinue && mainScreen && savesScreen) {
        btnContinue.addEventListener('click', (e) => {
            e.preventDefault();
            loadAndRenderSaves(); // Локальный вызов функции без задержек и window
            mainScreen.classList.remove('active');
            setTimeout(() => { savesScreen.classList.add('active'); }, 200);
        });
    }

    // Кнопка Отмена
    if (btnSavesCancel && mainScreen && savesScreen) {
        btnSavesCancel.addEventListener('click', () => {
            savesScreen.classList.remove('active');
            setTimeout(() => {
                mainScreen.classList.add('active');
            }, 200);
        });
    }

    // --- ЛОГИКА ИГРОВОГО ЭКРАНА ---

    window.renderSavesList = function(saves) {
        if (!savesContainer) return;
        savesContainer.innerHTML = ""; 
        saves.forEach(save => {
            const saveRow = document.createElement('div');
            saveRow.className = 'save-row';
            saveRow.innerHTML = `
                <span class="save-name">${save.name}</span>
                <div class="save-actions-group">
                    <button class="save-action-icon btn-save-play" data-id="${save.id}"><img src="media/icons/game.png" alt="Играть"></button>
                    <button class="save-action-icon btn-save-edit" data-id="${save.id}"><img src="media/icons/pencil.png" alt="Изменить"></button>
                    <button class="save-action-icon btn-save-delete" data-id="${save.id}"><img src="media/icons/trash.png" alt="Удалить"></button>
                </div>
            `;
            savesContainer.appendChild(saveRow);
        });

        // Клик «Играть» переводит на экран игры
        document.querySelectorAll('.btn-save-play').forEach(btn => {
            btn.addEventListener('click', () => {
                checkGameDevPanel(); // проверяем, показывать ли панель отладки
                if (savesScreen && gameScreen) {
                    savesScreen.classList.remove('active');
                    setTimeout(() => { gameScreen.classList.add('active'); }, 200);
                }
            });
        });
    };

    // Выход из игры обратно в главное меню
    if (btnGameExit && mainScreen && gameScreen) {
        btnGameExit.addEventListener('click', () => {
            gameScreen.classList.remove('active');
            setTimeout(() => { mainScreen.classList.add('active'); }, 200);
        });
    };

        // --- ОБРАБОТКА НАЖАТИЙ ДЛЯ ИГРОВОГО ЧАТА ---

    if (chatInput && btnSendMessage) {
        // Единая функция, которая считывает текст, выводит его на экран и шлет в Python
        const handleUserSend = () => {
            const text = chatInput.value.trim();
            if (!text) return; // Если в поле пусто или одни пробелы — ничего не делаем
            // 1. Сразу очищаем поле ввода, чтобы предотвратить дребезг клавиш и повторный спам
            chatInput.value = ""; 
            // 2. Отображаем реплику игрока на экране (флаг true означает, что автор — игрок)
            appendMessage(text, true);

        };

        // Событие 1: Клик левой кнопкой мыши по кнопке «Отправить»
        btnSendMessage.addEventListener('click', handleUserSend);

        // Событие 2: Нажатие клавиши «Enter» внутри текстового поля ввода
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Предотвращаем стандартный перенос строки в инпуте
                handleUserSend();
            };
        });
    };
});

// Инвертированный 3D-параллакс с проверкой тумблера
document.addEventListener('mousemove', (e) => {
    if (!isParallaxEnabled) return; // Полная остановка, если выключен

    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    const moveX = -(x * 30); 
    const moveY = -(y * 30);
    document.body.style.setProperty('--bg-x', `${moveX}px`);
    document.body.style.setProperty('--bg-y', `${moveY}px`);
});