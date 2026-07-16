let isDeveloper = false; 
let isParallaxEnabled = true; // Флаг состояния параллакса


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

// Запрос статуса сессии
async function fetchGameStatus() {
    try {
        /*
        const response = await fetch('http://localhost:5000/api/status');
        const data = await response.json();
        updateDashboard(data);
        */
        setTimeout(() => {
            const mockServerResponse = {
                playerTwoOnline: false, 
                hasSaveFile: true,      
                role: "developer", 
                deepseekTokens: 750000  
            };
            updateDashboard(mockServerResponse);
        }, 1500);
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
    const btnCreateWorld = document.getElementById('btn-create');
    const createScreen = document.getElementById('create-screen');
    const btnCreatePrev = document.getElementById('create-prev');
    const btnCreateNext = document.getElementById('create-next');
    const createStepTitle = document.getElementById('create-step-title');

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

        // --- ЛОГИКА СОЗДАНИЯ НОВОГО МИРА ---

    
    let currentStep = 1;
    const maxSteps = 3; // Основные этапы ввода данных

    // Функция обновления шагов и заголовков (БЕЗ клонирования кнопки)
    function updateCreateStepUI() {
        // Скрываем все этапы контента
        document.querySelectorAll('.create-step-content').forEach(el => el.classList.remove('active'));
        
        // Показываем текущий этап
        const activeContent = document.querySelector(`.create-step-content[data-step="${currentStep}"]`);
        if (activeContent) activeContent.classList.add('active');

        // Стилизация кнопок навигации в зависимости от шага
        if (currentStep === 1) {
            btnCreatePrev.textContent = "Отмена";
            btnCreatePrev.className = "action-btn btn-cancel"; 
            btnCreateNext.textContent = "Далее \u203A";
            btnCreateNext.className = "action-btn btn-apply";
            createStepTitle.textContent = `Создание мира: Этап 1 из ${maxSteps}`;
        } else if (currentStep <= maxSteps) {
            btnCreatePrev.textContent = "\u2039 Назад";
            btnCreatePrev.className = "action-btn btn-apply"; // Кнопка «Назад» остается зеленой
            btnCreateNext.textContent = currentStep === maxSteps ? "Сгенерировать" : "Далее \u203A";
            btnCreateNext.className = "action-btn btn-apply";
            createStepTitle.textContent = `Создание мира: Этап ${currentStep} из ${maxSteps}`;
        } else if (currentStep === 4) {
            // Финальный экран: меняем текст на кнопке, полностью сохраняя её структуру
            createStepTitle.textContent = "Мир создан";
            btnCreatePrev.textContent = "Выйти в меню";
            btnCreatePrev.className = "action-btn btn-cancel"; // Выход в меню красный
            
            btnCreateNext.textContent = "Войти в игру";
            btnCreateNext.className = "action-btn btn-apply"; 
        }
    }

    // Вход на экран создания мира с принудительным сбросом шага на первый
    if (btnCreateWorld && mainScreen && createScreen) {
        btnCreateWorld.addEventListener('click', (e) => {
            e.preventDefault();
            currentStep = 1; // СБРОС: Каждое открытие экрана начинается строго с 1 этапа
            updateCreateStepUI();
            mainScreen.classList.remove('active');
            setTimeout(() => {
                createScreen.classList.add('active');
            }, 200);
        });
    }

    // Умный обработчик кнопки «Вперед / Сгенерировать / Войти в игру»
    if (btnCreateNext) {
        btnCreateNext.addEventListener('click', () => {
            if (currentStep < maxSteps) {
                // Шаг вперед на этапах 1 и 2
                currentStep++;
                updateCreateStepUI();
            } else if (currentStep === maxSteps) {
                // На 3 этапе генерируем файл сохранения и переходим на финал
                currentStep = 4;
                updateCreateStepUI();
            } else if (currentStep === 4) {
                // На 4 этапе кнопка работает как запуск игры и переносит все статы в лист персонажа
                const cName = document.getElementById('char-name').value || "Без имени";
                const cAppearance = document.getElementById('char-appearance').value || "Обычная приключенческая";

                const sStr = document.getElementById('stat-strength').value;
                const sEnd = document.getElementById('stat-endurance').value;
                const sAgl = document.getElementById('stat-agility').value;
                const sPwr = document.getElementById('stat-powers').value;
                const sChr = document.getElementById('stat-charisma').value;

                // Запись данных в нередактируемый игровой интерфейс
                document.getElementById('game-char-name').textContent = cName;
                document.getElementById('game-char-appearance').textContent = cAppearance;
                document.getElementById('game-char-inventory').textContent = "Пусто (Снаряжение собирается в игре)";
                
                document.getElementById('g-val-strength').textContent = sStr;
                document.getElementById('g-val-endurance').textContent = sEnd;
                document.getElementById('g-val-agility').textContent = sAgl;
                document.getElementById('g-val-powers').textContent = sPwr;
                document.getElementById('g-val-charisma').textContent = sChr;

                // Переключение экранов
                checkGameDevPanel(); 
                if (createScreen && gameScreen) {
                    createScreen.classList.remove('active');
                    setTimeout(() => {
                        gameScreen.classList.add('active');
                    }, 200);
                }
            }
        });
    }

    // Обработчик кнопки «Назад / Отмена / Выйти в меню»
    if (btnCreatePrev && mainScreen && createScreen) {
        btnCreatePrev.addEventListener('click', () => {
            if (currentStep === 1 || currentStep === 4) {
                // Из первого шага (Отмена) или финала (Выйти в меню) возвращаемся в главное меню
                createScreen.classList.remove('active');
                setTimeout(() => {
                    mainScreen.classList.add('active');
                }, 200);
            } else {
                // Из промежуточных шагов шагаем назад
                currentStep--;
                updateCreateStepUI();
            }
        });
    }

    // --- УПРАВЛЕНИЕ И АЛГОРИТМ ДЛЯ ПОЛУЗУНКОВ ХАРАКТЕРИСТИК ---
    const btnAutoBalance = document.getElementById('btn-auto-balance');
    const statSliders = document.querySelectorAll('.stat-slider');

    // Обновление цифр характеристик в реальном времени при ручном перетаскивании
    statSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valId = `val-${e.target.id.replace('stat-', '')}`;
            const valSpan = document.getElementById(valId);
            if (valSpan) valSpan.textContent = e.target.value;
        });
    });
    
    if (btnAutoBalance) {
        btnAutoBalance.addEventListener('click', () => {
            const slidersArray = [
                document.getElementById('stat-strength'),
                document.getElementById('stat-endurance'),
                document.getElementById('stat-agility'),
                document.getElementById('stat-powers'),
                document.getElementById('stat-charisma')
            ];

            const totalTargetPoints = 29; 
            const minVal = 1;
            const maxVal = 15;

            let currentAllocated = Array(slidersArray.length).fill(minVal);
            let remainingPoints = totalTargetPoints - (minVal * slidersArray.length);

            // Равномерное случайное распределение
            while (remainingPoints > 0) {
                const randomIndex = Math.floor(Math.random() * slidersArray.length);
                if (currentAllocated[randomIndex] < maxVal) {
                    currentAllocated[randomIndex]++;
                    remainingPoints--;
                }
            }

            // Перемещаем ползунки и обновляем текстовые значения
            slidersArray.forEach((slider, index) => {
                if (slider) {
                    slider.value = currentAllocated[index];
                    // Находим соответствующий текстовый span и меняем цифру
                    const valId = `val-${slider.id.replace('stat-', '')}`;
                    const valSpan = document.getElementById(valId);
                    if (valSpan) valSpan.textContent = currentAllocated[index];
                }
            });
        });
    }

 // --- ЛОГИКА ЭКРАНА СОХРАНЕНИЙ ---
    const btnContinue = document.getElementById('btn-continue');
    const savesScreen = document.getElementById('saves-screen');
    const btnSavesCancel = document.getElementById('saves-cancel');
    const savesContainer = document.getElementById('saves-list-container');

    // ТЕСТОВЫЙ БЛОК: 15 сохранений для проверки перемотки списка
    const mockSavesData = [
        { id: 1, name: "Древний Авалон" },
        { id: 2, name: "Забытые Земли Элдерии" },
        { id: 3, name: "Новый Порядок Сириуса" },
        { id: 4, name: "Цитадель Вальхаллы" },
        { id: 5, name: "Подземелья Мории" },
        { id: 6, name: "Звездный Рубеж" },
        { id: 7, name: "Оазис Селены" },
        { id: 8, name: "Туманный Альбион" },
        { id: 9, name: "Бастион Дракона" },
        { id: 10, name: "Хроники Пустоты" },
        { id: 11, name: "Затерянный Сектор" },
        { id: 12, name: "Огни Проксимы" },
        { id: 13, name: "Новая Атлантида" },
        { id: 14, name: "Замки Элизиума" },
        { id: 15, name: "Эхо Черной Дыры" }
    ];

    // Функция для отрисовки списка сохранений на экране
    function renderSavesList(saves) {
        if (!savesContainer) return;
        savesContainer.innerHTML = ""; 

        if (saves.length === 0) {
            savesContainer.innerHTML = `<p class="step-description" style="text-align:center; padding: 2vh 0;">Сохранения не найдены.</p>`;
            return;
        }

        saves.forEach(save => {
            const saveRow = document.createElement('div');
            saveRow.className = 'save-row';

            saveRow.innerHTML = `
                <span class="save-name">${save.name}</span>
                <div class="save-actions-group">
                    <!-- Кнопка Играть -->
                    <button class="save-action-icon btn-save-play" data-id="${save.id}" title="Играть">
                        <img src="media/icons/game.png" alt="Играть">
                    </button>
                    <!-- Кнопка Изменить -->
                    <button class="save-action-icon btn-save-edit" data-id="${save.id}" title="Изменить">
                        <img src="media/icons/pencil.png" alt="Изменить">
                    </button>
                    <!-- Кнопка Удалить -->
                    <button class="save-action-icon btn-save-delete" data-id="${save.id}" title="Удалить">
                        <img src="media/icons/trash.png" alt="Удалить">
                    </button>
                </div>
            `;
            savesContainer.appendChild(saveRow);
        });

        // Обработчики кликов на сгенерированные кнопки
        // Клик по кнопке «Играть» внутри списка сохранений
        document.querySelectorAll('.btn-save-play').forEach(btn => {
            btn.addEventListener('click', () => {
                checkGameDevPanel(); // Проверяем режим разработчика
                if (savesScreen && gameScreen) {
                    savesScreen.classList.remove('active');
                    setTimeout(() => { 
                        gameScreen.classList.add('active'); 
                    }, 200);
                }
            });
        });

        document.querySelectorAll('.btn-save-edit').forEach(btn => {
            btn.addEventListener('click', (e) => alert(`Редактирование сохранения ID: ${e.currentTarget.dataset.id}`));
        });
        document.querySelectorAll('.btn-save-delete').forEach(btn => {
            btn.addEventListener('click', (e) => alert(`Удаление сохранения ID: ${e.currentTarget.dataset.id}`));
        });
    }

    // Вход на экран списка сохранений
    if (btnContinue && mainScreen && savesScreen) {
        btnContinue.addEventListener('click', (e) => {
            e.preventDefault();
            renderSavesList(mockSavesData); 
            mainScreen.classList.remove('active');
            setTimeout(() => {
                savesScreen.classList.add('active');
            }, 200);
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
    const gameScreen = document.getElementById('game-screen');
    const btnGameExit = document.getElementById('game-exit-menu');
    const chatInput = document.getElementById('game-chat-input');
    const btnSendMessage = document.getElementById('btn-send-message');
    const chatMessagesBox = document.getElementById('chat-messages-box');
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

    // Подвязываем вход в игру из списка сохранений (пока как заглушка для интерфейса)
    // Заменим старый alert на полноценное переключение экрана
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
    }

    // Демонстрационная отправка сообщений в чат для проверки прокрутки
    function appendMessage(text, isUser) {
        if (!chatMessagesBox || !text.trim()) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = isUser ? 'msg msg-user' : 'msg msg-system';
        
        msgDiv.innerHTML = `
            <span class="msg-author">${isUser ? 'Вы:' : 'История:'}</span>
            <p class="msg-text">${text}</p>
        `;
        
        chatMessagesBox.appendChild(msgDiv);
        chatInput.value = "";
        
        // Автоматическая прокрутка чата вниз к новому сообщению
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }

    if (btnSendMessage && chatInput) {
        btnSendMessage.addEventListener('click', () => appendMessage(chatInput.value, true));
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') appendMessage(chatInput.value, true);
        });
    }
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