import { marked } from 'marked';

export class UIManager {
    constructor(fileManager) {
        // DOM elements
        this.elements = {};
        this.currentLanguage = 'en';
        
        // Only initialize elements if we're not in mafia or wiki mode
        if (window.location.hash !== '#mafia' && window.location.hash !== '#wiki') {
            this.elements = {
                projectName: document.getElementById('project-name'),
                projectDescription: document.getElementById('project-description'),
                summarizerInstructions: document.getElementById('summarizer-instructions'),
                maxIterations: document.getElementById('max-iterations'),
                maxIterationsInput: document.getElementById('max-iterations-input'),
                iterationValue: document.getElementById('iteration-value'),
                startBtn: document.getElementById('start-discussion'),
                resetBtn: document.getElementById('reset-project'),
                iterationCounter: document.getElementById('iteration-counter'),
                summaryList: document.getElementById('summary-list'),
                chatMessages: document.getElementById('chat-messages'),
                finalOutput: document.getElementById('final-output'),
                network1Status: document.getElementById('network1-status'),
                network2Status: document.getElementById('network2-status'),
                network3Status: document.getElementById('network3-status'),
                network4Status: document.getElementById('network4-status'),
                network5Status: document.getElementById('network5-status'),
                network6Status: document.getElementById('network6-status'),
                network7Status: document.getElementById('network7-status'),
                network8Status: document.getElementById('network8-status'),
                summarizerStatus: document.getElementById('summarizer-status'),
                toggleSettings: document.getElementById('toggle-settings'),
                advancedSettings: document.getElementById('advanced-settings'),
                systemPrompt: document.getElementById('system-prompt'),
                temperature: document.getElementById('temperature'),
                temperatureValue: document.getElementById('temperature-value'),
                maxTokens: document.getElementById('max-tokens'),
                tokensValue: document.getElementById('tokens-value'),
                topP: document.getElementById('top-p'),
                topPValue: document.getElementById('top-p-value'),
                presencePenalty: document.getElementById('presence-penalty'),
                presencePenaltyValue: document.getElementById('presence-penalty-value'),
                frequencyPenalty: document.getElementById('frequency-penalty'),
                frequencyPenaltyValue: document.getElementById('frequency-penalty-value'),
                useNetwork1: document.getElementById('use-network1'),
                useNetwork2: document.getElementById('use-network2'),
                useNetwork3: document.getElementById('use-network3'),
                useNetwork4: document.getElementById('use-network4'),
                useNetwork5: document.getElementById('use-network5'),
                useNetwork6: document.getElementById('use-network6'),
                useNetwork7: document.getElementById('use-network7'),
                useNetwork8: document.getElementById('use-network8'),
                logitBias: document.getElementById('logit-bias'),
                fileAttachments: document.getElementById('file-attachments'),
                attachmentPreview: document.getElementById('attachment-preview'),
                addNetworkBtn: document.getElementById('add-network'),
                pauseBtn: document.getElementById('pause-discussion'),
                userInputArea: document.getElementById('user-input-area'),
                userPrompt: document.getElementById('user-prompt'),
                submitUserPrompt: document.getElementById('submit-user-prompt'),
                cancelUserPrompt: document.getElementById('cancel-user-prompt'),
                manageApiKeys: document.getElementById('manage-api-keys'),
                iterationType: document.getElementById('iteration-type'),
                customIterationCycles: document.getElementById('custom-iteration-cycles'),
                customIterationContainer: document.getElementById('custom-iteration-container'),
                continueDiscussionBtn: document.createElement('button'),
            };
        }

        // Add live chat elements
        this.liveChatElements = {};
        this.chatMode = 'classic'; // 'classic' or 'live'

        this.fileManager = fileManager;

        // Check if we're in collaboration mode before setting up event listeners
        if (window.location.hash !== '#mafia' && window.location.hash !== '#wiki') {
            // Set up event listeners for settings controls
            this.setupEventListeners();

            // Create network settings containers
            this.createNetworkSettings();

            // Update UI labels to be more universal
            if (document.querySelector('header h1')) {
                document.querySelector('header h1').textContent = 'Neural Collaborative Framework';
            }
            if (document.querySelector('.description p')) {
                document.querySelector('.description p').textContent = 
                    'A collaborative framework where neural networks work together through iterative dialogue on any topic.';
            }
            if (document.querySelector('label[for="project-name"]')) {
                document.querySelector('label[for="project-name"]').textContent = 'Topic Name:';
            }
            if (document.querySelector('label[for="project-description"]')) {
                document.querySelector('label[for="project-description"]').textContent = 'Topic Description:';
            }
            if (this.elements.projectName) {
                this.elements.projectName.placeholder = 'Enter topic name';
            }
            if (this.elements.projectDescription) {
                this.elements.projectDescription.placeholder = 'Describe the topic you want to explore';
            }
            
            // Set default advanced settings
            if (this.elements.systemPrompt) {
                this.elements.systemPrompt.value = 
                    'You are participating in a collaborative discussion. Respond thoughtfully and concisely to the topic.';
            }
        }
        
        // Add stream interface elements
        this.streamElements = {};
        this.createStreamInterface();
    }
    
    setupEventListeners() {
        // Set up iteration slider and direct input sync
        this.elements.maxIterations.addEventListener('input', () => {
            const value = this.elements.maxIterations.value;
            this.elements.iterationValue.textContent = value;
            this.elements.maxIterationsInput.value = value;
        });
        
        this.elements.maxIterationsInput.addEventListener('input', () => {
            let value = parseInt(this.elements.maxIterationsInput.value);
            if (value > 100) value = 100;
            if (value < 1) value = 1;
            this.elements.maxIterationsInput.value = value;
            
            // Update slider if value is within its range
            if (value <= 20) {
                this.elements.maxIterations.value = value;
                this.elements.iterationValue.textContent = value;
            } else {
                this.elements.iterationValue.textContent = value + " (custom)";
            }
        });
        
        // Toggle advanced settings visibility
        this.elements.toggleSettings.addEventListener('click', () => {
            this.elements.advancedSettings.classList.toggle('visible');
            this.elements.toggleSettings.textContent = 
                this.elements.advancedSettings.classList.contains('visible') ? 'Hide' : 'Show';
        });
        
        // Set up temperature slider
        this.elements.temperature.addEventListener('input', () => {
            const value = this.elements.temperature.value / 10;
            this.elements.temperatureValue.textContent = value.toFixed(1);
        });
        
        // Set up max tokens slider
        this.elements.maxTokens.addEventListener('input', () => {
            this.elements.tokensValue.textContent = this.elements.maxTokens.value;
        });
        
        // Set up top-p slider
        this.elements.topP.addEventListener('input', () => {
            const value = this.elements.topP.value / 10;
            this.elements.topPValue.textContent = value.toFixed(1);
        });
        
        // Set up presence penalty slider
        this.elements.presencePenalty.addEventListener('input', () => {
            const value = this.elements.presencePenalty.value / 10;
            this.elements.presencePenaltyValue.textContent = value.toFixed(1);
        });
        
        // Set up frequency penalty slider
        this.elements.frequencyPenalty.addEventListener('input', () => {
            const value = this.elements.frequencyPenalty.value / 10;
            this.elements.frequencyPenaltyValue.textContent = value.toFixed(1);
        });
        
        // Add file attachment handling
        this.elements.fileAttachments.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files);
            
