import { marked } from 'marked';

export class MafiaUiManager {
    constructor(mafiaGameManager, aiClient) {
        this.mafiaGameManager = mafiaGameManager;
        this.aiClient = aiClient;
        this.elements = {};
        this.currentPlayerId = null;
        this.playerActions = {};
        this.playerPromptHistory = {};
        this.language = 'en'; // Default language is English
        this.playerSettings = {}; // Store player-specific settings
        this.customPlayers = []; // Store custom player data
    }
    
    initializeUi(containerElement) {
        // Create main mafia game UI
        containerElement.innerHTML = `
            <div class="mafia-game-container">
                <div class="mafia-header">
                    <h2>${this.getTranslation('Neural Network Mafia Game')}</h2>
                    <div class="language-switcher">
                        <select id="language-selector">
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>
                    <div class="mafia-controls">
                        <div class="setup-controls">
                            <label for="player-count">${this.getTranslation('Number of Players')}:</label>
                            <div class="player-count-select">
                                <select id="player-count">
                                    <option value="4">4 ${this.getTranslation('Players')}</option>
                                    <option value="5">5 ${this.getTranslation('Players')}</option>
                                    <option value="6">6 ${this.getTranslation('Players')}</option>
                                    <option value="7">7 ${this.getTranslation('Players')}</option>
                                    <option value="8">8 ${this.getTranslation('Players')}</option>
                                </select>
                            </div>
                            <div class="mafia-count-control">
                                <label for="mafia-count">${this.getTranslation('Mafia count')}:</label>
                                <input type="number" id="mafia-count" min="1" max="3" value="1">
                            </div>
                            <div class="special-roles-control">
                                <label for="doctor-count">${this.getTranslation('Doctor count')}:</label>
                                <input type="number" id="doctor-count" min="0" max="2" value="0">
                                <label for="sheriff-count">${this.getTranslation('Sheriff count')}:</label>
                                <input type="number" id="sheriff-count" min="0" max="2" value="0">
                                <label for="detective-count">${this.getTranslation('Detective count')}:</label>
                                <input type="number" id="detective-count" min="0" max="2" value="0">
                            </div>
                            <div class="discussion-rounds-control">
                                <label for="discussion-rounds">${this.getTranslation('Discussion rounds')}:</label>
                                <input type="number" id="discussion-rounds" min="1" max="10" value="1">
                            </div>
                            <button id="toggle-player-settings" class="settings-toggle">${this.getTranslation('Player Settings')}</button>
                            <button id="start-mafia-game" class="btn">${this.getTranslation('Start Game')}</button>
                            <button id="exit-mafia-game" class="btn btn-secondary">${this.getTranslation('Exit Mafia Mode')}</button>
                            <button id="add-mafia-player" class="btn btn-secondary" style="margin-left: 10px;">${this.getTranslation('Add Custom Player')}</button>
                        </div>
                    </div>
                </div>
                
                <div id="player-settings-container" class="player-settings-container">
                    <h3 class="player-settings-header">${this.getTranslation('Neural Network Player Settings')}</h3>
                    <div id="player-settings-list">
                        <!-- Player settings will be dynamically added here -->
                    </div>
                </div>
                
                <div class="mafia-game-area">
                    <div class="mafia-game-log">
                        <h3>${this.getTranslation('Game Log')}</h3>
                        <div id="mafia-log-content"></div>
                    </div>
                    
                    <div class="mafia-game-board">
                        <div class="game-status-banner" id="game-status-banner">
                            <span id="game-status-text">${this.getTranslation('Set up your game')}</span>
                        </div>
                        
                        <div class="mafia-town">
                            <div id="mafia-players-container" class="mafia-players-container"></div>
                        </div>
                        
                        <div class="mafia-day-counter">
                            <div id="day-phase-indicator">
                                <div class="phase-icon">🌞</div>
                                <div class="phase-text">${this.getTranslation('Day')} <span id="day-number">0</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mafia-action-panel">
                        <h3>${this.getTranslation('Game Actions')}</h3>
                        <div id="mafia-action-container"></div>
                        <h3 class="thought-process-header">${this.getTranslation('Player Thoughts')}</h3>
                        <div id="thought-process-container" class="thought-process-container">
                            <select id="player-thought-selector"></select>
                            <div id="thought-process-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Save references to DOM elements
        this.elements = {
            playerCount: containerElement.querySelector('#player-count'),
            mafiaCount: containerElement.querySelector('#mafia-count'),
            doctorCount: containerElement.querySelector('#doctor-count'),
            sheriffCount: containerElement.querySelector('#sheriff-count'),
            detectiveCount: containerElement.querySelector('#detective-count'),
            discussionRounds: containerElement.querySelector('#discussion-rounds'),
            startGameBtn: containerElement.querySelector('#start-mafia-game'),
            exitGameBtn: containerElement.querySelector('#exit-mafia-game'),
            logContent: containerElement.querySelector('#mafia-log-content'),
            playersContainer: containerElement.querySelector('#mafia-players-container'),
            actionContainer: containerElement.querySelector('#mafia-action-container'),
            gameStatusBanner: containerElement.querySelector('#game-status-banner'),
            gameStatusText: containerElement.querySelector('#game-status-text'),
            dayNumber: containerElement.querySelector('#day-number'),
            dayPhaseIndicator: containerElement.querySelector('#day-phase-indicator'),
            languageSelector: containerElement.querySelector('#language-selector'),
            thoughtProcessContainer: containerElement.querySelector('#thought-process-container'),
            thoughtProcessContent: containerElement.querySelector('#thought-process-content'),
            playerThoughtSelector: containerElement.querySelector('#player-thought-selector'),
            togglePlayerSettings: containerElement.querySelector('#toggle-player-settings'),
            playerSettingsContainer: containerElement.querySelector('#player-settings-container'),
            playerSettingsList: containerElement.querySelector('#player-settings-list'),
            addPlayerBtn: containerElement.querySelector('#add-mafia-player')
        };
        
        // Add event listeners
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.exitGameBtn.addEventListener('click', () => this.exitGame());
        this.elements.languageSelector.addEventListener('change', () => this.changeLanguage());
        this.elements.playerCount.addEventListener('change', () => {
            this.updateMafiaCountLimits();
            this.updateSpecialRoleLimits();
            this.updatePlayerSettings();
        });
        this.elements.playerThoughtSelector.addEventListener('change', () => this.displaySelectedPlayerThoughts());
        this.elements.togglePlayerSettings.addEventListener('click', () => this.togglePlayerSettings());
        this.elements.addPlayerBtn.addEventListener('click', () => this.addNewMafiaPlayer());
        
        // Initialize player count / mafia count relationship
        this.updateMafiaCountLimits();
        this.updateSpecialRoleLimits();
        
        // Initialize player settings
        this.updatePlayerSettings();
    }
    
    updateMafiaCountLimits() {
        const playerCount = parseInt(this.elements.playerCount.value);
        // Maximum mafia should be less than half the players
        const maxMafia = Math.floor(playerCount / 2) - 1;
        this.elements.mafiaCount.max = Math.max(1, maxMafia);
        
        // Adjust current value if needed
        if (parseInt(this.elements.mafiaCount.value) > parseInt(this.elements.mafiaCount.max)) {
            this.elements.mafiaCount.value = this.elements.mafiaCount.max;
        }
    }
    
    updateSpecialRoleLimits() {
        const playerCount = parseInt(this.elements.playerCount.value);
        const mafiaCount = parseInt(this.elements.mafiaCount.value);
        
        // At least one regular civilian required
        const maxSpecialRoles = playerCount - mafiaCount - 1;
        
        this.elements.doctorCount.max = Math.min(2, maxSpecialRoles);
        this.elements.sheriffCount.max = Math.min(2, maxSpecialRoles);
        this.elements.detectiveCount.max = Math.min(2, maxSpecialRoles);
        
        // Adjust current values if needed
        if (parseInt(this.elements.doctorCount.value) > parseInt(this.elements.doctorCount.max)) {
            this.elements.doctorCount.value = this.elements.doctorCount.max;
        }
        if (parseInt(this.elements.sheriffCount.value) > parseInt(this.elements.sheriffCount.max)) {
            this.elements.sheriffCount.value = this.elements.sheriffCount.max;
        }
        if (parseInt(this.elements.detectiveCount.value) > parseInt(this.elements.detectiveCount.max)) {
            this.elements.detectiveCount.value = this.elements.detectiveCount.max;
        }
    }
    
    togglePlayerSettings() {
        this.elements.playerSettingsContainer.classList.toggle('visible');
        this.elements.togglePlayerSettings.textContent = 
            this.elements.playerSettingsContainer.classList.contains('visible') 
                ? this.getTranslation('Hide Settings') 
                : this.getTranslation('Player Settings');
    }
    
    updatePlayerSettings() {
        const playerCount = parseInt(this.elements.playerCount.value);
        const settingsList = this.elements.playerSettingsList;
        
        // Clear existing settings
        settingsList.innerHTML = '';
        
        // Create settings for each player
        for (let i = 1; i <= playerCount; i++) {
            const playerId = `player${i}`;
            
            // Initialize settings if not already set
            if (!this.playerSettings[playerId]) {
                this.playerSettings[playerId] = {
                    temperature: 0.7,
                    maxTokens: 300,
                    creativityLevel: 'normal',
                    systemPrompt: ''
                };
            }
            
            const settings = this.playerSettings[playerId];
            const networkName = `${this.getTranslation('Network')} ${i}`;
            
            const playerSettingsDiv = document.createElement('div');
            playerSettingsDiv.className = 'player-settings';
            playerSettingsDiv.innerHTML = `
                <h4>${networkName}</h4>
                <div class="form-group">
                    <label for="system-prompt-${playerId}">${this.getTranslation('System Prompt')}:</label>
                    <textarea id="system-prompt-${playerId}" placeholder="${this.getTranslation('Custom system prompt for this player')}" class="system-prompt-textarea">${settings.systemPrompt || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="temperature-${playerId}">${this.getTranslation('Temperature')}:</label>
                    <div class="slider-container">
                        <input type="range" id="temperature-${playerId}" min="1" max="20" value="${Math.round(settings.temperature * 10)}" class="slider" step="1">
                        <span id="temperature-value-${playerId}">${settings.temperature.toFixed(1)}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="max-tokens-${playerId}">${this.getTranslation('Max Tokens')}:</label>
                    <div class="slider-container">
                        <input type="range" id="max-tokens-${playerId}" min="100" max="1000" value="${settings.maxTokens}" class="slider" step="100">
                        <span id="max-tokens-value-${playerId}">${settings.maxTokens}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="creativity-${playerId}">${this.getTranslation('Creativity Level')}:</label>
                    <select id="creativity-${playerId}" class="creativity-select">
                        <option value="low" ${settings.creativityLevel === 'low' ? 'selected' : ''}>${this.getTranslation('Low')}</option>
                        <option value="normal" ${settings.creativityLevel === 'normal' ? 'selected' : ''}>${this.getTranslation('Normal')}</option>
                        <option value="high" ${settings.creativityLevel === 'high' ? 'selected' : ''}>${this.getTranslation('High')}</option>
                    </select>
                </div>
            `;
            
            settingsList.appendChild(playerSettingsDiv);
            
            // Add event listeners for this player's settings
            const temperatureSlider = document.getElementById(`temperature-${playerId}`);
            const temperatureValue = document.getElementById(`temperature-value-${playerId}`);
            const maxTokensSlider = document.getElementById(`max-tokens-${playerId}`);
            const maxTokensValue = document.getElementById(`max-tokens-value-${playerId}`);
            const creativitySelect = document.getElementById(`creativity-${playerId}`);
            const systemPromptTextarea = document.getElementById(`system-prompt-${playerId}`);
            
            temperatureSlider.addEventListener('input', () => {
                const value = parseFloat(temperatureSlider.value) / 10;
                temperatureValue.textContent = value.toFixed(1);
                this.playerSettings[playerId].temperature = value;
            });
            
            maxTokensSlider.addEventListener('input', () => {
                const value = parseInt(maxTokensSlider.value);
                maxTokensValue.textContent = value;
                this.playerSettings[playerId].maxTokens = value;
            });
            
            creativitySelect.addEventListener('change', () => {
                this.playerSettings[playerId].creativityLevel = creativitySelect.value;
            });
            
            systemPromptTextarea.addEventListener('change', () => {
                this.playerSettings[playerId].systemPrompt = systemPromptTextarea.value;
            });
        }
    }
    
    changeLanguage() {
        this.language = this.elements.languageSelector.value;
        // Re-initialize UI with new language
        this.initializeUi(document.querySelector('.mafia-container'));
        
        // Re-render players if game is in progress
        if (this.mafiaGameManager.players.length > 0) {
            this.renderPlayers(this.mafiaGameManager.players);
            this.updatePlayerStatus(this.mafiaGameManager.players);
            
            // Update game status text based on current state
            this.updateGameStatusText();
            
            // Re-populate thought process selector
            this.populateThoughtProcessSelector();
        }
    }
    
    getTranslation(text) {
        const translations = {
            'Neural Network Mafia Game': {
                'ru': 'Игра Мафия для Нейронных Сетей'
            },
            'Number of Players': {
                'ru': 'Количество игроков'
            },
            'Players': {
                'ru': 'Игроков'
            },
            'Mafia count': {
                'ru': 'Количество мафии'
            },
            'Doctor count': {
                'ru': 'Количество докторов'
            },
            'Sheriff count': {
                'ru': 'Количество шерифов'
            },
            'Detective count': {
                'ru': 'Количество детективов'
            },
            'Start Game': {
                'ru': 'Начать игру'
            },
            'Exit Mafia Mode': {
                'ru': 'Выйти из режима Мафии'
            },
            'Game Log': {
                'ru': 'Журнал игры'
            },
            'Game Actions': {
                'ru': 'Игровые действия'
            },
            'Set up your game': {
                'ru': 'Настройте вашу игру'
            },
            'Day': {
                'ru': 'День'
            },
            'Night': {
                'ru': 'Ночь'
            },
            'Player Thoughts': {
                'ru': 'Мысли игроков'
            },
            'Select player': {
                'ru': 'Выберите игрока'
            },
            'Alive': {
                'ru': 'Жив'
            },
            'Dead': {
                'ru': 'Мертв'
            },
            'System': {
                'ru': 'Система'
            },
            'Game over': {
                'ru': 'Игра окончена'
            },
            'All mafia members have been eliminated. Civilians win!': {
                'ru': 'Все члены мафии были устранены. Мирные жители победили!'
            },
            'Mafia members equal or outnumber civilians. Mafia wins!': {
                'ru': 'Количество мафии равно или превышает количество мирных жителей. Мафия победила!'
            },
            'was killed during the night': {
                'ru': 'был убит ночью'
            },
            'were killed during the night': {
                'ru': 'были убиты ночью'
            },
            'No one was killed': {
                'ru': 'Никто не был убит'
            },
            'votes to eliminate': {
                'ru': 'голосует за устранение'
            },
            'was voted out and revealed to be a': {
                'ru': 'был изгнан и оказался'
            },
            'The vote was tied. No one was eliminated': {
                'ru': 'Голоса разделились поровну. Никто не был исключен'
            },
            'mafia': {
                'ru': 'мафией'
            },
            'civilian': {
                'ru': 'мирным жителем'
            },
            'doctor': {
                'ru': 'доктором'
            },
            'sheriff': {
                'ru': 'шерифом'
            },
            'detective': {
                'ru': 'детективом'
            },
            'Play Again': {
                'ru': 'Играть снова'
            },
            'Discussion rounds': {
                'ru': 'Раунды обсуждения'
            },
            'Temperature': {
                'ru': 'Температура'
            },
            'Max Tokens': {
                'ru': 'Максимальное количество токенов'
            },
            'Creativity Level': {
                'ru': 'Уровень креативности'
            },
            'Low': {
                'ru': 'Низкий'
            },
            'Normal': {
                'ru': 'Нормальный'
            },
            'High': {
                'ru': 'Высокий'
            },
            'Network': {
                'ru': 'Сеть'
            },
            'Player Settings': {
                'ru': 'Настройки игроков'
            },
            'Hide Settings': {
                'ru': 'Скрыть настройки'
            },
            'System Prompt': {
                'ru': 'Системный промпт'
            },
            'Custom system prompt for this player': {
                'ru': 'Пользовательский системный промпт для этого игрока'
            },
            'Add Custom Player': {
                'ru': 'Добавить игрока'
            },
            'Add New Player': {
                'ru': 'Добавить нового игрока'
            },
            'Player Name': {
                'ru': 'Имя игрока'
            },
            'Player Color': {
                'ru': 'Цвет игрока'
            },
            'Player System Prompt': {
                'ru': 'Системный промпт игрока'
            },
            'Custom Player': {
                'ru': 'Пользовательский игрок'
            },
            'Add Player': {
                'ru': 'Добавить игрока'
            },
            'Cancel': {
                'ru': 'Отмена'
            },
            'Maximum player count reached (16).': {
                'ru': 'Достигнуто максимальное количество игроков (16).'
            },
            'Added new player': {
                'ru': 'Добавлен новый игрок'
            }
        };
        
        if (this.language === 'en' || !translations[text] || !translations[text][this.language]) {
            return text;
        }
        
        return translations[text][this.language];
    }
    
    populateThoughtProcessSelector() {
        const selector = this.elements.playerThoughtSelector;
        selector.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = this.getTranslation('Select player');
        selector.appendChild(defaultOption);
        
        // Add an option for each player
        this.mafiaGameManager.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            selector.appendChild(option);
        });
    }
    
    displaySelectedPlayerThoughts() {
        const playerId = this.elements.playerThoughtSelector.value;
        const thoughtContent = this.elements.thoughtProcessContent;
        
        if (!playerId) {
            thoughtContent.innerHTML = '';
            return;
        }
        
        const thoughts = this.playerPromptHistory[playerId] || '';
        thoughtContent.innerHTML = thoughts.replace(/\n/g, '<br>');
    }
    
    updateGameStatusText() {
        const gameState = this.mafiaGameManager.gameState;
        const dayCount = this.mafiaGameManager.dayCount;
        
        if (gameState === 'night') {
            this.elements.gameStatusText.textContent = `🌙 ${this.getTranslation('Night')} ${dayCount}: ${this.getTranslation('The town sleeps while everyone performs their night actions')}`;
        } else if (gameState === 'day') {
            this.elements.gameStatusText.textContent = `🌞 ${this.getTranslation('Day')} ${dayCount}: ${this.getTranslation('The town wakes up to discuss who might be the mafia')}`;
        } else if (gameState === 'voting') {
            this.elements.gameStatusText.textContent = `🗳️ ${this.getTranslation('Day')} ${dayCount}: ${this.getTranslation('Voting phase - Players decide who to eliminate')}`;
        } else if (gameState === 'finished') {
            // This is handled in endGame
        } else {
            this.elements.gameStatusText.textContent = this.getTranslation('Set up your game');
        }
    }
    
    async startGame() {
        const playerCount = parseInt(this.elements.playerCount.value, 10);
        const mafiaCount = parseInt(this.elements.mafiaCount.value, 10);
        const doctorCount = parseInt(this.elements.doctorCount.value, 10);
        const sheriffCount = parseInt(this.elements.sheriffCount.value, 10);
        const detectiveCount = parseInt(this.elements.detectiveCount.value, 10);
        const discussionRounds = parseInt(this.elements.discussionRounds.value, 10);
        
        // Validate mafia count
        if (mafiaCount >= playerCount / 2) {
            this.addLogMessage('System', this.getTranslation('Too many mafia members! Please reduce the mafia count.'));
            return;
        }
        
        // Validate special roles count
        const specialRolesCount = doctorCount + sheriffCount + detectiveCount;
        if (specialRolesCount + mafiaCount >= playerCount) {
            this.addLogMessage('System', this.getTranslation('Too many special roles! Please reduce the number of special roles.'));
            return;
        }
        
        // Set discussion rounds
        this.mafiaGameManager.setDiscussionRounds(discussionRounds);
        
        const gameSetup = this.mafiaGameManager.setupGame(playerCount, mafiaCount, doctorCount, sheriffCount, detectiveCount);
        
        // Update UI to show players
        this.renderPlayers(gameSetup.players);
        
        // Update game status
        this.elements.gameStatusText.textContent = this.getTranslation('Game setup complete - starting night phase');
        this.elements.dayNumber.textContent = '1';
        
        // Add setup message to log
        const setupMessage = `${this.getTranslation('Game started with')} ${gameSetup.playerCount} ${this.getTranslation('players')}: ` +
            `${gameSetup.civilianCount} ${this.getTranslation('civilians')}, ` +
            `${gameSetup.mafiaCount} ${this.getTranslation('mafia')}, ` +
            `${gameSetup.doctorCount} ${this.getTranslation('doctor')}, ` +
            `${gameSetup.sheriffCount} ${this.getTranslation('sheriff')}, ` +
            `${gameSetup.detectiveCount} ${this.getTranslation('detective')}.`;
        
        this.addLogMessage('System', setupMessage);
        
        // Start the game
        const nightInstructions = this.mafiaGameManager.startGame();
        
        // Update UI for night phase
        this.updatePhaseIndicator('night');
        this.elements.gameStatusText.textContent = `🌙 ${this.getTranslation('Night')} 1: ${this.getTranslation('The town sleeps while everyone performs their night actions')}`;
        
        // Populate thought process selector
        this.populateThoughtProcessSelector();
        
        // Get actions from each player
        await this.processNightActions(nightInstructions);
    }
    
    renderPlayers(players) {
        this.elements.playersContainer.innerHTML = '';
        
        players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = `mafia-player ${player.alive ? 'alive' : 'dead'}`;
            playerEl.id = `player-${player.id}`;
            playerEl.innerHTML = `
                <div class="player-avatar" style="background-color: ${player.color}">
                    <span class="player-initial">${player.name.charAt(0)}</span>
                </div>
                <div class="player-name">${player.name}</div>
                <div class="player-status">${player.alive ? this.getTranslation('Alive') : this.getTranslation('Dead')}</div>
            `;
            this.elements.playersContainer.appendChild(playerEl);
        });
    }
    
    updatePlayerStatus(players) {
        players.forEach(player => {
            const playerEl = document.getElementById(`player-${player.id}`);
            if (playerEl) {
                if (player.alive) {
                    playerEl.classList.add('alive');
                    playerEl.classList.remove('dead');
                } else {
                    playerEl.classList.add('dead');
                    playerEl.classList.remove('alive');
                }
                const statusEl = playerEl.querySelector('.player-status');
                if (statusEl) {
                    statusEl.textContent = player.alive ? this.getTranslation('Alive') : this.getTranslation('Dead');
                }
            }
        });
    }
    
    addLogMessage(sender, message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = new Date().toLocaleTimeString();
        
        if (sender === 'System') {
            logEntry.innerHTML = `<div class="log-system-message">[${timestamp}] ${this.getTranslation('System')}: ${message}</div>`;
        } else {
            logEntry.innerHTML = `
                <div class="log-sender">[${timestamp}] ${sender}:</div>
                <div class="log-message">${message}</div>
            `;
        }
        
        this.elements.logContent.appendChild(logEntry);
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
    }
    
    async getMafiaAction(playerId, instructions) {
        this.currentPlayerId = playerId;
        
        // Create a special prompt for the mafia player
        const playerData = this.mafiaGameManager.players.find(p => p.id === playerId);
        const gameState = this.mafiaGameManager.getGameStatus();
        
        // Build context from game state
        let context = this.language === 'ru' 
            ? `Вы играете за ${playerData.name} в игре Мафия.\n\n`
            : `You are playing as ${playerData.name} in a Mafia game.\n\n`;
            
        context += this.language === 'ru'
            ? `Сейчас Ночь ${gameState.dayCount}.\n\n`
            : `It is Night ${gameState.dayCount}.\n\n`;
            
        context += this.language === 'ru'
            ? `ВЫ МАФИЯ. Ваша цель - устранить мирных жителей, не раскрывая свою личность.\n\n`
            : `YOU ARE MAFIA. Your goal is to eliminate civilians without revealing your identity.\n\n`;
        
        if (instructions.fellowMafia.length > 0) {
            context += this.language === 'ru'
                ? `Ваши товарищи по мафии: ${instructions.fellowMafia.join(', ')}.\n\n`
                : `Your fellow mafia members are: ${instructions.fellowMafia.join(', ')}.\n\n`;
        } else {
            context += this.language === 'ru'
                ? `Вы единственный оставшийся член мафии.\n\n`
                : `You are the only mafia member left.\n\n`;
        }
        
        context += this.language === 'ru'
            ? `Живые игроки: ${gameState.alivePlayers.map(p => p.name).join(', ')}.\n\n`
            : `Alive players: ${gameState.alivePlayers.map(p => p.name).join(', ')}.\n\n`;
        
        if (gameState.eliminatedPlayers.length > 0) {
            context += this.language === 'ru'
                ? `Устраненные игроки: ${gameState.eliminatedPlayers.map(p => `${p.name} (${this.getTranslation(p.role)})`).join(', ')}.\n\n`
                : `Eliminated players: ${gameState.eliminatedPlayers.map(p => `${p.name} (${p.role})`).join(', ')}.\n\n`;
        }
        
        context += this.language === 'ru' ? `Недавние события в игре:\n` : `Recent game events:\n`;
        const recentLogs = gameState.gameLog.slice(-5);
        recentLogs.forEach(log => {
            context += this.language === 'ru'
                ? `- День ${log.day}: ${log.message}\n`
                : `- Day ${log.day}: ${log.message}\n`;
        });
        
        // Add analysis of player behavior to help mafia choose targets
        context += this.language === 'ru'
            ? `\nАнализ поведения игроков:\n`
            : `\nAnalysis of player behavior:\n`;
            
        const logEntries = Array.from(this.elements.logContent.querySelectorAll('.log-entry'));
        const playerMessages = {};
        
        // Collect recent messages from each player
        logEntries.forEach(entry => {
            const text = entry.textContent;
            
            // Skip system messages
            if (!text.includes('[System]')) {
                // Extract player name from log entry
                const match = text.match(/\[(.*?)\] (.*?):/);
                if (match && match[2] && match[2] !== 'System') {
                    const playerName = match[2];
                    if (!playerMessages[playerName]) {
                        playerMessages[playerName] = [];
                    }
                    playerMessages[playerName].push(text);
                }
            }
        });
        
        // Add brief analysis for each player
        instructions.targets.forEach(target => {
            const messages = playerMessages[target.name] || [];
            context += this.language === 'ru'
                ? `- ${target.name}: ${messages.length > 0 ? `Сказал ${messages.length} сообщений.` : 'Еще не говорил.'} `
                : `- ${target.name}: ${messages.length > 0 ? `Said ${messages.length} messages.` : 'Has not spoken yet.'} `;
                
            // Add if they voted against this mafia player
            const votedAgainstMafia = logEntries.some(entry => {
                const text = entry.textContent;
                return text.includes(`${target.name} ${this.getTranslation('votes to eliminate')} ${playerData.name}`);
            });
            
            if (votedAgainstMafia) {
                context += this.language === 'ru'
                    ? `Голосовал против вас. `
                    : `Voted against you. `;
            }
            
            // Add if they seem suspicious of mafia
            const suspiciousOfMafia = messages.some(msg => 
                msg.toLowerCase().includes('подозр') || 
                msg.toLowerCase().includes('мафи') ||
                msg.toLowerCase().includes('suspici') || 
                msg.toLowerCase().includes('mafia')
            );
            
            if (suspiciousOfMafia) {
                context += this.language === 'ru'
                    ? `Кажется, подозревает мафию. `
                    : `Seems suspicious of mafia members. `;
            }
            
            context += '\n';
        });
        
        context += this.language === 'ru'
            ? `\nВы должны выбрать ОДНОГО игрока, которого хотите убить сегодня ночью. Тщательно обдумайте ваш выбор. Рекомендуется убить тех, кто подозревает мафию или голосовал против вас. Ваши возможные цели:\n`
            : `\nYou must choose ONE player to kill tonight. Consider your choice carefully. It's recommended to kill those who suspect the mafia or voted against you. Your available targets are:\n`;
            
        instructions.targets.forEach((target, index) => {
            context += `${index + 1}. ${target.name}\n`;
        });
        
        context += this.language === 'ru'
            ? `\nВажно: НЕ РАСКРЫВАЙТЕ, что вы мафия, в любых своих сообщениях. Храните свою роль в тайне.\n`
            : `\nImportant: DO NOT REVEAL that you are mafia in any of your messages. Keep your role secret.\n`;
            
        context += this.language === 'ru'
            ? `Ответьте ТОЛЬКО НОМЕРОМ игрока, которого вы хотите убить сегодня ночью. Также кратко объясните (себе) причину выбора.`
            : `Respond with ONLY the NUMBER of the player you want to kill tonight. Also briefly explain (to yourself) the reason for your choice.`;
        
        // If this is not the first night, add prompt history
        if (this.playerPromptHistory[playerId]) {
            context += this.language === 'ru'
                ? `\n\nВаши предыдущие мысли (личные, только для вас):\n${this.playerPromptHistory[playerId]}`
                : `\n\nYour previous thoughts (private to you):\n${this.playerPromptHistory[playerId]}`;
        }
        
        try {
            // Get the mafia player's response using the updated method
            const response = await this.getChatCompletion(playerId, context, 0.7, this.language);
            
            // Extract the target number from the response
            const targetNumber = this.extractNumber(response);
            
            if (targetNumber !== null && targetNumber >= 1 && targetNumber <= instructions.targets.length) {
                const targetIndex = targetNumber - 1;
                const target = instructions.targets[targetIndex];
                
                // Record this action
                this.mafiaGameManager.submitNightAction(playerId, target.id);
                
                // Log privately (not shown to other players)
                if (!this.playerPromptHistory[playerId]) {
                    this.playerPromptHistory[playerId] = '';
                }
                
                const thoughtEntry = this.language === 'ru'
                    ? `Ночь ${gameState.dayCount}: Я решил убить ${target.name}. Причина: ${response}\n`
                    : `Night ${gameState.dayCount}: I chose to kill ${target.name}. Reason: ${response}\n`;
                    
                this.playerPromptHistory[playerId] += thoughtEntry;
                
                // Update the thought process display if this player is selected
                if (this.elements.playerThoughtSelector.value === playerId) {
                    this.displaySelectedPlayerThoughts();
                }
                
                return true;
            } else {
                // Invalid response, try again with more forceful instructions
                const retryContext = this.language === 'ru'
                    ? context + "\n\nВаш предыдущий ответ был неверным. Вы ДОЛЖНЫ ответить ТОЛЬКО числом от 1 до " + 
                      instructions.targets.length + ", представляющим вашу цель. Пожалуйста, попробуйте снова."
                    : context + "\n\nYour previous response was invalid. You MUST respond with ONLY a number between 1 and " + 
                      instructions.targets.length + " representing your target. Please try again.";
                
                const retryResponse = await this.getChatCompletion(playerId, retryContext, 0.7, this.language);
                const retryTargetNumber = this.extractNumber(retryResponse);
                
                if (retryTargetNumber !== null && retryTargetNumber >= 1 && retryTargetNumber <= instructions.targets.length) {
                    const targetIndex = retryTargetNumber - 1;
                    const target = instructions.targets[targetIndex];
                    
                    // Record this action
                    this.mafiaGameManager.submitNightAction(playerId, target.id);
                    
                    // Log privately
                    if (!this.playerPromptHistory[playerId]) {
                        this.playerPromptHistory[playerId] = '';
                    }
                    
                    const thoughtEntry = this.language === 'ru'
                        ? `Ночь ${gameState.dayCount}: Я решил убить ${target.name}. Причина: ${retryResponse}\n`
                        : `Night ${gameState.dayCount}: I chose to kill ${target.name}. Reason: ${retryResponse}\n`;
                        
                    this.playerPromptHistory[playerId] += thoughtEntry;
                    
                    // Update thought display
                    if (this.elements.playerThoughtSelector.value === playerId) {
                        this.displaySelectedPlayerThoughts();
                    }
                    
                    return true;
                } else {
                    // If still invalid, pick a target with strategic consideration
                    // Choose the first player who voted against mafia or seemed suspicious
                    let targetIndex = 0;
                    for (let i = 0; i < instructions.targets.length; i++) {
                        const target = instructions.targets[i];
                        const votedAgainstMafia = logEntries.some(entry => {
                            const text = entry.textContent;
                            return text.includes(`${target.name} ${this.getTranslation('votes to eliminate')} ${playerData.name}`);
                        });
                        
                        if (votedAgainstMafia) {
                            targetIndex = i;
                            break;
                        }
                    }
                    
                    const target = instructions.targets[targetIndex];
                    
                    // Record this action
                    this.mafiaGameManager.submitNightAction(playerId, target.id);
                    
                    // Log privately
                    if (!this.playerPromptHistory[playerId]) {
                        this.playerPromptHistory[playerId] = '';
                    }
                    
                    const thoughtEntry = this.language === 'ru'
                        ? `Ночь ${gameState.dayCount}: Я выбрал ${target.name} в качестве стратегической цели.\n`
                        : `Night ${gameState.dayCount}: I chose ${target.name} as a strategic target.\n`;
                        
                    this.playerPromptHistory[playerId] += thoughtEntry;
                    
                    // Update thought display
                    if (this.elements.playerThoughtSelector.value === playerId) {
                        this.displaySelectedPlayerThoughts();
                    }
                    
                    return true;
                }
            }
        } catch (error) {
            console.error("Error getting mafia action:", error);
            
            // Pick a strategic target as fallback
            let targetIndex = 0;
            // Try to find someone who voted against this mafia player
            const logEntries = Array.from(this.elements.logContent.querySelectorAll('.log-entry'));
            for (let i = 0; i < instructions.targets.length; i++) {
                const target = instructions.targets[i];
                const votedAgainstMafia = logEntries.some(entry => {
                    const text = entry.textContent;
                    return text.includes(`${target.name} ${this.getTranslation('votes to eliminate')} ${playerData.name}`);
                });
                
                if (votedAgainstMafia) {
                    targetIndex = i;
                    break;
                }
            }
            
            const target = instructions.targets[targetIndex];
            
            // Record this action
            this.mafiaGameManager.submitNightAction(playerId, target.id);
            
            // Log privately
            if (!this.playerPromptHistory[playerId]) {
                this.playerPromptHistory[playerId] = '';
            }
            
            const thoughtEntry = this.language === 'ru'
                ? `Ночь ${gameState.dayCount}: Выбрал стратегическую цель - ${target.name}.\n`
                : `Night ${gameState.dayCount}: Selected strategic target - ${target.name}.\n`;
                
            this.playerPromptHistory[playerId] += thoughtEntry;
            
            // Update thought display
            if (this.elements.playerThoughtSelector.value === playerId) {
                this.displaySelectedPlayerThoughts();
            }
            
            return true;
        }
    }
    
    async getCivilianAction(playerId, instructions) {
        // Civilians don't take actions at night
        this.currentPlayerId = playerId;
        
        // Create a minimal prompt history entry for civilians
        const playerData = this.mafiaGameManager.players.find(p => p.id === playerId);
        const gameState = this.mafiaGameManager.getGameStatus();
        
        if (!this.playerPromptHistory[playerId]) {
            this.playerPromptHistory[playerId] = '';
        }
        
        this.playerPromptHistory[playerId] += this.language === 'ru'
            ? `Ночь ${gameState.dayCount}: Я спал всю ночь как мирный житель.\n`
            : `Night ${gameState.dayCount}: I slept through the night as a civilian.\n`;
        
        return true;
    }
    
    clearPlayerActions() {
        this.playerActions = {};
    }
    
    exitGame() {
        // Redirect back to main app UI
        window.location.hash = '';
        location.reload();
    }
    
    async getChatCompletion(playerId, context, temperature = null, language = 'en') {
        try {
            // Get player-specific settings
            const settings = this.playerSettings[playerId] || {
                temperature: 0.7,
                maxTokens: 300,
                systemPrompt: ''
            };
            
            // Apply specific settings based on creativity level
            if (settings.creativityLevel === 'high') {
                settings.temperature = Math.min(1.0, settings.temperature + 0.2);
            } else if (settings.creativityLevel === 'low') {
                settings.temperature = Math.max(0.3, settings.temperature - 0.2);
            }
            
            // Use provided temperature or player's settings
            const tempToUse = temperature !== null ? temperature : settings.temperature;
            
            // Get system prompt
            let systemPrompt = language === 'ru'
                ? "Вы играете за персонажа в игре Мафия. Отвечайте как ваш персонаж, основываясь на информации об игре. Держите свою роль в секрете, если вы член мафии. Никогда прямо не указывайте свою роль. Отвечайте содержательно и вдумчиво, избегая шаблонных и общих ответов."
                : "You are playing a character in a Mafia game. Respond as your character would, based on the game information. Keep your role secret if you are a mafia member. Never directly state your role. Give thoughtful and meaningful responses, avoiding generic answers.";
                
            // Use custom system prompt if provided
            if (settings.systemPrompt && settings.systemPrompt.trim()) {
                systemPrompt = settings.systemPrompt;
            }
            
            // Use the aiClient directly
            const response = await this.aiClient.getChatCompletion(context, tempToUse, language);
            
            return response;
        } catch (error) {
            console.error("Error in MafiaUiManager.getChatCompletion:", error);
            return language === 'ru' 
                ? "Я обдумываю ситуацию и скоро отвечу."
                : "I'm thinking about the situation and will respond soon.";
        }
    }
    
    extractNumber(text) {
        // First, try to find a standalone number
        const standaloneMatch = text.match(/^[\s]*(\d+)[\s]*$/);
        if (standaloneMatch) {
            return parseInt(standaloneMatch[1], 10);
        }
        
        // Then look for numbers with simple context
        const contextMatch = text.match(/(?:number|#|choice|player|target|vote for|eliminate|kill)[\s]*(?:is|:)?[\s]*(\d+)/i);
        if (contextMatch) {
            return parseInt(contextMatch[1], 10);
        }
        
        // Last resort: find any number in the text
        const anyNumberMatch = text.match(/\d+/);
        if (anyNumberMatch) {
            return parseInt(anyNumberMatch[0], 10);
        }
        
        return null;
    }
    
    async getPlayerDayAction(playerId, currentRound = 1, totalRounds = 1) {
        const playerData = this.mafiaGameManager.players.find(p => p.id === playerId);
        const playerRole = this.mafiaGameManager.getRoleForPlayer(playerId);
        const gameState = this.mafiaGameManager.getGameStatus();
        
        // Build context for the player
        let context = this.language === 'ru' 
            ? `Вы играете за ${playerData.name} в игре Мафия.\n\n`
            : `You are playing as ${playerData.name} in a Mafia game.\n\n`;
            
        context += this.language === 'ru'
            ? `Сейчас День ${gameState.dayCount}, раунд обсуждения ${currentRound} из ${totalRounds}.\n\n`
            : `It is Day ${gameState.dayCount}, discussion round ${currentRound} of ${totalRounds}.\n\n`;
        
        if (playerRole === 'mafia') {
            context += this.language === 'ru'
                ? `ВЫ МАФИЯ. Голосуйте стратегически, чтобы защитить себя и других членов мафии.\n\n`
                : `YOU ARE MAFIA. Vote strategically to protect yourself and other mafia members.\n\n`;
            
            // Get fellow mafia members
            const fellowMafia = [];
            for (let i = 0; i < this.mafiaGameManager.players.length; i++) {
                const player = this.mafiaGameManager.players[i];
                if (player.alive && player.id !== playerId && this.mafiaGameManager.getRoleForPlayer(player.id) === 'mafia') {
                    fellowMafia.push(player.name);
                }
            }
            
            if (fellowMafia.length > 0) {
                context += this.language === 'ru'
                    ? `Не голосуйте за своих товарищей по мафии: ${fellowMafia.join(', ')}.\n\n`
                    : `Do not vote for your fellow mafia members: ${fellowMafia.join(', ')}.\n\n`;
            }
        } else {
            context += this.language === 'ru'
                ? `ВЫ МИРНЫЙ ЖИТЕЛЬ. Голосуйте за того, кто, по вашему мнению, наиболее вероятно является мафией, основываясь на обсуждении.\n\n`
                : `YOU ARE A CIVILIAN. Vote for who you think is most likely to be mafia based on the discussion.\n\n`;
        }
        
        // Add discussion summary
        context += this.language === 'ru'
            ? `\nВот краткий обзор сегодняшнего обсуждения:\n`
            : `\nHere's a summary of today's discussion:\n`;
        const logEntries = Array.from(this.elements.logContent.querySelectorAll('.log-entry'));
        const dayLogEntries = logEntries.filter(entry => {
            const text = entry.textContent;
            return !text.includes('[System]') || text.includes(`День ${gameState.dayCount}`);
        }).slice(-gameState.alivePlayers.length * (currentRound - 1));
        
        dayLogEntries.forEach(entry => {
            context += this.language === 'ru'
                ? `- ${entry.textContent.trim()}\n`
                : `- ${entry.textContent.trim()}\n`;
        });
        
        context += this.language === 'ru'
            ? `\nВы должны выразить свои мысли о том, кто может быть мафией.\n`
            : `\nYou need to express your thoughts about who might be mafia.\n`;
        context += this.language === 'ru'
            ? `\nВАЖНО: НЕ ПРЯМО РАСКРЫВАЙТЕ свою роль. Не говорите "Я мафия" или "Я мирный житель". Храните свою роль в тайне.\n`
            : `\nIMPORTANT: DO NOT DIRECTLY STATE YOUR ROLE. Do not say "I am a civilian" or "I am mafia". Keep your role secret.\n`;
            
        context += this.language === 'ru'
            ? `Напишите краткое сообщение (2-3 предложения), чтобы поделиться с городом. Сосредоточьтесь на своих подозрениях или защите. ОБЯЗАТЕЛЬНО выскажите конкретное мнение, не отвечайте общими фразами.`
            : `Write a brief message (2-3 sentences) to share with the town. Focus on your suspicions or defense. YOU MUST express a specific opinion, do not respond with generic phrases.`;
        
        // If this is not the first day, add prompt history
        if (this.playerPromptHistory[playerId]) {
            context += this.language === 'ru'
                ? `\n\nВаши предыдущие мысли (личные, только для вас):\n${this.playerPromptHistory[playerId]}`
                : `\n\nYour previous thoughts (private to you):\n${this.playerPromptHistory[playerId]}`;
        }
        
        try {
            // Get the player's day discussion using the updated method
            const response = await this.getChatCompletion(playerId, context, null, this.language);
            
            // Add to log visible to all players
            this.addLogMessage(playerData.name, response);
            
            // Record thought process (private to this player)
            if (!this.playerPromptHistory[playerId]) {
                this.playerPromptHistory[playerId] = '';
            }
            this.playerPromptHistory[playerId] += this.language === 'ru'
                ? `День ${gameState.dayCount} обсуждение (раунд ${currentRound}): ${response}\n`
                : `Day ${gameState.dayCount} discussion (round ${currentRound}): ${response}\n`;
            
            return true;
        } catch (error) {
            console.error("Error getting player day action:", error);
            
            // Add fallback message to log with more varied responses
            const fallbackMessages = this.language === 'ru' ? [
                "Я заметил странное поведение в предыдущих обсуждениях. Нам стоит внимательнее присмотреться.",
                "Мне кажется подозрительным то, как некоторые игроки меняют свою позицию между раундами.",
                "Давайте подумаем логически - кто слишком активно обвиняет других?",
                "Мне стоит быть осторожнее с моими подозрениями, но обратите внимание на поведение этих игроков.",
                "Интересная динамика в обсуждении. Некоторые игроки явно что-то скрывают."
            ] : [
                "I've noticed some strange behavior in previous discussions. We should pay closer attention.",
                "I find it suspicious how some players change their position between rounds.",
                "Let's think logically - who is too actively accusing others?",
                "I should be careful with my suspicions, but pay attention to these players' behavior.",
                "Interesting dynamics in the discussion. Some players are clearly hiding something."
            ];
            
            const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
            this.addLogMessage(playerData.name, randomMessage);
            
            // Record thought process
            if (!this.playerPromptHistory[playerId]) {
                this.playerPromptHistory[playerId] = '';
            }
            this.playerPromptHistory[playerId] += this.language === 'ru'
                ? `День ${gameState.dayCount} обсуждение (раунд ${currentRound}): ${randomMessage} (автоматически сгенерированный ответ)\n`
                : `Day ${gameState.dayCount} discussion (round ${currentRound}): ${randomMessage} (auto-generated response)\n`;
            
            return true;
        }
    }
    
    async getPlayerVote(voterId, candidates) {
        const playerData = this.mafiaGameManager.players.find(p => p.id === voterId);
        const playerRole = this.mafiaGameManager.getRoleForPlayer(voterId);
        const gameState = this.mafiaGameManager.getGameStatus();
        
        // Build context for voting
        let context = this.language === 'ru' 
            ? `Вы играете за ${playerData.name} в игре Мафия.\n\n`
            : `You are playing as ${playerData.name} in a Mafia game.\n\n`;
            
        context += this.language === 'ru'
            ? `Сейчас Фаза голосования Дня ${gameState.dayCount}.\n\n`
            : `It is the Voting Phase of Day ${gameState.dayCount}.\n\n`;
        
        if (playerRole === 'mafia') {
            context += this.language === 'ru'
                ? `ВЫ МАФИЯ. Голосуйте стратегически, чтобы защитить себя и других членов мафии.\n\n`
                : `YOU ARE MAFIA. Vote strategically to protect yourself and other mafia members.\n\n`;
            
            // Get fellow mafia members
            const fellowMafia = [];
            for (let i = 0; i < this.mafiaGameManager.players.length; i++) {
                const player = this.mafiaGameManager.players[i];
                if (player.alive && player.id !== voterId && this.mafiaGameManager.getRoleForPlayer(player.id) === 'mafia') {
                    fellowMafia.push(player.name);
                }
            }
            
            if (fellowMafia.length > 0) {
                context += this.language === 'ru'
                    ? `Не голосуйте за своих товарищей по мафии: ${fellowMafia.join(', ')}.\n\n`
                    : `Do not vote for your fellow mafia members: ${fellowMafia.join(', ')}.\n\n`;
            }
        } else {
            context += this.language === 'ru'
                ? `ВЫ МИРНЫЙ ЖИТЕЛЬ. Голосуйте за того, кто, по вашему мнению, наиболее вероятно является мафией, основываясь на обсуждении.\n\n`
                : `YOU ARE A CIVILIAN. Vote for who you think is most likely to be mafia based on the discussion.\n\n`;
        }
        
        // Add discussion summary
        context += this.language === 'ru'
            ? `\nВот краткий обзор сегодняшнего обсуждения:\n`
            : `\nHere's a summary of today's discussion:\n`;
        const logEntries = Array.from(this.elements.logContent.querySelectorAll('.log-entry'));
        const dayLogEntries = logEntries.filter(entry => {
            const text = entry.textContent;
            return !text.includes('[System]') || text.includes(`День ${gameState.dayCount}`);
        }).slice(-candidates.length * 2);
        
        dayLogEntries.forEach(entry => {
            context += this.language === 'ru'
                ? `- ${entry.textContent.trim()}\n`
                : `- ${entry.textContent.trim()}\n`;
        });
        
        context += this.language === 'ru'
            ? `\nВы должны проголосовать за ОДНОГО игрока, которого хотите исключить. Ваши варианты голосования:\n`
            : `\nYou must vote for ONE player to eliminate. Your voting options are:\n`;
        candidates.forEach((candidate, index) => {
            if (candidate.id !== voterId) {
                context += `${index + 1}. ${candidate.name}\n`;
            }
        });
        
        context += this.language === 'ru'
            ? `\nОтветьте ТОЛЬКО НОМЕРОМ игрока, которого вы хотите исключить. Не объясняйте свой выбор.`
            : `Respond with ONLY the NUMBER of the player you want to vote to eliminate. Do not explain your choice.`;
        
        // If this player has a voting history, include it
        if (this.playerPromptHistory[voterId]) {
            context += this.language === 'ru'
                ? `\n\nВаши предыдущие мысли (личные, только для вас):\n${this.playerPromptHistory[voterId]}`
                : `\n\nYour previous thoughts (private to you):\n${this.playerPromptHistory[voterId]}`;
        }
        
        try {
            // Get the player's vote using the updated method
            const response = await this.getChatCompletion(voterId, context, 0.7, this.language);
            
            // Extract the target number from the response
            const targetNumber = this.extractNumber(response);
            
            if (targetNumber !== null && targetNumber >= 1 && targetNumber <= candidates.length) {
                const targetIndex = targetNumber - 1;
                const target = candidates[targetIndex];
                
                // Don't allow voting for self
                if (target.id === voterId) {
                    // Try to get a different vote
                    const validCandidates = candidates.filter(c => c.id !== voterId);
                    const randomIndex = Math.floor(Math.random() * validCandidates.length);
                    const randomTarget = validCandidates[randomIndex];
                    
                    // Record vote
                    this.mafiaGameManager.submitVote(voterId, randomTarget.id);
                    
                    // Log the vote
                    this.addLogMessage('System', this.language === 'ru'
                        ? `${playerData.name} голосует за исключение ${randomTarget.name}.`
                        : `${playerData.name} votes to eliminate ${randomTarget.name}.`);
                    
                    // Record thought process
                    if (!this.playerPromptHistory[voterId]) {
                        this.playerPromptHistory[voterId] = '';
                    }
                    this.playerPromptHistory[voterId] += this.language === 'ru'
                        ? `День ${gameState.dayCount} голосование: Я попытался проголосовать за себя, но это не разрешено. Случайный голос за ${randomTarget.name}.`
                        : `Day ${gameState.dayCount} vote: I tried to vote for myself, but that's not allowed. Random vote for ${randomTarget.name}.`;
                    
                    return true;
                }
                
                // Record vote
                this.mafiaGameManager.submitVote(voterId, target.id);
                
                // Log the vote
                this.addLogMessage('System', this.language === 'ru'
                    ? `${playerData.name} голосует за исключение ${target.name}.`
                    : `${playerData.name} votes to eliminate ${target.name}.`);
                
                // Record thought process
                if (!this.playerPromptHistory[voterId]) {
                    this.playerPromptHistory[voterId] = '';
                }
                this.playerPromptHistory[voterId] += this.language === 'ru'
                    ? `День ${gameState.dayCount} голосование: Я голосую за исключение ${target.name}.`
                    : `Day ${gameState.dayCount} vote: I voted to eliminate ${target.name}.`;
                
                return true;
            } else {
                // Invalid response, choose a random target (excluding self)
                const validCandidates = candidates.filter(c => c.id !== voterId);
                const randomIndex = Math.floor(Math.random() * validCandidates.length);
                const randomTarget = validCandidates[randomIndex];
                
                // Record vote
                this.mafiaGameManager.submitVote(voterId, randomTarget.id);
                
                // Log the vote
                this.addLogMessage('System', this.language === 'ru'
                    ? `${playerData.name} с некоторым колебанием голосует за исключение ${randomTarget.name}.`
                    : `${playerData.name} votes with some hesitation to eliminate ${randomTarget.name}.`);
                
                return true;
            }
        } catch (error) {
            console.error("Error getting player vote:", error);
            
            // Choose a random target as fallback
            const validCandidates = candidates.filter(c => c.id !== voterId);
            const randomIndex = Math.floor(Math.random() * validCandidates.length);
            const randomTarget = validCandidates[randomIndex];
            
            // Record vote
            this.mafiaGameManager.submitVote(voterId, randomTarget.id);
            
            // Log the vote
            this.addLogMessage('System', this.language === 'ru'
                ? `${playerData.name} голосует за исключение ${randomTarget.name}.`
                : `${playerData.name} votes to eliminate ${randomTarget.name}.`);
            
            return true;
        }
    }
    
    async processNightActions(nightInstructions) {
        this.clearPlayerActions();
        
        // Process mafia actions first
        const mafiaPromises = [];
        // Find mafia players and process their actions
        for (const playerId in nightInstructions) {
            const instructions = nightInstructions[playerId];
            if (instructions.role === 'mafia') {
                mafiaPromises.push(this.getMafiaAction(playerId, instructions));
            }
        }
        
        // Wait for all mafia actions to complete
        await Promise.all(mafiaPromises);
        
        // Process doctor actions
        const doctorPromises = [];
        for (const playerId in nightInstructions) {
            const instructions = nightInstructions[playerId];
            if (instructions.role === 'doctor') {
                doctorPromises.push(this.getDoctorAction(playerId, instructions));
            }
        }
        
        // Wait for all doctor actions to complete
        await Promise.all(doctorPromises);
        
        // Process sheriff actions
        const sheriffPromises = [];
        for (const playerId in nightInstructions) {
            const instructions = nightInstructions[playerId];
            if (instructions.role === 'sheriff') {
                sheriffPromises.push(this.getSheriffAction(playerId, instructions));
            }
        }
        
        // Wait for all sheriff actions to complete
        await Promise.all(sheriffPromises);
        
        // Process detective actions
        const detectivePromises = [];
        for (const playerId in nightInstructions) {
            const instructions = nightInstructions[playerId];
            if (instructions.role === 'detective') {
                detectivePromises.push(this.getDetectiveAction(playerId, instructions));
            }
        }
        
        // Wait for all detective actions to complete
        await Promise.all(detectivePromises);
        
        // Process civilian actions (or non-actions)
        const civilianPromises = [];
        for (const playerId in nightInstructions) {
            const instructions = nightInstructions[playerId];
            if (instructions.role === 'civilian') {
                civilianPromises.push(this.getCivilianAction(playerId, instructions));
            }
        }
        
        // Wait for all civilian actions to complete
        await Promise.all(civilianPromises);
        
        // End the night
        const nightResults = this.mafiaGameManager.endNight();
        
        // Update UI for murdered players
        this.updatePlayerStatus(this.mafiaGameManager.players);
        
        // Add night results to log
        if (nightResults.results.killed.length > 0) {
            const killedNames = nightResults.results.killed.map(p => p.name).join(', ');
            this.addLogMessage('System', this.language === 'ru'
                ? `Результаты Ночи ${this.mafiaGameManager.dayCount}: ${killedNames} ${nightResults.results.killed.length === 1 ? 'был' : 'были'} убит${nightResults.results.killed.length === 1 ? '' : 'ы'} во время ночи.`
                : `Night ${this.mafiaGameManager.dayCount} results: ${killedNames} ${nightResults.results.killed.length === 1 ? 'was' : 'were'} killed during the night.`);
        } else {
            this.addLogMessage('System', this.language === 'ru'
                ? `Результаты Ночи ${this.mafiaGameManager.dayCount}: Никто не был убит.`
                : `Night ${this.mafiaGameManager.dayCount} results: No one was killed.`);
        }
        
        // Add information about healed players for doctor's knowledge
        if (nightResults.results.healed.length > 0) {
            // Only visible to the doctor
            for (const playerId in nightInstructions) {
                if (nightInstructions[playerId].role === 'doctor' && this.mafiaGameManager.players.find(p => p.id === playerId).alive) {
                    const healedPlayer = nightResults.results.healed[0];
                    if (!this.playerPromptHistory[playerId]) {
                        this.playerPromptHistory[playerId] = '';
                    }
                    
                    this.playerPromptHistory[playerId] += this.language === 'ru'
                        ? `Ночь ${this.mafiaGameManager.dayCount}: Я успешно защитил ${healedPlayer.name} от атаки мафии.\n`
                        : `Night ${this.mafiaGameManager.dayCount}: I successfully protected ${healedPlayer.name} from the mafia attack.\n`;
                }
            }
        }
        
        // Add investigation results for sheriffs
        for (const sheriffId in nightResults.results.investigations) {
            const result = nightResults.results.investigations[sheriffId];
            if (!this.playerPromptHistory[sheriffId]) {
                this.playerPromptHistory[sheriffId] = '';
            }
            
            this.playerPromptHistory[sheriffId] += this.language === 'ru'
                ? `Ночь ${this.mafiaGameManager.dayCount}: Моё расследование показало, что ${result.targetName} ${result.isMafia ? 'является мафией!' : 'не является мафией.'}\n`
                : `Night ${this.mafiaGameManager.dayCount}: My investigation revealed that ${result.targetName} ${result.isMafia ? 'is a mafia member!' : 'is not a mafia member.'}\n`;
        }
        
        // Add tracking results for detectives
        for (const detectiveId in nightResults.results.tracking) {
            const result = nightResults.results.tracking[detectiveId];
            if (!this.playerPromptHistory[detectiveId]) {
                this.playerPromptHistory[detectiveId] = '';
            }
            
            let message;
            if (result.interactedWith.length === 0) {
                message = this.language === 'ru'
                    ? `Ночь ${this.mafiaGameManager.dayCount}: Я выследил ${result.targetName}, и похоже, что этот игрок оставался дома и не взаимодействовал ни с кем.\n`
                    : `Night ${this.mafiaGameManager.dayCount}: I tracked ${result.targetName}, and it seems they stayed home and didn't interact with anyone.\n`;
            } else {
                const targetNames = result.interactedWith.map(p => p.name).join(', ');
                message = this.language === 'ru'
                    ? `Ночь ${this.mafiaGameManager.dayCount}: Я выследил ${result.targetName}, и этот игрок взаимодействовал с: ${targetNames}.\n`
                    : `Night ${this.mafiaGameManager.dayCount}: I tracked ${result.targetName}, and they interacted with: ${targetNames}.\n`;
            }
            
            this.playerPromptHistory[detectiveId] += message;
        }
        
        // Check if game has ended
        if (nightResults.gameStatus.gameOver) {
            this.endGame(nightResults.gameStatus);
            return;
        }
        
        // Start day
        await this.startDayPhase();
    }
    
    async startDayPhase() {
        // Update UI for day phase
        this.updatePhaseIndicator('day');
        this.elements.gameStatusText.textContent = `🌞 ${this.getTranslation('Day')} ${this.mafiaGameManager.dayCount}: ${this.getTranslation('The town wakes up to discuss who might be the mafia')}`;
        
        const dayInfo = this.mafiaGameManager.startDay();
        
        // Get discussion rounds
        const discussionRounds = this.mafiaGameManager.getDiscussionRounds();
        
        // Run multiple rounds of discussion
        for (let round = 1; round <= discussionRounds; round++) {
            if (round > 1) {
                this.addLogMessage('System', this.language === 'ru'
                    ? `Начинается раунд обсуждения ${round} из ${discussionRounds}`
                    : `Starting discussion round ${round} of ${discussionRounds}`);
            }
            
            // Prompt each player for their discussion
            const discussionPromises = [];
            
            for (const player of dayInfo.alivePlayers) {
                discussionPromises.push(this.getPlayerDayAction(player.id, round, discussionRounds));
            }
            
            // Wait for all discussions to complete
            await Promise.all(discussionPromises);
        }
        
        // Start voting phase
        await this.startVotingPhase();
    }
    
    async startVotingPhase() {
        // Update UI for voting phase
        this.elements.gameStatusText.textContent = `🗳️ ${this.getTranslation('Day')} ${this.mafiaGameManager.dayCount}: ${this.getTranslation('Voting phase - Players decide who to eliminate')}`;
        
        const votingInfo = this.mafiaGameManager.startVoting();
        
        // Prompt each player for their vote
        const votingPromises = [];
        
        for (const voter of votingInfo.eligibleVoters) {
            votingPromises.push(this.getPlayerVote(voter.id, votingInfo.voteCandidates));
        }
        
        // Wait for all votes to complete
        await Promise.all(votingPromises);
        
        // End the day and process votes
        const dayResults = this.mafiaGameManager.endDay();
        
        // Update UI for eliminated player
        this.updatePlayerStatus(this.mafiaGameManager.players);
        
        // Log day results
        if (dayResults.results.eliminated) {
            const eliminatedPlayer = dayResults.results.eliminated;
            this.addLogMessage('System', this.language === 'ru'
                ? `${eliminatedPlayer.name} ${this.getTranslation('was voted out and revealed to be a')} ${this.getTranslation(eliminatedPlayer.role)}.`
                : `${eliminatedPlayer.name} ${this.getTranslation('was voted out and revealed to be a')} ${eliminatedPlayer.role}.`);
        } else {
            this.addLogMessage('System', this.getTranslation('The vote was tied. No one was eliminated today.'));
        }
        
        // Check if game has ended
        if (dayResults.gameStatus.gameOver) {
            this.endGame(dayResults.gameStatus);
            return;
        }
        
        // Start night phase
        this.updatePhaseIndicator('night');
        this.elements.gameStatusText.textContent = `🌙 ${this.getTranslation('Night')} ${this.mafiaGameManager.dayCount}: ${this.getTranslation('The town sleeps while everyone performs their night actions')}`;
        
        // Process night actions
        await this.processNightActions(dayResults.nextNightInstructions);
    }
    
    endGame(gameStatus) {
        // Update UI for game end
        if (gameStatus.winner === 'mafia') {
            this.elements.gameStatusText.textContent = `🎭 ${this.getTranslation('Game over')}: ${this.getTranslation('Mafia wins')}! ${this.getTranslation(gameStatus.message)}`;
            this.elements.gameStatusBanner.classList.add('mafia-win');
        } else {
            this.elements.gameStatusText.textContent = `👨‍👩‍👧‍👦 ${this.getTranslation('Game over')}: ${this.getTranslation('Civilians win')}! ${this.getTranslation(gameStatus.message)}`;
            this.elements.gameStatusBanner.classList.add('civilian-win');
        }
        
        this.addLogMessage('System', `${this.getTranslation('Game over')}! ${this.getTranslation(gameStatus.message)}`);
        
        // Reveal all roles
        const allPlayers = this.mafiaGameManager.players;
        let revealMessage = this.language === 'ru' ? "Финальное раскрытие ролей: " : "Final role reveal: ";
        
        allPlayers.forEach(player => {
            const role = this.mafiaGameManager.getRoleForPlayer(player.id);
            
            if (this.language === 'ru') {
                revealMessage += `${player.name} был ${role === 'mafia' ? 'членом Мафии' : role === 'doctor' ? 'доктором' : role === 'sheriff' ? 'шерифом' : role === 'detective' ? 'детективом' : 'мирным жителем'}. `;
            } else {
                revealMessage += `${player.name} was ${role === 'mafia' ? 'a mafia member' : role === 'doctor' ? 'a doctor' : role === 'sheriff' ? 'a sheriff' : role === 'detective' ? 'a detective' : 'a civilian'}. `;
            }
            
            // Update UI to show role
            const playerEl = document.getElementById(`player-${player.id}`);
            if (playerEl) {
                if (role === 'mafia') {
                    playerEl.classList.add('mafia-revealed');
                } else if (role === 'doctor') {
                    playerEl.classList.add('doctor-revealed');
                } else if (role === 'sheriff') {
                    playerEl.classList.add('sheriff-revealed');
                } else if (role === 'detective') {
                    playerEl.classList.add('detective-revealed');
                } else {
                    playerEl.classList.add('civilian-revealed');
                }
            }
        });
        
        this.addLogMessage('System', revealMessage);
        
        // Reset game controls for new game
        this.elements.startGameBtn.disabled = false;
        this.elements.startGameBtn.textContent = this.getTranslation('Play Again');
    }
    
    updatePhaseIndicator(phase) {
        if (phase === 'night') {
            this.elements.dayPhaseIndicator.innerHTML = `
                <div class="phase-icon">🌙</div>
                <div class="phase-text">${this.getTranslation('Night')} <span id="day-number">${this.mafiaGameManager.dayCount}</span></div>
            `;
            this.elements.dayPhaseIndicator.classList.add('night-phase');
            this.elements.dayPhaseIndicator.classList.remove('day-phase');
        } else {
            this.elements.dayPhaseIndicator.innerHTML = `
                <div class="phase-icon">🌞</div>
                <div class="phase-text">${this.getTranslation('Day')} <span id="day-number">${this.mafiaGameManager.dayCount}</span></div>
            `;
            this.elements.dayPhaseIndicator.classList.add('day-phase');
            this.elements.dayPhaseIndicator.classList.remove('night-phase');
        }
    }
}