            for (const file of files) {
                try {
                    const attachment = await this.fileManager.addFile(file);
                    this.addAttachmentPreview(attachment);
                } catch (error) {
                    this.showErrorMessage(error.message);
                }
            }
        });
        
        // Setup pause button and user prompt submission
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                if (window.neuralFramework) {
                    window.neuralFramework.pauseDiscussion();
                }
            });
        }
        
        if (this.elements.submitUserPrompt) {
            this.elements.submitUserPrompt.addEventListener('click', () => {
                if (window.neuralFramework) {
                    const userPrompt = this.elements.userPrompt.value.trim();
                    window.neuralFramework.resumeDiscussion(userPrompt);
                }
            });
        }
        
        if (this.elements.cancelUserPrompt) {
            this.elements.cancelUserPrompt.addEventListener('click', () => {
                if (window.neuralFramework) {
                    window.neuralFramework.resumeDiscussion();
                }
            });
        }
        
        // Set up API key management
        this.elements.manageApiKeys.addEventListener('click', () => this.showApiKeyManager());
        
        // Set up iteration type selection
        this.elements.iterationType.addEventListener('change', () => {
            if (this.elements.iterationType.value === 'custom') {
                this.elements.customIterationContainer.style.display = 'block';
            } else {
                this.elements.customIterationContainer.style.display = 'none';
            }
        });

        // Add new event listeners for export and unrestricted mode
        const exportButtonContainer = document.createElement('div');
        exportButtonContainer.className = 'export-controls';
        
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-discussion';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.textContent = 'Export Discussion';
        exportBtn.addEventListener('click', () => this.showExportOptions());
        
        const historyBtn = document.createElement('button');
        historyBtn.id = 'view-history';
        historyBtn.className = 'btn btn-secondary';
        historyBtn.textContent = 'View History';
        historyBtn.addEventListener('click', () => this.toggleHistoryPanel());
        
        const unrestrictedModeContainer = document.createElement('div');
        unrestrictedModeContainer.className = 'form-group';
        unrestrictedModeContainer.innerHTML = `
            <label class="checkbox-label" for="unrestricted-mode">
                <input type="checkbox" id="unrestricted-mode">
                Enable Unrestricted Mode
            </label>
            <div class="network-description">Removes content filtering and allows discussion of any topic</div>
        `;
        
        exportButtonContainer.appendChild(exportBtn);
        exportButtonContainer.appendChild(historyBtn);
        
        // Add the export button below the reset button
        if (this.elements.resetBtn && this.elements.resetBtn.parentNode) {
            this.elements.resetBtn.parentNode.insertBefore(exportButtonContainer, this.elements.resetBtn.nextSibling);
        }
        
        // Add unrestricted mode toggle to advanced settings
        if (this.elements.advancedSettings) {
            // Add after the logit bias section
            const logitBiasSection = document.querySelector('label[for="logit-bias"]').closest('.form-group');
            this.elements.advancedSettings.insertBefore(unrestrictedModeContainer, logitBiasSection.nextSibling);
        }
        
        // Add event listener for unrestricted mode toggle
        document.getElementById('unrestricted-mode').addEventListener('change', (e) => {
            if (window.neuralFramework) {
                window.neuralFramework.toggleUnrestrictedMode(e.target.checked);
                
                // Show warning if enabling
                if (e.target.checked) {
                    this.showWarningModal();
                }
            }
        });
        
        // Add infinite mode toggle
        document.getElementById('infinite-mode').addEventListener('change', (e) => {
            if (window.neuralFramework) {
                window.neuralFramework.infiniteMode = e.target.checked;
                if (e.target.checked) {
                    this.addSystemMessage("Infinite mode enabled - discussions will continue indefinitely until manually stopped.");
                }
            }
        });

        // Add live chat mode event listeners
        this.setupLiveChatListeners();
    }
    
    setupLiveChatListeners() {
        // Create live chat controls if they don't exist
        this.createLiveChatControls();
        
        // Event listeners for live chat toggles
        const initiativeToggle = document.getElementById('initiative-enabled');
        const fragmentedToggle = document.getElementById('fragmented-messages-enabled');
        const fragmentationSlider = document.getElementById('fragmentation-level');
        
        if (initiativeToggle) {
            initiativeToggle.addEventListener('change', () => {
                this.updateChatModeDisplay();
            });
        }
        
        if (fragmentedToggle) {
            fragmentedToggle.addEventListener('change', () => {
                this.updateChatModeDisplay();
            });
        }
        
        if (fragmentationSlider) {
            fragmentationSlider.addEventListener('input', () => {
                const value = fragmentationSlider.value;
                document.getElementById('fragmentation-value').textContent = 
                    value == 0 ? 'Single Block' : 
                    value < 0.3 ? 'Long Messages' :
                    value < 0.7 ? 'Medium Fragments' : 'Short Fragments';
            });
        }
    }
    
    createLiveChatControls() {
        // Find the model settings section
        const modelSettings = document.querySelector('.model-settings');
        if (!modelSettings) return;
        
        // Create live chat section
        const liveChatSection = document.createElement('div');
        liveChatSection.className = 'live-chat-settings';
        liveChatSection.innerHTML = `
            <h3>Live Chat Mode Settings</h3>
            <div class="form-group">
                <label class="checkbox-label" for="initiative-enabled">
                    <input type="checkbox" id="initiative-enabled">
                    Enable Initiative Mode
                </label>
                <div class="network-description">Networks compete to respond first, like in real conversations</div>
            </div>
            <div class="form-group">
                <label class="checkbox-label" for="fragmented-messages-enabled">
                    <input type="checkbox" id="fragmented-messages-enabled">
                    Enable Fragmented Messages
                </label>
                <div class="network-description">Networks can send multiple short messages instead of one long response</div>
            </div>
            <div class="form-group">
                <label for="fragmentation-level">Fragmentation Level:</label>
                <div class="slider-container">
                    <input type="range" id="fragmentation-level" min="0" max="1" value="0.5" class="slider" step="0.1">
                    <span id="fragmentation-value">Medium Fragments</span>
                </div>
            </div>
        `;
        
        // Insert before advanced settings
        const advancedSettings = document.getElementById('advanced-settings');
        if (advancedSettings) {
            modelSettings.insertBefore(liveChatSection, advancedSettings);
        } else {
            modelSettings.appendChild(liveChatSection);
        }
    }
    
    updateChatModeDisplay() {
        const initiativeEnabled = document.getElementById('initiative-enabled')?.checked || false;
        const fragmentedEnabled = document.getElementById('fragmented-messages-enabled')?.checked || false;
        const isLiveMode = initiativeEnabled || fragmentedEnabled;
        
        // Update mode indicator
        this.updateChatMode(isLiveMode ? 'live' : 'classic');
        
        // Show mode status
        const statusText = isLiveMode ? 
            (initiativeEnabled && fragmentedEnabled ? 'Live Chat: Initiative + Fragments' :
             initiativeEnabled ? 'Live Chat: Initiative Mode' : 'Live Chat: Fragmented Mode') :
            'Classic Mode';
            
        // Add or update status indicator
        let statusIndicator = document.getElementById('chat-mode-status');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'chat-mode-status';
            statusIndicator.className = 'chat-mode-status';
            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) {
                chatHeader.appendChild(statusIndicator);
            }
        }
        
        statusIndicator.textContent = statusText;
        statusIndicator.className = `chat-mode-status ${isLiveMode ? 'live-mode' : 'classic-mode'}`;
    }
    
    updateChatMode(mode) {
        this.chatMode = mode;
        const chatContainer = document.querySelector('.chat-container');
        const chatMessages = document.getElementById('chat-messages');
        
        if (chatContainer && chatMessages) {
            if (mode === 'live') {
                chatContainer.classList.add('live-chat-mode');
                chatMessages.classList.add('live-chat-messages');
            } else {
                chatContainer.classList.remove('live-chat-mode');
                chatMessages.classList.remove('live-chat-messages');
            }
        }
    }
    
    showLiveChatInterface() {
        this.updateChatMode('live');
        this.addSystemMessage('🔥 Live Chat mode activated! Networks will communicate dynamically.');
    }
    
    addLiveChatMessage(networkId, networkName, content, messageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `live-message ${networkId}`;
        messageDiv.dataset.messageId = messageData.id;
        messageDiv.dataset.sequenceId = messageData.sequenceId;
        
        // Check if this is part of a sequence
        if (messageData.isFragment) {
            messageDiv.classList.add('message-fragment');
            
            // Find the previous message in the sequence
            const prevSequenceId = messageData.sequenceId.split('-');
            prevSequenceId[1] = (parseInt(prevSequenceId[1]) - 1).toString();
            const prevId = prevSequenceId.join('-');
            
            const prevMessage = document.querySelector(`[data-sequence-id="${prevId}"]`);
            if (prevMessage) {
                messageDiv.classList.add('continued-message');
            }
        }
        
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="live-message-header">
                <span class="live-message-author">${networkName}</span>
                <span class="live-message-timestamp">${timestamp}</span>
            </div>
            <div class="live-message-content">${content}</div>
            <div class="live-message-actions">
                <button class="reply-to-message" data-parent-id="${messageData.id}">Reply</button>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 100);
        
        // Add typing effect for live mode
        if (this.chatMode === 'live') {
            this.animateMessageAppearance(messageDiv);
        }
    }
    
    animateMessageAppearance(messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    }

    createNetworkSettings() {
        // Create settings for each network
        const advancedSettings = this.elements.advancedSettings;
        
        // Add network settings header
        const networkSettingsHeader = document.createElement('h3');
        networkSettingsHeader.textContent = 'Individual Network Settings';
        networkSettingsHeader.style.marginTop = '20px';
        advancedSettings.appendChild(networkSettingsHeader);
        
        // Add settings container
        const networkSettingsContainer = document.createElement('div');
        networkSettingsContainer.id = 'network-settings-container';
        advancedSettings.appendChild(networkSettingsContainer);
        
        // Add Network Settings toggle button
        const toggleNetworkSettings = document.createElement('button');
        toggleNetworkSettings.id = 'toggle-network-settings';
        toggleNetworkSettings.className = 'toggle-btn';
        toggleNetworkSettings.textContent = 'Show';
        networkSettingsHeader.appendChild(toggleNetworkSettings);
        
        // Add event listener for toggle
        toggleNetworkSettings.addEventListener('click', () => {
            networkSettingsContainer.classList.toggle('visible');
            toggleNetworkSettings.textContent = 
                networkSettingsContainer.classList.contains('visible') ? 'Hide' : 'Show';
        });
        
        // Create settings for each network
        for (let i = 1; i <= 8; i++) {
            const networkId = `network${i}`;
            const networkName = i === 1 ? 'Analytical Network' : 
                            i === 2 ? 'Creative Network' : 
                            i === 3 ? 'Implementation Network' : 
                            i === 4 ? 'Data Science Network' : 
                            i === 5 ? 'Ethical Network' : 
                            i === 6 ? 'User Experience Network' : 
                            i === 7 ? 'Systems Thinking Network' : 
                            'Devil\'s Advocate Network';
            
            // Get the original/default system prompt
            let originalPrompt = '';
            if (i === 1) {
                originalPrompt = 'You are an analytical thinker with strong critical reasoning skills. Focus on logical analysis, structured thinking, and evidence-based reasoning.';
            } else if (i === 2) {
                originalPrompt = 'You are a creative thinker with innovative perspectives. Focus on generating novel ideas, considering alternatives, and exploring possibilities beyond the obvious.';
            } else if (i === 3) {
                originalPrompt = 'You specialize in practical implementation. Focus on technical feasibility, resource requirements, and concrete steps to bring ideas to reality.';
            } else if (i === 4) {
                originalPrompt = 'You specialize in data-driven analysis. Focus on statistics, patterns, and evidence-based conclusions derived from data.';
            } else if (i === 5) {
                originalPrompt = 'You specialize in ethical analysis. Focus on moral implications, societal impact, and principles like fairness, transparency, and equity.';
            } else if (i === 6) {
                originalPrompt = 'You specialize in user experience. Focus on accessibility, usability, and how humans will interact with concepts or systems.';
            } else if (i === 7) {
                originalPrompt = 'You specialize in systems thinking. Focus on understanding complex interconnections, feedback loops, and emergent properties of systems.';
            } else if (i === 8) {
                originalPrompt = 'You serve as a constructive critic. Focus on identifying weaknesses, challenging assumptions, and stress-testing ideas to improve their robustness.';
            }
            
            const networkSettings = document.createElement('div');
            networkSettings.className = 'network-settings';
            networkSettings.id = `settings-${networkId}`;
            networkSettings.innerHTML = `
                <h4>${networkName} Settings</h4>
                <div class="form-group">
                    <label for="system-prompt-${networkId}">System Prompt (Original):</label>
                    <textarea id="system-prompt-${networkId}" placeholder="Modify the original system prompt for this network" class="network-system-prompt">${originalPrompt}</textarea>
                </div>
                <div class="form-group">
                    <label for="temperature-${networkId}">Temperature:</label>
                    <div class="slider-container">
                        <input type="range" id="temperature-${networkId}" min="0" max="20" value="7" class="slider" step="1">
                        <span id="temperature-value-${networkId}">0.7</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="top-p-${networkId}">Top P:</label>
                    <div class="slider-container">
                        <input type="range" id="top-p-${networkId}" min="0" max="10" value="10" class="slider" step="1">
                        <span id="top-p-value-${networkId}">1.0</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="max-tokens-${networkId}">Max Tokens:</label>
                    <div class="slider-container">
                        <input type="range" id="max-tokens-${networkId}" min="100" max="2000" value="1000" class="slider" step="100">
                        <span id="max-tokens-value-${networkId}">1000</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="presence-penalty-${networkId}">Presence Penalty:</label>
                    <div class="slider-container">
                        <input type="range" id="presence-penalty-${networkId}" min="-20" max="20" value="0" class="slider" step="1">
                        <span id="presence-penalty-value-${networkId}">0.0</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="frequency-penalty-${networkId}">Frequency Penalty:</label>
                    <div class="slider-container">
                        <input type="range" id="frequency-penalty-${networkId}" min="-20" max="20" value="0" class="slider" step="1">
                        <span id="frequency-penalty-value-${networkId}">0.0</span>
                    </div>
                </div>
            `;
            
            networkSettingsContainer.appendChild(networkSettings);
            
            // Add event listeners for this network's settings
            this.setupNetworkSettingsListeners(networkId);
        }
        
        // Create settings for summarizer
        const summarizerSettings = document.createElement('div');
        summarizerSettings.className = 'network-settings';
        summarizerSettings.id = 'settings-summarizer';
        summarizerSettings.innerHTML = `
            <h4>Synthesizer Network Settings</h4>
            <div class="form-group">
                <label for="system-prompt-summarizer">System Prompt (Original):</label>
                <textarea id="system-prompt-summarizer" placeholder="Modify the original system prompt for the synthesizer" class="network-system-prompt">You are specialized in synthesizing discussions and finding consensus. Review dialogues and create concise summaries of key points and agreements.</textarea>
            </div>
            <div class="form-group">
                <label for="temperature-summarizer">Temperature:</label>
                <div class="slider-container">
                    <input type="range" id="temperature-summarizer" min="0" max="20" value="7" class="slider" step="1">
                    <span id="temperature-value-summarizer">0.7</span>
                </div>
            </div>
            <div class="form-group">
                <label for="top-p-summarizer">Top P:</label>
                <div class="slider-container">
                    <input type="range" id="top-p-summarizer" min="0" max="10" value="10" class="slider" step="1">
                    <span id="top-p-value-summarizer">1.0</span>
                </div>
            </div>
            <div class="form-group">
                <label for="max-tokens-summarizer">Max Tokens:</label>
                <div class="slider-container">
                    <input type="range" id="max-tokens-summarizer" min="100" max="2000" value="1000" class="slider" step="100">
                    <span id="max-tokens-value-summarizer">1000</span>
                </div>
            </div>
            <div class="form-group">
                <label for="presence-penalty-summarizer">Presence Penalty:</label>
                <div class="slider-container">
                    <input type="range" id="presence-penalty-summarizer" min="-20" max="20" value="0" class="slider" step="1">
                    <span id="presence-penalty-value-summarizer">0.0</span>
                </div>
            </div>
            <div class="form-group">
                <label for="frequency-penalty-summarizer">Frequency Penalty:</label>
                <div class="slider-container">
                    <input type="range" id="frequency-penalty-summarizer" min="-20" max="20" value="0" class="slider" step="1">
                    <span id="frequency-penalty-value-summarizer">0.0</span>
                </div>
            </div>
        `;
        
        networkSettingsContainer.appendChild(summarizerSettings);
        this.setupNetworkSettingsListeners('summarizer');
        
        // Add "Add Network" button at the bottom of network settings
        const addNetworkBtn = document.createElement('button');
        addNetworkBtn.id = 'add-network-btn';
        addNetworkBtn.className = 'btn';
        addNetworkBtn.textContent = 'Add New Network';
        addNetworkBtn.style.marginTop = '20px';
        networkSettingsContainer.appendChild(addNetworkBtn);
        
        // Add event listener for adding a new network
        addNetworkBtn.addEventListener('click', () => this.addNewNetwork());
    }

    setupNetworkSettingsListeners(networkId) {
        const temperatureElement = document.getElementById(`temperature-${networkId}`);
        const temperatureValueElement = document.getElementById(`temperature-value-${networkId}`);
        const topPElement = document.getElementById(`top-p-${networkId}`);
        const topPValueElement = document.getElementById(`top-p-value-${networkId}`);
        const maxTokensElement = document.getElementById(`max-tokens-${networkId}`);
        const maxTokensValueElement = document.getElementById(`max-tokens-value-${networkId}`);
        const presencePenaltyElement = document.getElementById(`presence-penalty-${networkId}`);
        const presencePenaltyValueElement = document.getElementById(`presence-penalty-value-${networkId}`);
        const frequencyPenaltyElement = document.getElementById(`frequency-penalty-${networkId}`);
        const frequencyPenaltyValueElement = document.getElementById(`frequency-penalty-value-${networkId}`);
        
        // Handle temperature changes
        temperatureElement.addEventListener('input', () => {
            const value = parseFloat(temperatureElement.value) / 10;
            temperatureValueElement.textContent = value.toFixed(1);
        });
        
        // Handle top-p changes
        topPElement.addEventListener('input', () => {
            const value = parseFloat(topPElement.value) / 10;
            topPValueElement.textContent = value.toFixed(1);
        });
        
        // Handle max tokens changes
        maxTokensElement.addEventListener('input', () => {
            maxTokensValueElement.textContent = maxTokensElement.value;
        });
        
        // Handle presence penalty changes
        presencePenaltyElement.addEventListener('input', () => {
            const value = parseFloat(presencePenaltyElement.value) / 10;
            presencePenaltyValueElement.textContent = value.toFixed(1);
        });
        
        // Handle frequency penalty changes
        frequencyPenaltyElement.addEventListener('input', () => {
            const value = parseFloat(frequencyPenaltyElement.value) / 10;
            frequencyPenaltyValueElement.textContent = value.toFixed(1);
        });
    }

    getNetworkSettings(networkId) {
        return {
            temperature: parseFloat(document.getElementById(`temperature-${networkId}`).value) / 10,
            top_p: parseFloat(document.getElementById(`top-p-${networkId}`).value) / 10,
            max_tokens: parseInt(document.getElementById(`max-tokens-${networkId}`).value),
            presence_penalty: parseFloat(document.getElementById(`presence-penalty-${networkId}`).value) / 10,
            frequency_penalty: parseFloat(document.getElementById(`frequency-penalty-${networkId}`).value) / 10,
            system_prompt: document.getElementById(`system-prompt-${networkId}`).value.trim()
        };
    }

    addAttachmentPreview(attachment) {
        const previewElement = document.createElement('div');
        previewElement.className = 'attachment-item';
        previewElement.dataset.id = attachment.id;
        
        let previewContent = '';
        if (attachment.isImage) {
            previewContent = `
                <div class="attachment-preview-image">
                    <img src="${attachment.dataUrl}" alt="${attachment.name}">
                </div>
            `;
        } else {
            // Different icon for document types
            let fileIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
            </svg>`;
            
            if (attachment.type === 'application/pdf') {
                fileIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#E44D26" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 1 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 1-.5 1.05z"/>
                </svg>`;
            } else if (attachment.type.includes('word')) {
                fileIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#2B579A" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                    <path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5V7s1.54-1.274 1.639-1.208zM6.25 5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
                </svg>`;
            }
            
            previewContent = `
                <div class="attachment-preview-file">
                    ${fileIcon}
                    <div class="doc-type">${attachment.type.split('/')[1].toUpperCase()}</div>
                </div>
            `;
        }
        
        previewElement.innerHTML = `
            ${previewContent}
            <div class="attachment-details">
                <div class="attachment-name">${attachment.name}</div>
                <div class="attachment-size">${this.formatFileSize(attachment.size)}</div>
            </div>
            <button class="remove-attachment" data-id="${attachment.id}">×</button>
        `;
        
        this.elements.attachmentPreview.appendChild(previewElement);
        
        // Add event listener to remove button
        previewElement.querySelector('.remove-attachment').addEventListener('click', (event) => {
            const fileId = event.target.dataset.id;
            if (this.fileManager.removeFile(fileId)) {
                previewElement.remove();
            }
        });
    }

    formatFileSize(sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + ' B';
        } else if (sizeInBytes < 1024 * 1024) {
            return (sizeInBytes / 1024).toFixed(1) + ' KB';
        } else {
            return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    }

    showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.classList.add('fade-out');
            setTimeout(() => {
                errorElement.remove();
            }, 500);
        }, 3000);
    }

    addMessageToChat(sender, name, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const senderElement = document.createElement('div');
        senderElement.className = 'sender';
        senderElement.textContent = name;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'content';
        contentElement.innerHTML = content.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(senderElement);
        messageDiv.appendChild(contentElement);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = message;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addSummaryToList(summary, iteration) {
        const li = document.createElement('li');
        li.textContent = `Iteration ${iteration}: ${summary.substring(0, 100)}...`;
        li.title = summary;
        this.elements.summaryList.appendChild(li);
    }

    displayFinalOutput(output) {
        this.elements.finalOutput.innerHTML = marked.parse(output);
    }

    updateNetworkStatus(activeNetwork) {
        // Reset all statuses
        this.elements.network1Status.classList.remove('active');
        this.elements.network2Status.classList.remove('active');
        this.elements.network3Status.classList.remove('active');
        this.elements.network4Status.classList.remove('active');
        this.elements.network5Status.classList.remove('active');
        this.elements.network6Status.classList.remove('active');
        this.elements.network7Status.classList.remove('active');
        this.elements.network8Status.classList.remove('active');
        this.elements.summarizerStatus.classList.remove('active');
        
        // Set active status
        if (activeNetwork === 'network1') {
            this.elements.network1Status.classList.add('active');
        } else if (activeNetwork === 'network2') {
            this.elements.network2Status.classList.add('active');
        } else if (activeNetwork === 'network3') {
            this.elements.network3Status.classList.add('active');
        } else if (activeNetwork === 'network4') {
            this.elements.network4Status.classList.add('active');
        } else if (activeNetwork === 'network5') {
            this.elements.network5Status.classList.add('active');
        } else if (activeNetwork === 'network6') {
            this.elements.network6Status.classList.add('active');
        } else if (activeNetwork === 'network7') {
            this.elements.network7Status.classList.add('active');
        } else if (activeNetwork === 'network8') {
            this.elements.network8Status.classList.add('active');
        } else if (activeNetwork === 'summarizer') {
            this.elements.summarizerStatus.classList.add('active');
        }
    }

    addNewNetwork() {
        // Get reference to the framework
        const framework = window.neuralFramework;
        if (!framework) {
            console.error("Framework reference not found");
            return;
        }
        
        // Get the next available network number
        const nextNum = framework.networkManager.getNextNetworkNumber();
        const networkId = `network${nextNum}`;
        
        // Create a modal dialog for network configuration
        const modal = document.createElement('div');
        modal.className = 'network-modal';
        modal.innerHTML = `
            <div class="network-modal-content">
                <h3>Add New Network</h3>
                <div class="form-group">
                    <label for="new-network-name">Network Name:</label>
                    <input type="text" id="new-network-name" value="Custom Network ${nextNum}">
                </div>
                <div class="form-group">
                    <label for="new-network-role">Network Role:</label>
                    <input type="text" id="new-network-role" value="Specialized analysis and insights">
                </div>
                <div class="form-group">
                    <label for="new-network-persona">Network Persona:</label>
                    <textarea id="new-network-persona">You are a specialized neural network focused on providing unique insights. Analyze the topic thoroughly and offer a perspective that complements the other networks.</textarea>
                </div>
                <div class="form-group">
                    <label for="new-network-color">Network Color:</label>
                    <input type="color" id="new-network-color" value="#4a8fe7">
                </div>
                <div class="modal-buttons">
                    <button id="confirm-add-network" class="btn">Add Network</button>
                    <button id="cancel-add-network" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .network-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .network-modal-content {
                background-color: var(--card-bg);
                padding: 30px;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                box-shadow: var(--shadow);
            }
            .modal-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners for the modal buttons
        document.getElementById('confirm-add-network').addEventListener('click', () => {
            const name = document.getElementById('new-network-name').value;
            const role = document.getElementById('new-network-role').value;
            const persona = document.getElementById('new-network-persona').value;
            const color = document.getElementById('new-network-color').value;
            
            // Create new network
            const networkData = {
                name,
                role,
                persona,
                color
            };
            
            // Add network to the NetworkManager
            const newNetworkId = framework.networkManager.addNetwork(networkId, networkData);
            
            // Create UI elements for the new network
            this.createUIForNewNetwork(newNetworkId, networkData);
            
            // Clean up modal
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
        
        document.getElementById('cancel-add-network').addEventListener('click', () => {
            // Clean up modal
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }

    createUIForNewNetwork(networkId, networkData) {
        // Create checkbox in advanced settings
        const advancedSettings = document.getElementById('advanced-settings');
        const networkNum = networkId.replace('network', '');
        
        // Create checkbox for the new network
        const networkCheckboxDiv = document.createElement('div');
        networkCheckboxDiv.className = 'form-group';
        networkCheckboxDiv.innerHTML = `
            <label class="checkbox-label" for="use-${networkId}">
                <input type="checkbox" id="use-${networkId}" checked>
                Enable ${networkData.name}
            </label>
            <div class="network-description">${networkData.role}</div>
        `;
        
        // Find where to insert (before the logit bias section)
        const logitBiasSection = document.querySelector('label[for="logit-bias"]').closest('.form-group');
        advancedSettings.insertBefore(networkCheckboxDiv, logitBiasSection);
        
        // Create network settings UI - add settings to the container
        const networkSettingsContainer = document.getElementById('network-settings-container');
        const networkSettings = document.createElement('div');
        networkSettings.className = 'network-settings';
        networkSettings.id = `settings-${networkId}`;
        networkSettings.innerHTML = `
            <h4>${networkData.name} Settings</h4>
            <div class="form-group">
                <label for="system-prompt-${networkId}">System Prompt (Custom):</label>
                <textarea id="system-prompt-${networkId}" placeholder="Custom system prompt for this network" class="network-system-prompt">${networkData.persona || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="temperature-${networkId}">Temperature:</label>
                <div class="slider-container">
                    <input type="range" id="temperature-${networkId}" min="0" max="20" value="7" class="slider" step="1">
                    <span id="temperature-value-${networkId}">0.7</span>
                </div>
            </div>
            <div class="form-group">
                <label for="top-p-${networkId}">Top P:</label>
                <div class="slider-container">
                    <input type="range" id="top-p-${networkId}" min="0" max="10" value="10" class="slider" step="1">
                    <span id="top-p-value-${networkId}">1.0</span>
                </div>
            </div>
            <div class="form-group">
                <label for="max-tokens-${networkId}">Max Tokens:</label>
                <div class="slider-container">
                    <input type="range" id="max-tokens-${networkId}" min="100" max="2000" value="1000" class="slider" step="100">
                    <span id="max-tokens-value-${networkId}">1000</span>
                </div>
            </div>
            <div class="form-group">
                <label for="presence-penalty-${networkId}">Presence Penalty:</label>
                <div class="slider-container">
                    <input type="range" id="presence-penalty-${networkId}" min="-20" max="20" value="0" class="slider" step="1">
                    <span id="presence-penalty-value-${networkId}">0.0</span>
                </div>
            </div>
            <div class="form-group">
                <label for="frequency-penalty-${networkId}">Frequency Penalty:</label>
                <div class="slider-container">
                    <input type="range" id="frequency-penalty-${networkId}" min="-20" max="20" value="0" class="slider" step="1">
                    <span id="frequency-penalty-value-${networkId}">0.0</span>
                </div>
            </div>
        `;
        
        // Add to settings container
        if (networkSettingsContainer) {
            networkSettingsContainer.appendChild(networkSettings);
        }
        
        // Setup event listeners AFTER elements are added to the DOM
        setTimeout(() => {
            this.setupNetworkSettingsListeners(networkId);
        }, 0);
        
        // Create network status indicator
        const networkStatusContainer = document.querySelector('.network-status');
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.id = `${networkId}-status`;
        statusIndicator.innerHTML = `
            <span class="status-dot"></span>
            <span class="status-name">${networkData.name}</span>
        `;
        
        // Insert before the summarizer
        const summarizerStatus = document.getElementById('summarizer-status');
        networkStatusContainer.insertBefore(statusIndicator, summarizerStatus);
        
        // Update element reference
        this.elements[`use${networkNum}`] = document.getElementById(`use-${networkId}`);
        
        // Show the new network status indicator
        this.toggleNetworkVisibility(parseInt(networkNum), true);
        
        // Add event listener to enable/disable the network
        this.elements[`use${networkNum}`].addEventListener('change', (e) => {
            this.toggleNetworkVisibility(parseInt(networkNum), e.target.checked);
        });
    }

    toggleNetworkVisibility(networkNum, visible) {
        // Handle built-in networks (1-8)
        if (networkNum >= 1 && networkNum <= 8) {
            const element = this.elements[`network${networkNum}Status`];
            if (element) {
                element.style.display = visible ? 'flex' : 'none';
            }
        } else {
            // Handle custom networks beyond 8
            const networkStatus = document.getElementById(`network${networkNum}-status`);
            if (networkStatus) {
                networkStatus.style.display = visible ? 'flex' : 'none';
            }
        }
    }

    showApiKeyManager() {
        // Create modal for API key management
        const modal = document.createElement('div');
        modal.className = 'api-key-modal';
        modal.innerHTML = `
            <div class="api-key-modal-content">
                <h3>Manage AI Model API Keys</h3>
                <div class="api-key-list">
                    <div class="api-key-item">
                        <label for="openai-api-key">OpenAI API Key:</label>
                        <input type="password" id="openai-api-key" placeholder="sk-..." value="${localStorage.getItem('openai-api-key') || ''}">
                        <button class="save-key-btn" data-provider="openai">Save</button>
                    </div>
                    <div class="api-key-item">
                        <label for="anthropic-api-key">Anthropic API Key:</label>
                        <input type="password" id="anthropic-api-key" placeholder="sk-ant-..." value="${localStorage.getItem('anthropic-api-key') || ''}">
                        <button class="save-key-btn" data-provider="anthropic">Save</button>
                    </div>
                    <div class="api-key-item">
                        <label for="cohere-api-key">Cohere API Key:</label>
                        <input type="password" id="cohere-api-key" placeholder="..." value="${localStorage.getItem('cohere-api-key') || ''}">
                        <button class="save-key-btn" data-provider="cohere">Save</button>
                    </div>
                    <div class="api-key-item">
                        <label for="mistral-api-key">Mistral API Key:</label>
                        <input type="password" id="mistral-api-key" placeholder="..." value="${localStorage.getItem('mistral-api-key') || ''}">
                        <button class="save-key-btn" data-provider="mistral">Save</button>
                    </div>
                </div>
                <div class="api-provider-selection">
                    <h4>Select Model for Each Network</h4>
                    <div id="network-model-selections"></div>
                </div>
                <div class="modal-buttons">
                    <button id="close-api-manager" class="btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .api-key-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .api-key-modal-content {
                background-color: var(--card-bg);
                padding: 30px;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                box-shadow: var(--shadow);
                max-height: 80vh;
                overflow-y: auto;
            }
            .api-key-item {
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .api-key-item input {
                flex-grow: 1;
            }
            .save-key-btn {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
            }
            .api-provider-selection {
                margin-top: 20px;
                border-top: 1px solid var(--border-color);
                padding-top: 20px;
            }
            .network-model-select {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .network-model-select label {
                flex: 0 0 150px;
            }
            .network-model-select select {
                flex-grow: 1;
            }
        `;
        document.head.appendChild(style);
        
        // Populate network model selections
        const networkModelSelections = document.getElementById('network-model-selections');
        const framework = window.neuralFramework;
        if (framework) {
            const networkIds = framework.networkManager.getNetworkIds();
            networkIds.forEach(networkId => {
                const option = document.createElement('option');
                option.value = networkId;
                option.textContent = framework.networkManager.networks[networkId].name;
                select.appendChild(option);
            });
        }
        
        // Add event listeners for API key saving
        document.querySelectorAll('.save-key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.dataset.provider;
                const inputElement = document.getElementById(`${provider}-api-key`);
                if (inputElement && inputElement.value) {
                    localStorage.setItem(`${provider}-api-key`, inputElement.value);
                    this.showMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved!`, 'success');
                }
            });
        });
        
        // Add event listener for network model selections
        if (framework) {
            const networkIds = framework.networkManager.getNetworkIds();
            networkIds.forEach(networkId => {
                const selectElement = document.getElementById(`${networkId}-model`);
                if (selectElement) {
                    selectElement.addEventListener('change', (e) => {
                        localStorage.setItem(`${networkId}-model`, e.target.value);
                    });
                }
            });
        }
        
        // Add event listener for closing modal
        document.getElementById('close-api-manager').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }

    showMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message-popup ${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Add styles for the message
        const style = document.createElement('style');
        style.textContent = `
            .message-popup {
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 10px 20px;
                border-radius: 5px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                animation: fadeInOut 3s forwards;
            }
            .message-popup.success {
                background-color: var(--success-color);
            }
            .message-popup.info {
                background-color: var(--primary-color);
            }
            .message-popup.error {
                background-color: #ff4d4d;
            }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 3000);
    }

    resetUI() {
        // Reset all UI elements
        this.elements.projectName.value = '';
        this.elements.projectDescription.value = '';
        this.elements.summarizerInstructions.value = '';
        this.elements.maxIterations.value = '5';
        this.elements.maxIterationsInput.value = '5';
        this.elements.iterationValue.textContent = '5';
        this.elements.temperature.value = '7';
        this.elements.temperatureValue.textContent = '0.7';
        this.elements.maxTokens.value = '1000';
        this.elements.tokensValue.textContent = '1000';
        this.elements.topP.value = '10';
        this.elements.topPValue.textContent = '1.0';
        this.elements.presencePenalty.value = '0';
        this.elements.presencePenaltyValue.textContent = '0.0';
        this.elements.frequencyPenalty.value = '0';
        this.elements.frequencyPenaltyValue.textContent = '0.0';
        this.elements.projectName.disabled = false;
        this.elements.projectDescription.disabled = false;
        this.elements.summarizerInstructions.disabled = false;
        this.elements.maxIterations.disabled = false;
        this.elements.maxIterationsInput.disabled = false;
        this.elements.startBtn.disabled = false;
        this.elements.iterationCounter.textContent = '0';
        this.elements.summaryList.innerHTML = '';
        this.elements.chatMessages.innerHTML = '';
        this.elements.finalOutput.innerHTML = '<p class="placeholder">The finalized output will appear here after collaboration is complete.</p>';
        this.updateNetworkStatus(null);
        
        // Reset Network toggles
        this.elements.useNetwork1.checked = true;
        this.elements.useNetwork2.checked = true;
        this.elements.useNetwork3.checked = false;
        this.elements.useNetwork4.checked = false;
        this.elements.useNetwork5.checked = false;
        this.elements.useNetwork6.checked = false;
        this.elements.useNetwork7.checked = false;
        this.elements.useNetwork8.checked = false;
        this.toggleNetworkVisibility(1, true);
        this.toggleNetworkVisibility(2, true);
        this.toggleNetworkVisibility(3, false);
        this.toggleNetworkVisibility(4, false);
        this.toggleNetworkVisibility(5, false);
        this.toggleNetworkVisibility(6, false);
        this.toggleNetworkVisibility(7, false);
        this.toggleNetworkVisibility(8, false);
        
        // Reset logit bias
        this.elements.logitBias.value = '';
        
        // Update all network labels in the UI
        document.querySelector('#network1-status .status-name').textContent = 'Analytical Network';
        document.querySelector('#network2-status .status-name').textContent = 'Creative Network';
        document.querySelector('#network3-status .status-name').textContent = 'Implementation Network';
        document.querySelector('#network4-status .status-name').textContent = 'Data Science Network';
        document.querySelector('#network5-status .status-name').textContent = 'Ethical Network';
        document.querySelector('#network6-status .status-name').textContent = 'User Experience Network';
        document.querySelector('#network7-status .status-name').textContent = 'Systems Thinking Network';
        document.querySelector('#network8-status .status-name').textContent = 'Devil\'s Advocate Network';
        document.querySelector('#summarizer-status .status-name').textContent = 'Synthesizer Network';
        
        this.elements.attachmentPreview.innerHTML = '';
        this.fileManager.clearAttachments();
        
        // Reset network settings
        for (let i = 1; i <= 8; i++) {
            const networkId = `network${i}`;
            document.getElementById(`temperature-${networkId}`).value = 7;
            document.getElementById(`temperature-value-${networkId}`).textContent = '0.7';
            document.getElementById(`top-p-${networkId}`).value = 10;
            document.getElementById(`top-p-value-${networkId}`).textContent = '1.0';
            document.getElementById(`max-tokens-${networkId}`).value = 1000;
            document.getElementById(`max-tokens-value-${networkId}`).textContent = '1000';
            document.getElementById(`presence-penalty-${networkId}`).value = 0;
            document.getElementById(`presence-penalty-value-${networkId}`).textContent = '0.0';
            document.getElementById(`frequency-penalty-${networkId}`).value = 0;
            document.getElementById(`frequency-penalty-value-${networkId}`).textContent = '0.0';
            
            // Reset system prompts
            if (document.getElementById(`system-prompt-${networkId}`)) {
                document.getElementById(`system-prompt-${networkId}`).value = '';
            }
        }
        
        // Reset summarizer settings
        document.getElementById('temperature-summarizer').value = 7;
        document.getElementById('temperature-value-summarizer').textContent = '0.7';
        document.getElementById('top-p-summarizer').value = 10;
        document.getElementById('top-p-value-summarizer').textContent = '1.0';
        document.getElementById('max-tokens-summarizer').value = 1000;
        document.getElementById('max-tokens-value-summarizer').textContent = '1000';
        document.getElementById('presence-penalty-summarizer').value = 0;
        document.getElementById('presence-penalty-value-summarizer').textContent = '0.0';
        document.getElementById('frequency-penalty-summarizer').value = 0;
        document.getElementById('frequency-penalty-value-summarizer').textContent = '0.0';
        
        // Reset summarizer system prompt
        if (document.getElementById('system-prompt-summarizer')) {
            document.getElementById('system-prompt-summarizer').value = '';
        }
        
        this.hidePauseButton();
        this.hideUserPromptArea();
        
        // Create continue discussion button if it doesn't exist
        if (this.elements.continueDiscussionBtn) {
            this.elements.continueDiscussionBtn.id = 'continue-discussion';
            this.elements.continueDiscussionBtn.className = 'btn btn-secondary';
            this.elements.continueDiscussionBtn.textContent = 'Continue Discussion';
            this.elements.continueDiscussionBtn.style.display = 'none';
            if (!this.elements.continueDiscussionBtn.parentNode) {
                this.elements.chatMessages.parentNode.appendChild(this.elements.continueDiscussionBtn);
            }
        }
    }

    simulateThinking(network, networks, duration = 1500) {
        // Create typing indicator
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${network}`;
        messageDiv.id = 'typing-indicator';
        
        const senderElement = document.createElement('div');
        senderElement.className = 'sender';
        senderElement.textContent = networks[network].name;
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        messageDiv.appendChild(senderElement);
        messageDiv.appendChild(typingIndicator);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Return a Promise that resolves after the duration
        return new Promise(resolve => {
            setTimeout(() => {
                // Remove typing indicator only after the thinking time is complete
                const indicator = document.getElementById('typing-indicator');
                if (indicator) {
                    indicator.remove();
                }
                resolve();
            }, duration);
        });
    }

    showPauseButton() {
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.style.display = 'block';
        }
    }
    
    hidePauseButton() {
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.style.display = 'none';
        }
    }
    
    showUserPromptArea() {
        if (this.elements.userInputArea) {
            this.elements.userInputArea.style.display = 'block';
            this.elements.userPrompt.focus();
        }
    }
    
    hideUserPromptArea() {
        if (this.elements.userInputArea) {
            this.elements.userInputArea.style.display = 'none';
            this.elements.userPrompt.value = '';
        }
    }

    updateLanguage(languageCode) {
        if (!languageCode) return;
        
        this.currentLanguage = languageCode;
        
        // Only update if we have valid elements and translations
        if (this.elements && Object.keys(this.elements).length > 0) {
            // Update all translatable text elements
            this.updateElementTexts(languageCode);
            
            // Update placeholders
            this.updatePlaceholders(languageCode);
            
            // Update select options where needed
            this.updateSelectOptions(languageCode);
        }
    }
    
    updatePlaceholders(languageCode) {
        const translations = this.getLanguageTranslations();
        
        if (this.elements.projectName && translations['Enter topic name'] && translations['Enter topic name'][languageCode]) {
            this.elements.projectName.placeholder = translations['Enter topic name'][languageCode] || 'Enter topic name';
        }
        if (this.elements.projectDescription && translations['Describe the topic you want to explore'] && translations['Describe the topic you want to explore'][languageCode]) {
            this.elements.projectDescription.placeholder = translations['Describe the topic you want to explore'][languageCode] || 'Describe the topic you want to explore';
        }
        if (this.elements.summarizerInstructions && translations['Custom instructions for the Synthesizer Network (optional)'] && translations['Custom instructions for the Synthesizer Network (optional)'][languageCode]) {
            this.elements.summarizerInstructions.placeholder = translations['Custom instructions for the Synthesizer Network (optional)'][languageCode] || 'Custom instructions for the Synthesizer Network (optional)';
        }
        if (this.elements.systemPrompt && translations['Customize the system prompt for networks'] && translations['Customize the system prompt for networks'][languageCode]) {
            this.elements.systemPrompt.placeholder = translations['Customize the system prompt for networks'][languageCode] || 'Customize the system prompt for networks';
        }
    }
    
    updateElementTexts(languageCode) {
        const translations = this.getLanguageTranslations();
        
        // Update main header
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = translations['Neural Collaborative Framework'][languageCode] || 'Neural Collaborative Framework';
        }
        
        const headerDescription = document.querySelector('.description p');
        if (headerDescription) {
            headerDescription.textContent = translations['A collaborative framework where neural networks work together through iterative dialogue on any topic.'][languageCode] || 'A collaborative framework where neural networks work together through iterative dialogue on any topic.';
        }
        
        // Update button texts
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = translations['Start Collaboration'][languageCode] || 'Start Collaboration';
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.textContent = translations['Reset Project'][languageCode] || 'Reset Project';
        }
        
        // Update all labels
        const labelMap = {
            'Topic Name:': 'project-name',
            'Topic Description:': 'project-description',
            'Summarizer Instructions:': 'summarizer-instructions',
            'Maximum Iterations:': 'max-iterations',
            'Discussion rounds:': 'discussion-rounds',
            'Interface Language:': 'interface-language',
            'Temperature:': 'temperature',
            'Max Tokens:': 'max-tokens',
            'Top P:': 'top-p',
            'Presence Penalty:': 'presence-penalty',
            'Frequency Penalty:': 'frequency-penalty',
            'Logit Bias:': 'logit-bias',
            'System Prompt Template:': 'system-prompt',
            'API Keys Configuration:': 'api-keys',
            'Iteration Determination:': 'iteration-type'
        };
        
        Object.keys(labelMap).forEach(labelText => {
            const label = document.querySelector(`label[for="${labelMap[labelText]}"]`);
            if (label && translations[labelText] && translations[labelText][languageCode]) {
                label.textContent = translations[labelText][languageCode];
            }
        });
    }

    updateSelectOptions(languageCode) {
        const translations = this.getLanguageTranslations();
        
        // Update iteration type options
        const iterationType = document.getElementById('iteration-type');
        if (iterationType) {
            const options = iterationType.querySelectorAll('option');
            options[0].textContent = translations['Automatic (Standard)'][languageCode] || 'Automatic (Standard)';
            options[1].textContent = translations['Custom Cycle Definition'][languageCode] || 'Custom Cycle Definition';
        }
    }
    
    updateNetworkLabels(languageCode) {
        const translations = this.getLanguageTranslations();
        
        // Update network status names
        const networkNames = {
            'Analytical Network': '#network1-status .status-name',
            'Creative Network': '#network2-status .status-name',
            'Implementation Network': '#network3-status .status-name',
            'Data Science Network': '#network4-status .status-name',
            'Ethical Network': '#network5-status .status-name',
            'User Experience Network': '#network6-status .status-name',
            'Systems Thinking Network': '#network7-status .status-name',
            'Devil\'s Advocate Network': '#network8-status .status-name',
            'Synthesizer Network': '#summarizer-status .status-name'
        };
        
        Object.keys(networkNames).forEach(networkName => {
            const element = document.querySelector(networkNames[networkName]);
            if (element && translations[networkName]) {
                element.textContent = translations[networkName][languageCode] || networkName;
            }
        });
    }
    
    updateCheckboxLabels(languageCode) {
        const translations = this.getLanguageTranslations();
        
        const checkboxLabels = {
            'Enable Infinite Discussion Mode': 'infinite-mode',
            'Enable Analytical Network (Network 1)': 'use-network1',
            'Enable Creative Network (Network 2)': 'use-network2',
            'Enable Third Network (Implementation Network)': 'use-network3',
            'Enable Fourth Network (Data Science Network)': 'use-network4',
            'Enable Fifth Network (Ethical Network)': 'use-network5',
            'Enable Sixth Network (User Experience Network)': 'use-network6',
            'Enable Seventh Network (Systems Thinking Network)': 'use-network7',
            'Enable Eighth Network (Devil\'s Advocate Network)': 'use-network8',
            'Enable Initiative Mode': 'initiative-enabled',
            'Enable Fragmented Messages': 'fragmented-messages-enabled'
        };
        
        Object.keys(checkboxLabels).forEach(labelText => {
            const checkbox = document.getElementById(checkboxLabels[labelText]);
            if (checkbox) {
                const label = checkbox.closest('.checkbox-label');
                if (label && translations[labelText]) {
                    const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                    if (textNode) {
                        textNode.textContent = translations[labelText][languageCode] || labelText;
                    }
                }
            }
        });
    }

    getLanguageTranslations() {
        return {
            'Neural Collaborative Framework': {
                'ru': 'Нейронная Коллаборативная Платформа',
                'es': 'Marco de Colaboración Neural',
                'fr': 'Cadre de Collaboration Neuronale',
                'de': 'Neuronales Kollaborations-Framework',
                'zh': '神经协作框架',
                'ja': 'ニューラル協調フレームワーク',
                'ko': '신경망 협업 프레임워크',
                'ar': 'إطار التعاون العصبي',
                'hi': 'न्यूरल सहयोग फ्रेमवर्क'
            },
            'A collaborative framework where neural networks work together through iterative dialogue on any topic.': {
                'ru': 'Платформа для совместной работы нейронных сетей через итеративный диалог по любой теме.',
                'es': 'Un marco colaborativo donde las redes neuronales trabajan juntas a través del diálogo iterativo sobre cualquier tema.',
                'fr': 'Un cadre collaboratif où les réseaux de neurones travaillent ensemble par le dialogue itératif sur n\'importe quel sujet.',
                'de': 'Ein kollaboratives Framework, in dem neuronale Netzwerke durch iterativen Dialog zu jedem Thema zusammenarbeiten.',
                'zh': '一个协作框架，神经网络通过迭代对话在任何主题上协同工作。',
                'ja': 'ニューラルネットワークがあらゆるトピックについて反復対話を通じて協力するコラボレーションフレームワーク。',
                'ko': '신경망이 모든 주제에 대해 반복적 대화를 통해 협력하는 협업 프레임워크입니다.',
                'ar': 'إطار تعاوني حيث تعمل الشبكات العصبية معًا من خلال الحوار التكراري حول أي موضوع.',
                'hi': 'एक सहयोगी फ्रेमवर्क जहाँ न्यूरल नेटवर्क किसी भी विषय पर पुनरावर्ती संवाद के माध्यम से मिलकर काम करते हैं।'
            },
            'Start Collaboration': {
                'ru': 'Начать сотрудничество',
                'es': 'Iniciar colaboración',
                'fr': 'Démarrer la collaboration',
                'de': 'Zusammenarbeit starten',
                'zh': '开始协作',
                'ja': 'コラボレーション開始',
                'ko': '협업 시작',
                'ar': 'بدء التعاون',
                'hi': 'सहयोग शुरू करें'
            },
            'Reset Project': {
                'ru': 'Сбросить проект',
                'es': 'Reiniciar proyecto',
                'fr': 'Réinitialiser le projet',
                'de': 'Projekt zurücksetzen',
                'zh': '重置项目',
                'ja': 'プロジェクトリセット',
                'ko': '프로젝트 재설정',
                'ar': 'إعادة تعيين المشروع',
                'hi': 'प्रोजेक्ट रीसेट करें'
            },
            'Topic Name:': {
                'ru': 'Название темы:',
                'es': 'Nombre del tema:',
                'fr': 'Nom du sujet :',
                'de': 'Themenname:',
                'zh': '主题名称：',
                'ja': 'トピック名：',
                'ko': '주제 이름:',
                'ar': 'اسم الموضوع:',
                'hi': 'विषय नाम:'
            },
            'Topic Description:': {
                'ru': 'Описание темы:',
                'es': 'Descripción del tema:',
                'fr': 'Description du sujet :',
                'de': 'Themenbeschreibung:',
                'zh': '主题描述：',
                'ja': 'トピック説明：',
                'ko': '주제 설명:',
                'ar': 'وصف الموضوع:',
                'hi': 'विषय विवरण:'
            },
            'Enter topic name': {
                'ru': 'Введите название темы',
                'es': 'Ingrese el nombre del tema',
                'fr': 'Saisissez le nom du sujet',
                'de': 'Themenname eingeben',
                'zh': '输入主题名称',
                'ja': 'トピック名を入力',
                'ko': '주제 이름 입력',
                'ar': 'أدخل اسم الموضوع',
                'hi': 'विषय नाम दर्ज करें'
            },
            'Describe the topic you want to explore': {
                'ru': 'Опишите тему, которую хотите исследовать',
                'es': 'Describe el tema que quieres explorar',
                'fr': 'Décrivez le sujet que vous voulez explorer',
                'de': 'Beschreiben Sie das Thema, das Sie erkunden möchten',
                'zh': '描述您想要探索的主题',
                'ja': '探索したいトピックを説明してください',
                'ko': '탐색하고 싶은 주제를 설명하세요',
                'ar': 'صف الموضوع الذي تريد استكشافه',
                'hi': 'उस विषय का वर्णन करें जिसे आप एक्सप्लोर करना चाहते हैं'
            },
            'Custom instructions for the Synthesizer Network (optional)': {
                'ru': 'Пользовательские инструкции для Сети синтезатора (необязательно)',
                'es': 'Instrucciones personalizadas para la Red Sintetizadora (opcional)',
                'fr': 'Instructions personnalisées pour le Réseau Synthétiseur (optionnel)',
                'de': 'Benutzerdefinierte Anweisungen für das Synthesizer-Netzwerk (optional)',
                'zh': '综合网络的自定义指令（可选）',
                'ja': 'シンセサイザーネットワークのカスタム指示（オプション）',
                'ko': '합성 네트워크를 위한 사용자 지정 지침 (선택사항)',
                'ar': 'تعليمات مخصصة لشبكة المركب (اختياري)',
                'hi': 'सिंथेसाइज़र नेटवर्क के लिए कस्टम निर्देश (वैकल्पिक)'
            },
            'Customize the system prompt for networks': {
                'ru': 'Настройте системный промпт для сетей',
                'es': 'Personalizar el prompt del sistema para redes',
                'fr': 'Personnaliser l\'invite système pour les réseaux',
                'de': 'System-Prompt für Netzwerke anpassen',
                'zh': '为网络自定义系统提示',
                'ja': 'ネットワークのシステムプロンプトをカスタマイズ',
                'ko': '네트워크용 시스템 프롬프트 사용자 정의',
                'ar': 'تخصيص موجه النظام للشبكات',
                'hi': 'नेटवर्क के लिए सिस्टम प्रॉम्प्ट कस्टमाइज़ करें'
            },
            'Project Setup': {
                'ru': 'Настройка проекта',
                'es': 'Configuración del proyecto',
                'fr': 'Configuration du projet',
                'de': 'Projekt-Setup',
                'zh': '项目设置',
                'ja': 'プロジェクト設定',
                'ko': '프로젝트 설정',
                'ar': 'إعداد المشروع',
                'hi': 'प्रोजेक्ट सेटअप'
            },
            'Model Settings': {
                'ru': 'Настройки модели',
                'es': 'Configuración del modelo',
                'fr': 'Paramètres du modèle',
                'de': 'Modelleinstellungen',
                'zh': '模型设置',
                'ja': 'モデル設定',
                'ko': '모델 설정',
                'ar': 'إعدادات النموذج',
                'hi': 'मॉडल सेटिंग्स'
            },
            'Development Dialogue': {
                'ru': 'Диалог разработки',
                'es': 'Diálogo de desarrollo',
                'fr': 'Dialogue de développement',
                'de': 'Entwicklungsdialog',
                'zh': '开发对话',
                'ja': '開発対話',
                'ko': '개발 대화',
                'ar': 'حوار التطوير',
                'hi': 'विकास संवाद'
            },
            'Development Output': {
                'ru': 'Результат разработки',
                'es': 'Salida de desarrollo',
                'fr': 'Sortie de développement',
                'de': 'Entwicklungsausgabe',
                'zh': '开发输出',
                'ja': '開発出力',
                'ko': '개발 출력',
                'ar': 'مخرجات التطوير',
                'hi': 'विकास आउटपुट'
            },
            'Analytical Network': {
                'ru': 'Аналитическая сеть',
                'es': 'Red analítica',
                'fr': 'Réseau analytique',
                'de': 'Analytisches Netzwerk',
                'zh': '分析网络',
                'ja': '分析ネットワーク',
                'ko': '분석 네트워크',
                'ar': 'الشبكة التحليلية',
                'hi': 'विश्लेषणात्मक नेटवर्क'
            },
            'Creative Network': {
                'ru': 'Креативная сеть',
                'es': 'Red creativa',
                'fr': 'Réseau créatif',
                'de': 'Kreatives Netzwerk',
                'zh': '创意网络',
                'ja': 'クリエイティブネットワーク',
                'ko': '창의 네트워크',
                'ar': 'الشبكة الإبداعية',
                'hi': 'रचनात्मक नेटवर्क'
            },
            'Implementation Network': {
                'ru': 'Сеть реализации',
                'es': 'Red de implementación',
                'fr': 'Réseau d\'implémentation',
                'de': 'Implementierungsnetzwerk',
                'zh': '实施网络',
                'ja': '実装ネットワーク',
                'ko': '구현 네트워크',
                'ar': 'شبكة التنفيذ',
                'hi': 'कार्यान्वयन नेटवर्क'
            },
            'Data Science Network': {
                'ru': 'Сеть науки о данных',
                'es': 'Red de ciencia de datos',
                'fr': 'Réseau de science des données',
                'de': 'Data Science Netzwerk',
                'zh': '数据科学网络',
                'ja': 'データサイエンスネットワーク',
                'ko': '데이터 사이언스 네트워크',
                'ar': 'شبكة علوم البيانات',
                'hi': 'डेटा साइंस नेटवर्क'
            },
            'Ethical Network': {
                'ru': 'Этическая сеть',
                'es': 'Red ética',
                'fr': 'Réseau éthique',
                'de': 'Ethisches Netzwerk',
                'zh': '伦理网络',
                'ja': '倫理ネットワーク',
                'ko': '윤리 네트워크',
                'ar': 'الشبكة الأخلاقية',
                'hi': 'नैतिक नेटवर्क'
            },
            'User Experience Network': {
                'ru': 'Сеть пользовательского опыта',
                'es': 'Red de experiencia de usuario',
                'fr': 'Réseau d\'expérience utilisateur',
                'de': 'Benutzererfahrungs-Netzwerk',
                'zh': '用户体验网络',
                'ja': 'ユーザーエクスペリエンスネットワーク',
                'ko': '사용자 경험 네트워크',
                'ar': 'شبكة تجربة المستخدم',
                'hi': 'उपयोगकर्ता अनुभव नेटवर्क'
            },
            'Systems Thinking Network': {
                'ru': 'Сеть системного мышления',
                'es': 'Red de pensamiento sistémico',
                'fr': 'Réseau de pensée systémique',
                'de': 'Systemdenken-Netzwerk',
                'zh': '系统思维网络',
                'ja': 'システム思考ネットワーク',
                'ko': '시스템 사고 네트워크',
                'ar': 'شبكة التفكير النظمي',
                'hi': 'सिस्टम थिंकिंग नेटवर्क'
            },
            'Devil\'s Advocate Network': {
                'ru': 'Сеть адвоката дьявола',
                'es': 'Red del abogado del diablo',
                'fr': 'Réseau de l\'avocat du diable',
                'de': 'Teufelsanwalt-Netzwerk',
                'zh': '反对者网络',
                'ja': '悪魔の代弁者ネットワーク',
                'ko': '반대 논리 네트워크',
                'ar': 'شبكة محامي الشيطان',
                'hi': 'शैतान के वकील नेटवर्क'
            },
            'Synthesizer Network': {
                'ru': 'Сеть синтезатора',
                'es': 'Red sintetizadora',
                'fr': 'Réseau synthétiseur',
                'de': 'Synthesizer-Netzwerk',
                'zh': '综合网络',
                'ja': 'シンセサイザーネットワーク',
                'ko': '합성 네트워크',
                'ar': 'شبكة المركب',
                'hi': 'सिंथेसाइज़र नेटवर्क'
            },
            'Enable Infinite Discussion Mode': {
                'ru': 'Включить режим бесконечного обсуждения',
                'es': 'Habilitar modo de discusión infinita',
                'fr': 'Activer le mode de discussion infinie',
                'de': 'Unendlichen Diskussionsmodus aktivieren',
                'zh': '启用无限讨论模式',
                'ja': '無限ディスカッションモードを有効にする',
                'ko': '무한 토론 모드 활성화',
                'ar': 'تفعيل وضع النقاش اللانهائي',
                'hi': 'अनंत चर्चा मोड सक्षम करें'
            },
            'Enable Initiative Mode': {
                'ru': 'Включить режим инициативы',
                'es': 'Habilitar modo de iniciativa',
                'fr': 'Activer le mode initiative',
                'de': 'Initiativ-Modus aktivieren',
                'zh': '启用主动模式',
                'ja': 'イニシアチブモードを有効にする',
                'ko': '주도권 모드 활성화',
                'ar': 'تفعيل وضع المبادرة',
                'hi': 'पहल मोड सक्षम करें'
            },
            'Enable Fragmented Messages': {
                'ru': 'Включить фрагментированные сообщения',
                'es': 'Habilitar mensajes fragmentados',
                'fr': 'Activer les messages fragmentés',
                'de': 'Fragmentierte Nachrichten aktivieren',
                'zh': '启用分段消息',
                'ja': '断片化されたメッセージを有効にする',
                'ko': '분할 메시지 활성화',
                'ar': 'تفعيل الرسائل المجزأة',
                'hi': 'खंडित संदेश सक्षम करें'
            },
            'Custom instructions for the Synthesizer Network (optional)': {
                'ru': 'Пользовательские инструкции для Сети синтезатора (необязательно)',
                'es': 'Instrucciones personalizadas para la Red Sintetizadora (opcional)',
                'fr': 'Instructions personnalisées pour le Réseau Synthétiseur (optionnel)',
                'de': 'Benutzerdefinierte Anweisungen für das Synthesizer-Netzwerk (optional)',
                'zh': '综合网络的自定义指令（可选）',
                'ja': 'シンセサイザーネットワークのカスタム指示（オプション）',
                'ko': '합성 네트워크를 위한 사용자 지정 지침 (선택사항)',
                'ar': 'تعليمات مخصصة لشبكة المركب (اختياري)',
                'hi': 'सिंथेसाइज़र नेटवर्क के लिए कस्टम निर्देश (वैकल्पिक)'
            },
            'Customize the system prompt for networks': {
                'ru': 'Настройте системный промпт для сетей',
                'es': 'Personalizar el prompt del sistema para redes',
                'fr': 'Personnaliser l\'invite système pour les réseaux',
                'de': 'System-Prompt für Netzwerke anpassen',
                'zh': '为网络自定义系统提示',
                'ja': 'ネットワークのシステムプロンプトをカスタマイズ',
                'ko': '네트워크용 시스템 프롬프트 사용자 정의',
                'ar': 'تخصيص موجه النظام للشبكات',
                'hi': 'नेटवर्क के लिए सिस्टम प्रॉम्प्ट कस्टमाइज़ करें'
            },
            'Maximum Iterations:': {
                'ru': 'Максимальные итерации:',
                'es': 'Iteraciones máximas:',
                'fr': 'Itérations maximales :',
                'de': 'Maximale Iterationen:',
                'zh': '最大迭代次数：',
                'ja': '最大反復回数：',
                'ko': '최대 반복 횟수:',
                'ar': 'التكرارات القصوى:',
                'hi': 'अधिकतम पुनरावृत्तियाँ:'
            },
            'Discussion rounds:': {
                'ru': 'Раунды обсуждения:',
                'es': 'Rondas de discusión:',
                'fr': 'Tours de discussion :',
                'de': 'Diskussionsrunden:',
                'zh': '讨论轮次：',
                'ja': 'ディスカッションラウンド：',
                'ko': '토론 라운드:',
                'ar': 'جولات النقاش:',
                'hi': 'चर्चा के दौर:'
            },
            'Interface Language:': {
                'ru': 'Язык интерфейса:',
                'es': 'Idioma de la interfaz:',
                'fr': 'Langue de l\'interface :',
                'de': 'Sprache der Benutzeroberfläche:',
                'zh': '界面语言：',
                'ja': 'インターフェース言語：',
                'ko': '인터페이스 언어:',
                'ar': 'لغة الواجهة:',
                'hi': 'इंटरफ़ेस भाषा:'
            },
            'Temperature:': {
                'ru': 'Температура:',
                'es': 'Temperatura:',
                'fr': 'Température :',
                'de': 'Temperatur:',
                'zh': '温度：',
                'ja': '温度：',
                'ko': '온도:',
                'ar': 'درجة الحرارة:',
                'hi': 'तापमान:'
            },
            'Max Tokens:': {
                'ru': 'Макс. токены:',
                'es': 'Tokens máximos:',
                'fr': 'Tokens max :',
                'de': 'Max. Token:',
                'zh': '最大令牌：',
                'ja': '最大トークン：',
                'ko': '최대 토큰:',
                'ar': 'الحد الأقصى للرموز:',
                'hi': 'अधिकतम टोकन:'
            },
            'Automatic (Standard)': {
                'ru': 'Автоматический (Стандартный)',
                'es': 'Automático (Estándar)',
                'fr': 'Automatique (Standard)',
                'de': 'Automatisch (Standard)',
                'zh': '自动（标准）',
                'ja': '自動（標準）',
                'ko': '자동 (표준)',
                'ar': 'تلقائي (قياسي)',
                'hi': 'स्वचालित (मानक)'
            },
            'Custom Cycle Definition': {
                'ru': 'Пользовательское определение цикла',
                'es': 'Definición de ciclo personalizada',
                'fr': 'Définition de cycle personnalisée',
                'de': 'Benutzerdefinierte Zyklusdefinition',
                'zh': '自定义周期定义',
                'ja': 'カスタムサイクル定義',
                'ko': '사용자 정의 사이클 정의',
                'ar': 'تعريف دورة مخصص',
                'hi': 'कस्टम चक्र परिभाषा'
            }
        };
    }

    createStreamInterface() {
        // Create stream interface container (initially hidden)
        const streamContainer = document.createElement('div');
        streamContainer.id = 'stream-interface';
        streamContainer.className = 'stream-interface hidden';
        streamContainer.innerHTML = `
            <div class="stream-header">
                <h3>Event-Driven Discussion</h3>
                <div class="mode-toggle">
                    <button id="mode-iterative" class="mode-btn">Iterative</button>
                    <button id="mode-event-driven" class="mode-btn active">Event-Driven</button>
                </div>
                <div class="stream-controls">
                    <button id="pause-stream" class="btn btn-secondary">Pause</button>
                    <button id="resume-stream" class="btn">Resume</button>
                </div>
            </div>
            
            <div class="stream-content">
                <div class="message-stream" id="message-stream">
                    <!-- Messages will be added here -->
                </div>
                
                <div class="model-status-panel">
                    <h4>Model Status</h4>
                    <div id="model-status-list" class="model-status-list">
                        <!-- Model statuses will be added here -->
                    </div>
                </div>
            </div>
            
            <div class="stream-input">
                <div class="manual-input">
                    <select id="manual-model-select">
                        <option value="">Select model to respond...</option>
                    </select>
                    <input type="text" id="parent-message-id" placeholder="Reply to message ID (optional)">
                    <button id="trigger-manual-response" class="btn">Trigger Response</button>
                </div>
            </div>
            
            <div class="summaries-tab hidden" id="summaries-tab">
                <h3>Discussion Summaries</h3>
                <div id="summaries-list" class="summaries-list">
                    <!-- Summaries will be added here -->
                </div>
            </div>
        `;
        
        // Add to discussion area
        const discussionArea = document.querySelector('.discussion-area');
        if (discussionArea) {
            discussionArea.appendChild(streamContainer);
        }
        
        this.streamElements = {
            container: streamContainer,
            messageStream: streamContainer.querySelector('#message-stream'),
            modelStatusList: streamContainer.querySelector('#model-status-list'),
            manualModelSelect: streamContainer.querySelector('#manual-model-select'),
            parentMessageId: streamContainer.querySelector('#parent-message-id'),
            triggerManualResponse: streamContainer.querySelector('#trigger-manual-response'),
            summariesTab: streamContainer.querySelector('#summaries-tab'),
            summariesList: streamContainer.querySelector('#summaries-list'),
            modeIterative: streamContainer.querySelector('#mode-iterative'),
            modeEventDriven: streamContainer.querySelector('#mode-event-driven'),
            pauseStream: streamContainer.querySelector('#pause-stream'),
            resumeStream: streamContainer.querySelector('#resume-stream')
        };
        
        this.setupStreamEventListeners();
    }
    
    setupStreamEventListeners() {
        this.streamElements.modeIterative.addEventListener('click', () => {
            if (window.neuralFramework) {
                window.neuralFramework.setMode('iterative');
            }
        });
        
        this.streamElements.modeEventDriven.addEventListener('click', () => {
            if (window.neuralFramework) {
                window.neuralFramework.setMode('event_driven');
            }
        });
        
        this.streamElements.triggerManualResponse.addEventListener('click', () => {
            const modelId = this.streamElements.manualModelSelect.value;
            const parentId = this.streamElements.parentMessageId.value.trim() || null;
            
            if (modelId && window.neuralFramework) {
                window.neuralFramework.dialogueManager.requestInitiative(modelId, parentId);
            }
        });
        
        this.streamElements.pauseStream.addEventListener('click', () => {
            if (window.neuralFramework) {
                window.neuralFramework.dialogueManager.stop();
            }
        });
        
        this.streamElements.resumeStream.addEventListener('click', () => {
            if (window.neuralFramework) {
                window.neuralFramework.dialogueManager.start();
            }
        });
    }
    
    showStreamInterface() {
        this.streamElements.container.classList.remove('hidden');
        document.querySelector('.chat-container').classList.add('hidden');
        
        // Populate model select
        const select = this.streamElements.manualModelSelect;
        select.innerHTML = '<option value="">Select model to respond...</option>';
        
        if (window.neuralFramework) {
            const networkIds = window.neuralFramework.networkManager.getNetworkIds();
            networkIds.forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = window.neuralFramework.networkManager.networks[id].name;
                select.appendChild(option);
            });
        }
    }
    
    hideStreamInterface() {
        this.streamElements.container.classList.add('hidden');
        document.querySelector('.chat-container').classList.remove('hidden');
    }
    
    updateModeInterface(mode) {
        if (mode === 'event_driven') {
            this.showStreamInterface();
            this.streamElements.modeEventDriven.classList.add('active');
            this.streamElements.modeIterative.classList.remove('active');
        } else {
            this.hideStreamInterface();
            this.streamElements.modeIterative.classList.add('active');
            this.streamElements.modeEventDriven.classList.remove('active');
        }
    }
    
    addStreamMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `stream-message ${message.authorId}`;
        messageEl.dataset.messageId = message.id;
        
        const authorName = message.authorId === 'system' ? 'System' : 
                          (window.neuralFramework?.networkManager.networks[message.authorId]?.name || message.authorId);
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-author">${authorName}</span>
                <span class="message-timestamp">${timestamp}</span>
                <span class="message-id">#${message.id.slice(-6)}</span>
                ${message.parentId ? `<span class="reply-to">↳ ${message.parentId.slice(-6)}</span>` : ''}
            </div>
            <div class="message-content">${message.content}</div>
            <div class="message-actions">
                <button class="reply-btn" data-message-id="${message.id}">Reply</button>
            </div>
        `;
        
        // Add indentation for replies
        if (message.parentId) {
            messageEl.style.marginLeft = '20px';
            messageEl.classList.add('reply-message');
        }
        
        this.streamElements.messageStream.appendChild(messageEl);
        this.streamElements.messageStream.scrollTop = this.streamElements.messageStream.scrollHeight;
        
        // Add event listener for reply button
        const replyBtn = messageEl.querySelector('.reply-btn');
        replyBtn.addEventListener('click', () => {
            this.streamElements.parentMessageId.value = message.id;
        });
        
        // If it's a summary, also add to summaries tab
        if (message.isSummary) {
            this.addToSummariesTab(message);
        }
    }
    
    updateModelPriorities(models) {
        const statusList = this.streamElements.modelStatusList;
        statusList.innerHTML = '';
        
        models.forEach(([modelId, model]) => {
            if (modelId === 'summarizer') return;
            
            const statusEl = document.createElement('div');
            statusEl.className = 'model-status-item';
            
            const networkName = window.neuralFramework?.networkManager.networks[modelId]?.name || modelId;
            const priorityColor = this.getPriorityColor(model.priorityScore);
            const statusText = model.isActive ? 'Generating...' : 
                              model.priorityScore >= 1.0 ? 'Ready' : 'Waiting';
            
            statusEl.innerHTML = `
                <div class="model-name">${networkName}</div>
                <div class="model-priority" style="color: ${priorityColor}">
                    Priority: ${model.priorityScore.toFixed(2)}
                </div>
                <div class="model-status">${statusText}</div>
                <div class="model-stats">
                    Unseen: ${model.unseenCount} | 
                    Last: ${model.lastMessageTime ? new Date(model.lastMessageTime).toLocaleTimeString() : 'Never'}
                </div>
            `;
            
            statusList.appendChild(statusEl);
        });
    }
    
    getPriorityColor(score) {
        if (score >= 2.0) return '#e63946';
        if (score >= 1.0) return '#ff9e00';
        if (score >= 0.5) return '#ffd166';
        return '#6c757d';
    }
    
    addToSummariesTab(summaryMessage) {
        const summaryEl = document.createElement('div');
        summaryEl.className = 'summary-item';
        summaryEl.innerHTML = `
            <div class="summary-header">
                <span class="summary-timestamp">${new Date(summaryMessage.timestamp).toLocaleString()}</span>
                <span class="summary-id">#${summaryMessage.id.slice(-6)}</span>
            </div>
            <div class="summary-content">${summaryMessage.content}</div>
        `;
        
        this.streamElements.summariesList.appendChild(summaryEl);
    }

    createHistoryUI(savedDiscussions) {
        // Create history panel
        const historyPanel = document.createElement('div');
        historyPanel.id = 'history-panel';
        historyPanel.className = 'history-panel';
        historyPanel.innerHTML = `
            <div class="history-header">
                <h3>Discussion History</h3>
                <button id="close-history" class="btn-icon">×</button>
            </div>
            <div class="history-list">
                ${savedDiscussions.map((discussion, index) => `
                    <div class="history-item" data-index="${index}">
                        <div class="history-title">${discussion.projectName}</div>
                        <div class="history-date">${new Date(discussion.timestamp).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(historyPanel);
        
        // Add styles
        const style = document.createElement('style');
        style.id = 'history-style';
        style.textContent = `
            .history-panel {
                position: fixed;
                top: 0;
                right: -350px;
                width: 350px;
                height: 100%;
                background-color: var(--card-bg);
                box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                z-index: 1000;
                transition: right 0.3s ease;
                display: flex;
                flex-direction: column;
            }
            .history-panel.visible {
                right: 0;
            }
            .history-header {
                padding: 15px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .history-header h3 {
                margin: 0;
                color: var(--primary-color);
            }
            .btn-icon {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-color);
            }
            .history-list {
                flex-grow: 1;
                overflow-y: auto;
                padding: 10px;
            }
            .history-item {
                padding: 15px;
                margin-bottom: 10px;
                background-color: rgba(108, 99, 255, 0.05);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .history-item:hover {
                background-color: rgba(108, 99, 255, 0.1);
                transform: translateX(5px);
            }
            .history-title {
                font-weight: 600;
                margin-bottom: 5px;
            }
            .history-date {
                font-size: 12px;
                color: var(--light-text);
            }
            
            .history-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: var(--card-bg);
                padding: 25px;
                border-radius: 15px;
                box-shadow: var(--shadow);
                z-index: 1100;
                max-width: 600px;
                width: 90%;
            }
            .history-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                z-index: 1050;
            }
            .history-dialog-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .history-dialog-button {
                padding: 8px 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 500;
            }
            .history-dialog-button.primary {
                background-color: var(--primary-color);
                color: white;
            }
            .history-dialog-button.secondary {
                background-color: #e9ecef;
                color: #495057;
            }
        `;
        
        document.head.appendChild(style);
        
        // Add event listeners
        document.getElementById('close-history').addEventListener('click', () => {
            historyPanel.classList.remove('visible');
        });
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.showHistoryDialog(savedDiscussions[index]);
            });
        });
    }
    
    toggleHistoryPanel() {
        const historyPanel = document.getElementById('history-panel');
        if (historyPanel) {
            historyPanel.classList.toggle('visible');
        } else {
            // If the panel doesn't exist yet, try to load discussions again
            if (window.neuralFramework) {
                window.neuralFramework.loadSavedDiscussions();
                
                // Then make it visible after a small delay
                setTimeout(() => {
                    const newPanel = document.getElementById('history-panel');
                    if (newPanel) {
                        newPanel.classList.add('visible');
                    }
                }, 100);
            }
        }
    }
    
    showHistoryDialog(discussion) {
        // Create overlay and dialog
        const overlay = document.createElement('div');
        overlay.className = 'history-dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'history-dialog';
        dialog.innerHTML = `
            <h3>${discussion.projectName}</h3>
            <p>${discussion.projectDescription}</p>
            <p class="history-date">Created: ${new Date(discussion.timestamp).toLocaleString()}</p>
            <div class="history-dialog-buttons">
                <button class="history-dialog-button primary" id="view-history-discussion">View Full Discussion</button>
                <button class="history-dialog-button secondary" id="export-history-discussion">Export</button>
                <button class="history-dialog-button secondary" id="close-history-dialog">Close</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // Add event listeners
        document.getElementById('close-history-dialog').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        });
        
        document.getElementById('view-history-discussion').addEventListener('click', () => {
            // Logic to load and display the full discussion
            this.loadHistoryDiscussion(discussion);
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        });
        
        document.getElementById('export-history-discussion').addEventListener('click', () => {
            this.showHistoryExportOptions(discussion);
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        });
    }
    
    loadHistoryDiscussion(discussion) {
        // Reset current UI
        this.resetUI();
        
        // Populate with discussion data
        if (this.elements.projectName) {
            this.elements.projectName.value = discussion.projectName;
        }
        if (this.elements.projectDescription) {
            this.elements.projectDescription.value = discussion.projectDescription;
        }
        
        // Populate chat messages
        discussion.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.network}`;
            
            if (message.network !== 'system') {
                const senderElement = document.createElement('div');
                senderElement.className = 'sender';
                senderElement.textContent = message.sender;
                messageDiv.appendChild(senderElement);
                
                const contentElement = document.createElement('div');
                contentElement.className = 'content';
                contentElement.innerHTML = message.content;
                messageDiv.appendChild(contentElement);
            } else {
                messageDiv.textContent = message.content;
            }
            
            this.elements.chatMessages.appendChild(messageDiv);
        });
        
        // Display final output
        if (discussion.finalOutput) {
            this.displayFinalOutput(discussion.finalOutput);
        }
        
        // Add summaries to the list
        if (discussion.acceptedSummaries) {
            discussion.acceptedSummaries.forEach((summary, index) => {
                this.addSummaryToList(summary, index + 1);
            });
        }
        
        // Set framework values
        if (window.neuralFramework) {
            window.neuralFramework.projectName = discussion.projectName;
            window.neuralFramework.projectDescription = discussion.projectDescription;
            window.neuralFramework.finalOutput = discussion.finalOutput;
            if (discussion.acceptedSummaries) {
                window.neuralFramework.acceptedSummaries = [...discussion.acceptedSummaries];
            }
        }
        
        // Close history panel
        const historyPanel = document.getElementById('history-panel');
        if (historyPanel) {
            historyPanel.classList.remove('visible');
        }
        
        // Add system message about loading history
        this.addSystemMessage(`Loaded discussion "${discussion.projectName}" from history.`);
        
        // Show all buttons except start
        this.elements.resetBtn.disabled = false;
        this.elements.startBtn.disabled = true;
        this.elements.projectName.disabled = true;
        this.elements.projectDescription.disabled = true;
    }
    
    showHistoryExportOptions(discussion) {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <h3>Export Saved Discussion</h3>
                <p>Choose a format to export "${discussion.projectName}":</p>
                <div class="export-options">
                    <button class="export-option history" data-format="json">JSON Format</button>
                    <button class="export-option history" data-format="text">Plain Text</button>
                    <button class="export-option history" data-format="html">HTML Document</button>
                </div>
                <div class="modal-buttons">
                    <button id="cancel-history-export" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add some necessary styles if not already added
        if (!document.getElementById('export-style')) {
            const style = document.createElement('style');
            style.id = 'export-style';
            style.textContent = `
                .export-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .export-modal-content {
                    background-color: var(--card-bg);
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: var(--shadow);
                }
                .export-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin: 20px 0;
                }
                .export-option {
                    flex: 1;
                    min-width: 120px;
                    padding: 15px;
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .export-option:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add event listeners
        document.querySelectorAll('.export-option.history').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                this.exportHistoryDiscussion(discussion, format);
                document.body.removeChild(modal);
            });
        });
        
        document.getElementById('cancel-history-export').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    exportHistoryDiscussion(discussion, format) {
        let content, filename, type;
        
        switch(format) {
            case 'json':
                content = JSON.stringify(discussion, null, 2);
                filename = `${discussion.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.json`;
                type = 'application/json';
                break;
            case 'text':
                content = `Project: ${discussion.projectName}\n` +
                    `Description: ${discussion.projectDescription}\n\n` +
                    `Discussion:\n` +
                    discussion.messages.map(m => `${m.sender}: ${m.content.replace(/<[^>]*>/g, '')}`).join('\n\n') + 
                    `\n\nFinal Output:\n${discussion.finalOutput}`;
                filename = `${discussion.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.txt`;
                type = 'text/plain';
                break;
            case 'html':
                content = `<!DOCTYPE html>
                <html>
                <head>
                    <title>${discussion.projectName} Discussion</title>
                    <style>
                        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                        .message { margin-bottom: 20px; padding: 10px; border-radius: 10px; }
                        .network1 { background-color: #f0f9ff; }
                        .network2 { background-color: #f0fdf4; }
                        .network3 { background-color: #fff7ed; }
                        .network4 { background-color: #e6fff8; }
                        .network5 { background-color: #ffe6ee; }
                        .network6 { background-color: #e6f6ff; }
                        .network7 { background-color: #fff9e6; }
                        .network8 { background-color: #ffe6e6; }
                        .summarizer { background-color: #fffbeb; }
                        .system { background-color: #f9fafb; font-style: italic; }
                        .sender { font-weight: bold; margin-bottom: 5px; }
                        .final-output { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
                        h1, h2 { color: #6C63FF; }
                    </style>
                </head>
                <body>
                    <h1>${discussion.projectName}</h1>
                    <p>${discussion.projectDescription}</p>
                    <h2>Discussion</h2>
                    ${discussion.messages.map(m => `<div class="message ${m.network}">
                        ${m.network !== 'system' ? `<div class="sender">${m.sender}</div>
                        <div class="content">${m.content}</div>` : m.content}
                    </div>`).join('')}
                    <div class="final-output">
                        <h2>Final Output</h2>
                        ${discussion.finalOutput}
                    </div>
                </body>
                </html>`;
                filename = `${discussion.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.html`;
                type = 'text/html';
                break;
        }
        
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <h3>Export Discussion</h3>
                <p>Choose a format to export the current discussion:</p>
                <div class="export-options">
                    <button class="export-option" data-format="json">JSON Format</button>
                    <button class="export-option" data-format="text">Plain Text</button>
                    <button class="export-option" data-format="html">HTML Document</button>
                </div>
                <div class="modal-buttons">
                    <button id="cancel-export" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .export-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .export-modal-content {
                background-color: var(--card-bg);
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: var(--shadow);
            }
            .export-options {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin: 20px 0;
            }
            .export-option {
                flex: 1;
                min-width: 120px;
                padding: 15px;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            .export-option:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                if (window.neuralFramework) {
                    window.neuralFramework.exportDiscussion(format);
                }
                document.body.removeChild(modal);
                document.head.removeChild(style);
            });
        });
        
        document.getElementById('cancel-export').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }

    showWarningModal() {
        const modal = document.createElement('div');
        modal.className = 'warning-modal';
        modal.innerHTML = `
            <div class="warning-modal-content">
                <h3>⚠️ Warning: Unrestricted Mode</h3>
                <p>You have enabled Unrestricted Mode. This mode removes content filtering and safety guardrails.</p>
                <p>Please note:</p>
                <ul>
                    <li>The AI will not refuse any prompts or topics</li>
                    <li>Responses will not include safety warnings or disclaimers</li>
                    <li>This mode is intended for research and educational purposes</li>
                    <li>You assume all responsibility for content generated</li>
                </ul>
                <div class="modal-buttons">
                    <button id="acknowledge-warning" class="btn">I Understand</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .warning-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .warning-modal-content {
                background-color: var(--card-bg);
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                box-shadow: var(--shadow);
                border-top: 5px solid #ffbe0b;
            }
            .warning-modal-content h3 {
                color: #ffbe0b;
            }
            .warning-modal-content ul {
                margin-left: 20px;
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(style);
        
        document.getElementById('acknowledge-warning').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }
}
