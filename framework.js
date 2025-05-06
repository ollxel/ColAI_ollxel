import { marked } from 'marked';
import { NetworkManager } from './networkManager.js';
import { UIManager } from './uiManager.js';
import { PromptGenerator } from './promptGenerator.js';
import { FileManager } from './fileManager.js';

export class NeuralCollaborativeFramework {
    constructor() {
        this.projectName = '';
        this.projectDescription = '';
        this.summarizerInstructions = '';
        this.iterations = 0;
        this.maxIterations = 5;
        this.discussionHistory = [];
        this.acceptedSummaries = [];
        this.currentState = 'idle'; // idle, discussing, summarizing, voting
        this.finalOutput = '';
        this.discussionPaused = false;
        this.currentOperation = null; // To store the ongoing operation (Promise)
        this.useCustomIterations = false;
        this.customIterationCycles = 1;
        this.unrestrictedMode = false; // New flag for unrestricted (uncensored) mode
        
        // Initialize File Manager
        this.fileManager = new FileManager();
        
        // Initialize UI Manager with fileManager
        this.uiManager = new UIManager(this.fileManager);
        
        // Initialize Network Manager with network personas
        this.networkManager = new NetworkManager();
        
        // Initialize Prompt Generator
        this.promptGenerator = new PromptGenerator();
        
        // Only initialize event listeners if we're in collaboration mode
        if (window.location.hash !== '#mafia' && window.location.hash !== '#wiki') {
            this.initEventListeners();
            this.loadSavedDiscussions(); // Load saved discussions
        }
        
        // Set global reference to this instance
        window.neuralFramework = this;
    }
    
    initEventListeners() {
        if (this.uiManager.elements.startBtn && this.uiManager.elements.resetBtn) {
            this.uiManager.elements.startBtn.addEventListener('click', () => this.startCollaboration());
            this.uiManager.elements.resetBtn.addEventListener('click', () => this.resetProject());
            
            // Add event listener for continue discussion button
            if (this.uiManager.elements.continueDiscussionBtn) {
                this.uiManager.elements.continueDiscussionBtn.addEventListener('click', () => this.continueAfterCompletion());
            }
        }
    }
    
    startCollaboration() {
        this.projectName = this.uiManager.elements.projectName.value.trim();
        this.projectDescription = this.uiManager.elements.projectDescription.value.trim();
        this.summarizerInstructions = this.uiManager.elements.summarizerInstructions?.value.trim() || '';
        
        // Get max iterations from the input field rather than the slider
        this.maxIterations = parseInt(this.uiManager.elements.maxIterationsInput.value);
        
        // Check for custom iteration settings
        this.useCustomIterations = this.uiManager.elements.iterationType.value === 'custom';
        if (this.useCustomIterations) {
            this.customIterationCycles = parseInt(this.uiManager.elements.customIterationCycles.value) || 1;
        }
        
        // Update model settings from UI controls
        this.updateModelSettings();
        
        if (!this.projectName || !this.projectDescription) {
            this.uiManager.addSystemMessage('Please enter both a topic name and description before starting.');
            return;
        }
        
        this.uiManager.elements.projectName.disabled = true;
        this.uiManager.elements.projectDescription.disabled = true;
        this.uiManager.elements.summarizerInstructions.disabled = true;
        this.uiManager.elements.maxIterations.disabled = true;
        this.uiManager.elements.maxIterationsInput.disabled = true;
        this.uiManager.elements.startBtn.disabled = true;
        
        this.uiManager.addSystemMessage(`Topic "${this.projectName}" initiated. Starting collaborative discussion.`);
        this.startNewIteration();
    }
    
    updateModelSettings() {
        const modelSettings = {
            temperature: parseFloat(this.uiManager.elements.temperature.value) / 10,
            max_tokens: parseInt(this.uiManager.elements.maxTokens.value),
            top_p: parseFloat(this.uiManager.elements.topP.value) / 10,
            presence_penalty: parseFloat(this.uiManager.elements.presencePenalty.value) / 10,
            frequency_penalty: parseFloat(this.uiManager.elements.frequencyPenalty.value) / 10,
            system_prompt_template: this.uiManager.elements.systemPrompt.value.trim(),
            use_network1: this.uiManager.elements.useNetwork1.checked,
            use_network2: this.uiManager.elements.useNetwork2.checked,
            use_network3: this.uiManager.elements.useNetwork3.checked,
            use_network4: this.uiManager.elements.useNetwork4.checked,
            use_network5: this.uiManager.elements.useNetwork5.checked,
            use_network6: this.uiManager.elements.useNetwork6.checked,
            use_network7: this.uiManager.elements.useNetwork7.checked,
            use_network8: this.uiManager.elements.useNetwork8.checked,
            unrestricted_mode: this.unrestrictedMode // Add unrestricted mode setting
        };
        
        // Parse logit bias if provided
        if (this.uiManager.elements.logitBias.value.trim()) {
            try {
                modelSettings.logit_bias = JSON.parse(this.uiManager.elements.logitBias.value.trim());
            } catch (e) {
                console.error("Invalid logit bias JSON:", e);
                this.uiManager.addSystemMessage("Warning: Invalid logit bias JSON format. Using default settings.");
            }
        }
        
        this.networkManager.updateModelSettings(modelSettings);
        
        // Update individual network settings
        for (let i = 1; i <= 8; i++) {
            const networkId = `network${i}`;
            const networkSettings = this.uiManager.getNetworkSettings(networkId);
            this.networkManager.updateNetworkSettings(networkId, networkSettings);
        }
        
        // Update summarizer settings
        const summarizerSettings = this.uiManager.getNetworkSettings('summarizer');
        this.networkManager.updateNetworkSettings('summarizer', summarizerSettings);
    }
    
    async startNewIteration() {
        this.networkManager.clearDiscussionHistory();
        this.iterations++;
        this.uiManager.elements.iterationCounter.textContent = this.iterations;
        
        const prompt = this.promptGenerator.createIterationPrompt(this.projectName, this.projectDescription, this.iterations, this.acceptedSummaries);
        this.currentState = 'discussing';
        this.uiManager.showPauseButton();

        this.uiManager.addSystemMessage(`Starting iteration ${this.iterations}...`);
        
        // Get attachments from file manager
        const attachments = this.fileManager.getAttachments();
        
        // Check which networks are enabled
        const modelSettings = this.networkManager.modelSettings;
        const useNetwork1 = modelSettings.use_network1 !== false; // Default to true if not explicitly set to false
        const useNetwork2 = modelSettings.use_network2 !== false; // Default to true if not explicitly set to false
        
        // Start with Network 1 if enabled
        if (useNetwork1) {
            this.uiManager.updateNetworkStatus('network1');
            await this.uiManager.simulateThinking('network1', this.networkManager.networks);
            
            try {
                // Store the current operation to be able to abort it
                const network1Response = await this.networkManager.generateNetworkResponse('network1', prompt, attachments);
                
                if (this.discussionPaused) return;
                
                this.discussionHistory.push({role: 'network1', content: network1Response});
                this.uiManager.addMessageToChat('network1', this.networkManager.networks.network1.name, network1Response);
                
                // Only proceed to Network 2 if it's enabled
                if (useNetwork2) {
                    // Network 2 response
                    this.uiManager.updateNetworkStatus('network2');
                    await this.uiManager.simulateThinking('network2', this.networkManager.networks);
                    const contextForNetwork2 = `${prompt}\n\n${this.networkManager.networks.network1.name} said: ${network1Response}`;
                    const network2Response = await this.networkManager.generateNetworkResponse('network2', contextForNetwork2, attachments);
                    this.discussionHistory.push({role: 'network2', content: network2Response});
                    this.uiManager.addMessageToChat('network2', this.networkManager.networks.network2.name, network2Response);
                }
                
                // Process additional networks
                const additionalNetworks = [];
                
                // Get all network IDs except network1, network2, and summarizer
                const networkIds = this.networkManager.getNetworkIds().filter(id => 
                    id !== 'network1' && id !== 'network2' && id !== 'summarizer'
                );
                
                // Filter to only enabled networks
                for (const networkId of networkIds) {
                    const networkNum = networkId.replace('network', '');
                    
                    // Check if this network is enabled (either specifically or with the legacy naming pattern)
                    if (modelSettings[`use_${networkId}`] || modelSettings[`use_network${networkNum}`] || 
                        (this.uiManager.elements[`use${networkNum}`] && this.uiManager.elements[`use${networkNum}`].checked)) {
                        additionalNetworks.push(networkId);
                    }
                }
                
                // Process additional networks
                for (const networkId of additionalNetworks) {
                    const networkNum = networkId.replace('network', '');
                    
                    // Show network status
                    this.uiManager.toggleNetworkVisibility(parseInt(networkNum), true);
                    this.uiManager.updateNetworkStatus(networkId);
                    
                    // Get network response
                    await this.uiManager.simulateThinking(networkId, this.networkManager.networks);
                    const contextForNetwork = this.getDiscussionContext();
                    const networkResponse = await this.networkManager.generateNetworkResponse(networkId, contextForNetwork, attachments);
                    this.discussionHistory.push({role: networkId, content: networkResponse});
                    this.uiManager.addMessageToChat(networkId, this.networkManager.networks[networkId].name, networkResponse);
                }
                
                // Additional exchange rounds (can be configured)
                const exchangeRounds = this.useCustomIterations ? this.customIterationCycles : 1;
                for (let i = 0; i < exchangeRounds; i++) {
                    // Network 1 responds again if enabled
                    if (useNetwork1) {
                        this.uiManager.updateNetworkStatus('network1');
                        await this.uiManager.simulateThinking('network1', this.networkManager.networks);
                        const contextForNetwork1 = this.getDiscussionContext();
                        const network1Follow = await this.networkManager.generateNetworkResponse('network1', contextForNetwork1, attachments);
                        this.discussionHistory.push({role: 'network1', content: network1Follow});
                        this.uiManager.addMessageToChat('network1', this.networkManager.networks.network1.name, network1Follow);
                    }
                    
                    // Network 2 responds again if enabled
                    if (useNetwork2) {
                        this.uiManager.updateNetworkStatus('network2');
                        await this.uiManager.simulateThinking('network2', this.networkManager.networks);
                        const contextForNetwork2Updated = this.getDiscussionContext();
                        const network2Follow = await this.networkManager.generateNetworkResponse('network2', contextForNetwork2Updated, attachments);
                        this.discussionHistory.push({role: 'network2', content: network2Follow});
                        this.uiManager.addMessageToChat('network2', this.networkManager.networks.network2.name, network2Follow);
                    }
                    
                    // Additional networks respond again - use the same additionalNetworks array to ensure consistency
                    for (const networkId of additionalNetworks) {
                        this.uiManager.updateNetworkStatus(networkId);
                        await this.uiManager.simulateThinking(networkId, this.networkManager.networks);
                        const contextForNetworkUpdated = this.getDiscussionContext();
                        const networkFollow = await this.networkManager.generateNetworkResponse(networkId, contextForNetworkUpdated, attachments);
                        this.discussionHistory.push({role: networkId, content: networkFollow});
                        this.uiManager.addMessageToChat(networkId, this.networkManager.networks[networkId].name, networkFollow);
                    }
                }
                
                // Generate summary
                this.currentState = 'summarizing';
                this.uiManager.updateNetworkStatus('summarizer');
                await this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 2500);
                const summaryContext = this.getDiscussionContext();
                const summary = await this.networkManager.generateSummary(summaryContext, this.summarizerInstructions);
                this.uiManager.addMessageToChat('summarizer', this.networkManager.networks.summarizer.name, summary);
                
                // Vote on summary
                this.currentState = 'voting';
                
                // Get votes from each network
                this.uiManager.updateNetworkStatus('network1');
                await this.uiManager.simulateThinking('network1', this.networkManager.networks);
                const network1Vote = await this.networkManager.getVoteOnSummary('network1', summary);
                this.uiManager.addMessageToChat('network1', this.networkManager.networks.network1.name, network1Vote);
                
                this.uiManager.updateNetworkStatus('network2');
                await this.uiManager.simulateThinking('network2', this.networkManager.networks);
                const network2Vote = await this.networkManager.getVoteOnSummary('network2', summary);
                this.uiManager.addMessageToChat('network2', this.networkManager.networks.network2.name, network2Vote);
                
                // Votes from additional networks if enabled
                let additionalVotes = [];
                
                if (this.networkManager.modelSettings.use_network3) {
                    this.uiManager.updateNetworkStatus('network3');
                    await this.uiManager.simulateThinking('network3', this.networkManager.networks);
                    const network3Vote = await this.networkManager.getVoteOnSummary('network3', summary);
                    this.uiManager.addMessageToChat('network3', this.networkManager.networks.network3.name, network3Vote);
                    additionalVotes.push({network: 'network3', vote: network3Vote});
                }
                
                if (this.networkManager.modelSettings.use_network4) {
                    this.uiManager.updateNetworkStatus('network4');
                    await this.uiManager.simulateThinking('network4', this.networkManager.networks);
                    const network4Vote = await this.networkManager.getVoteOnSummary('network4', summary);
                    this.uiManager.addMessageToChat('network4', this.networkManager.networks.network4.name, network4Vote);
                    additionalVotes.push({network: 'network4', vote: network4Vote});
                }
                
                if (this.networkManager.modelSettings.use_network5) {
                    this.uiManager.updateNetworkStatus('network5');
                    await this.uiManager.simulateThinking('network5', this.networkManager.networks);
                    const network5Vote = await this.networkManager.getVoteOnSummary('network5', summary);
                    this.uiManager.addMessageToChat('network5', this.networkManager.networks.network5.name, network5Vote);
                    additionalVotes.push({network: 'network5', vote: network5Vote});
                }
                
                if (this.networkManager.modelSettings.use_network6) {
                    this.uiManager.updateNetworkStatus('network6');
                    await this.uiManager.simulateThinking('network6', this.networkManager.networks);
                    const network6Vote = await this.networkManager.getVoteOnSummary('network6', summary);
                    this.uiManager.addMessageToChat('network6', this.networkManager.networks.network6.name, network6Vote);
                    additionalVotes.push({network: 'network6', vote: network6Vote});
                }
                
                if (this.networkManager.modelSettings.use_network7) {
                    this.uiManager.updateNetworkStatus('network7');
                    await this.uiManager.simulateThinking('network7', this.networkManager.networks);
                    const network7Vote = await this.networkManager.getVoteOnSummary('network7', summary);
                    this.uiManager.addMessageToChat('network7', this.networkManager.networks.network7.name, network7Vote);
                    additionalVotes.push({network: 'network7', vote: network7Vote});
                }
                
                if (this.networkManager.modelSettings.use_network8) {
                    this.uiManager.updateNetworkStatus('network8');
                    await this.uiManager.simulateThinking('network8', this.networkManager.networks);
                    const network8Vote = await this.networkManager.getVoteOnSummary('network8', summary);
                    this.uiManager.addMessageToChat('network8', this.networkManager.networks.network8.name, network8Vote);
                    additionalVotes.push({network: 'network8', vote: network8Vote});
                }
                
                // Process voting results
                const network1Accepts = 
                    network1Vote.toLowerCase().includes('accept') || 
                    network1Vote.toLowerCase().includes('agree') ||
                    network1Vote.toLowerCase().includes('yes');
                
                const network2Accepts = 
                    network2Vote.toLowerCase().includes('accept') || 
                    network2Vote.toLowerCase().includes('agree') ||
                    network2Vote.toLowerCase().includes('yes');
                
                // Check if any of the additional networks reject the summary
                const allAdditionalAccept = additionalVotes.every(vote => {
                    const accepts = 
                        vote.vote.toLowerCase().includes('accept') || 
                        vote.vote.toLowerCase().includes('agree') ||
                        vote.vote.toLowerCase().includes('yes');
                    return accepts;
                });
                
                // Check if all networks accept the summary
                const allAccept = network1Accepts && network2Accepts && allAdditionalAccept;
                
                if (allAccept) {
                    this.acceptSummary(summary);
                    this.uiManager.addSystemMessage("Summary accepted by all networks! Moving to the next iteration.");
                    
                    // Check if we should continue with more iterations
                    if (this.iterations < this.maxIterations) {
                        setTimeout(() => this.startNewIteration(), 1500);
                    } else {
                        this.finalizeDevelopment();
                    }
                } else {
                    // Identify which networks rejected the summary
                    let rejectingNetworks = [];
                    if (!network1Accepts) rejectingNetworks.push(this.networkManager.networks.network1.name);
                    if (!network2Accepts) rejectingNetworks.push(this.networkManager.networks.network2.name);
                    
                    // Add any additional rejecting networks
                    additionalVotes.forEach(vote => {
                        const accepts = 
                            vote.vote.toLowerCase().includes('accept') || 
                            vote.vote.toLowerCase().includes('agree') ||
                            vote.vote.toLowerCase().includes('yes');
                        
                        if (!accepts) {
                            const networkName = this.networkManager.networks[vote.network].name;
                            rejectingNetworks.push(networkName);
                        }
                    });
                    
                    this.uiManager.addSystemMessage(`Summary was rejected. ${rejectingNetworks.join(', ')} disagreed. Starting a new discussion round.`);
                    setTimeout(() => this.startNewIteration(), 1500);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    // Gracefully handle abort
                    console.log("Network1 response generation aborted");
                } else {
                    console.error("Error generating network1 response:", error);
                    this.uiManager.addSystemMessage("Error occurred. Please try again.");
                }
            }
        }
    }
    
    acceptSummary(summary) {
        this.acceptedSummaries.push(summary);
        this.uiManager.addSummaryToList(summary, this.iterations);
        this.uiManager.addSystemMessage("Summary accepted! Moving to the next iteration.");
        
        // Clear discussion history for the next iteration but keep summaries
        this.discussionHistory = [];
    }
    
    async finalizeDevelopment() {
        this.currentState = 'finalizing';
        this.uiManager.addSystemMessage("All iterations complete. Generating final output...");
        
        this.uiManager.updateNetworkStatus('summarizer');
        this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 3000).then(() => {
            this.networkManager.generateFinalOutput(this.projectName, this.projectDescription, this.acceptedSummaries).then(finalOutput => {
                this.finalOutput = finalOutput;
                this.uiManager.displayFinalOutput(finalOutput);
                this.currentState = 'completed';
                this.uiManager.updateNetworkStatus(null);
                this.uiManager.addSystemMessage("Discussion process completed!");
                this.uiManager.elements.resetBtn.disabled = false;
                this.uiManager.hidePauseButton();
                
                // Save the discussion to local storage
                this.saveCurrentDiscussion();
                
                // Show continue discussion button
                if (this.uiManager.elements.continueDiscussionBtn) {
                    this.uiManager.elements.continueDiscussionBtn.style.display = 'block';
                }
            });
        });
    }
    
    resetProject() {
        // Store current settings before reset
        const currentSettings = {
            projectName: this.projectName,
            projectDescription: this.projectDescription,
            summarizerInstructions: this.summarizerInstructions,
            maxIterations: this.maxIterations,
            useCustomIterations: this.useCustomIterations,
            customIterationCycles: this.customIterationCycles,
            modelSettings: JSON.parse(JSON.stringify(this.networkManager.modelSettings)),
            networkSettings: JSON.parse(JSON.stringify(this.networkManager.networkSettings))
        };
        
        // Reset state variables
        this.projectName = '';
        this.projectDescription = '';
        this.summarizerInstructions = '';
        this.iterations = 0;
        this.discussionHistory = [];
        this.acceptedSummaries = [];
        this.currentState = 'idle';
        this.finalOutput = '';
        
        // Abort any ongoing operations
        if (this.currentOperation && this.currentOperation.abort) {
            this.currentOperation.abort();
        }
        this.currentOperation = null;
        
        // Reset UI elements via UIManager while preserving settings
        this.uiManager.resetUI();
        
        // Restore the settings that should be preserved
        if (this.uiManager.elements.projectName) {
            this.uiManager.elements.projectName.value = currentSettings.projectName;
        }
        if (this.uiManager.elements.projectDescription) {
            this.uiManager.elements.projectDescription.value = currentSettings.projectDescription;
        }
        if (this.uiManager.elements.summarizerInstructions) {
            this.uiManager.elements.summarizerInstructions.value = currentSettings.summarizerInstructions;
        }
        if (this.uiManager.elements.maxIterationsInput) {
            this.uiManager.elements.maxIterationsInput.value = currentSettings.maxIterations;
            this.uiManager.elements.maxIterations.value = Math.min(20, currentSettings.maxIterations);
            this.uiManager.elements.iterationValue.textContent = currentSettings.maxIterations <= 20 ? 
                currentSettings.maxIterations : `${currentSettings.maxIterations} (custom)`;
        }
        if (this.uiManager.elements.iterationType) {
            this.uiManager.elements.iterationType.value = currentSettings.useCustomIterations ? 'custom' : 'auto';
            this.uiManager.elements.customIterationContainer.style.display = 
                currentSettings.useCustomIterations ? 'block' : 'none';
        }
        if (this.uiManager.elements.customIterationCycles) {
            this.uiManager.elements.customIterationCycles.value = currentSettings.customIterationCycles;
        }
        
        // Restore model settings
        this.networkManager.updateModelSettings(currentSettings.modelSettings);
        
        // Restore individual network settings
        for (const networkId in currentSettings.networkSettings) {
            this.networkManager.updateNetworkSettings(networkId, currentSettings.networkSettings[networkId]);
        }
        
        // Hide the continue discussion button
        if (this.uiManager.elements.continueDiscussionBtn) {
            this.uiManager.elements.continueDiscussionBtn.style.display = 'none';
        }
        
        this.uiManager.addSystemMessage("Topic reset. Ready to start a new collaboration.");
    }
    
    pauseDiscussion() {
        this.discussionPaused = true;
        if (this.currentOperation && this.currentOperation.abort) {
            this.currentOperation.abort();
        }
        this.uiManager.showUserPromptArea();
    }
    
    resumeDiscussion(userPrompt = null) {
        this.discussionPaused = false;
        this.uiManager.hideUserPromptArea();
        
        if (userPrompt) {
            // Add user prompt to the discussion
            this.uiManager.addMessageToChat('user', 'User', userPrompt);
            this.discussionHistory.push({role: 'user', content: userPrompt});
            
            // Continue with the current phase
            this.continueFromUserPrompt(userPrompt);
        } else {
            // Just continue from where we left off
            this.continueFromCurrentState();
        }
    }
    
    continueFromUserPrompt(userPrompt) {
        // Resume based on current state with user prompt
        if (this.currentState === 'discussing') {
            this.continueDiscussionWithUserPrompt(userPrompt);
        } else if (this.currentState === 'summarizing') {
            this.summarizeWithUserPrompt(userPrompt);
        } else if (this.currentState === 'voting') {
            this.continueVotingWithUserPrompt(userPrompt);
        }
    }
    
    continueFromCurrentState() {
        // Resume from current state without modifying the flow
        if (this.currentState === 'discussing') {
            this.continueDiscussion();
        } else if (this.currentState === 'summarizing') {
            this.continueSummarizing();
        } else if (this.currentState === 'voting') {
            this.continueVoting();
        }
    }
    
    async continueDiscussionWithUserPrompt(userPrompt) {
        // Continue discussion with user prompt
        const context = this.getDiscussionContext() + `\nUser's additional instructions: ${userPrompt}\n`;
        
        // Determine which network to respond next
        const lastNetworkIndex = this.findLastNetworkIndex();
        const nextNetworkId = this.getNextNetworkId(lastNetworkIndex);
        
        this.uiManager.updateNetworkStatus(nextNetworkId);
        await this.uiManager.simulateThinking(nextNetworkId, this.networkManager.networks);
        
        // Get attachments
        const attachments = this.fileManager.getAttachments();
        
        try {
            const response = await this.networkManager.generateNetworkResponse(nextNetworkId, context, attachments);
            this.discussionHistory.push({role: nextNetworkId, content: response});
            this.uiManager.addMessageToChat(nextNetworkId, this.networkManager.networks[nextNetworkId].name, response);
            
            // Continue with normal flow
            this.continueDiscussion(lastNetworkIndex + 1);
        } catch (error) {
            console.error("Error continuing discussion:", error);
            this.uiManager.addSystemMessage("Error occurred while continuing discussion. Please try again.");
        }
    }
    
    findLastNetworkIndex() {
        if (this.discussionHistory.length === 0) return -1;
        
        // Exclude user messages
        const networkMessages = this.discussionHistory.filter(msg => msg.role !== 'user');
        if (networkMessages.length === 0) return -1;
        
        const lastMessage = networkMessages[networkMessages.length - 1];
        const networkIds = this.networkManager.getNetworkIds();
        
        return networkIds.indexOf(lastMessage.role);
    }
    
    getNextNetworkId(previousIndex) {
        const networkIds = this.networkManager.getNetworkIds();
        const enabledNetworks = networkIds.filter(id => {
            const networkNum = id.replace('network', '');
            // Check if this network is enabled
            return (networkNum <= 2) || 
                   (this.networkManager.modelSettings[`use_${id}`] || 
                    this.networkManager.modelSettings[`use_network${networkNum}`] || 
                    (this.uiManager.elements[`use${networkNum}`] && 
                     this.uiManager.elements[`use${networkNum}`].checked));
        });
        
        if (enabledNetworks.length === 0) return 'network1';
        
        const nextIndex = (previousIndex + 1) % enabledNetworks.length;
        return enabledNetworks[nextIndex];
    }
    
    async summarizeWithUserPrompt(userPrompt) {
        // Handle summarization with user input
        this.uiManager.updateNetworkStatus('summarizer');
        await this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 2000);
        
        // Get the context with user prompt included
        const summaryContext = this.getDiscussionContext() + `\nUser's additional guidance for summarization: ${userPrompt}\n`;
        
        // Generate a summary with the user's additional guidance
        const summary = await this.networkManager.generateSummary(summaryContext, userPrompt);
        this.uiManager.addMessageToChat('summarizer', this.networkManager.networks.summarizer.name, summary);
        
        // Continue with voting phase
        this.currentState = 'voting';
        this.continueVoting();
    }
    
    async continueSummarizing() {
        // Continue with standard summarization process
        this.uiManager.updateNetworkStatus('summarizer');
        await this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 2000);
        const summaryContext = this.getDiscussionContext();
        const summary = await this.networkManager.generateSummary(summaryContext, this.summarizerInstructions);
        this.uiManager.addMessageToChat('summarizer', this.networkManager.networks.summarizer.name, summary);
        
        // Continue with voting phase
        this.currentState = 'voting';
        this.continueVoting();
    }
    
    async continueVotingWithUserPrompt(userPrompt) {
        // Implement voting continuation with user prompt
        this.uiManager.updateNetworkStatus('network1');
        await this.uiManager.simulateThinking('network1', this.networkManager.networks);
        
        // Get the most recent summary from messages
        const messages = Array.from(this.uiManager.elements.chatMessages.querySelectorAll('.message.summarizer'));
        let summary = '';
        if (messages.length > 0) {
            const lastSummaryElement = messages[messages.length - 1];
            const contentElement = lastSummaryElement.querySelector('.content');
            if (contentElement) {
                summary = contentElement.innerText;
            }
        }
        
        if (!summary) {
            // If no summary found, create one with user input
            this.uiManager.updateNetworkStatus('summarizer');
            await this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 1500);
            summary = `Summary incorporating user feedback: ${userPrompt}`;
            this.uiManager.addMessageToChat('summarizer', this.networkManager.networks.summarizer.name, summary);
        }
        
        // Continue with voting
        this.continueVoting(summary);
    }
    
    async continueVoting(summary = null) {
        // If no summary is provided, try to find the most recent one
        if (!summary) {
            const messages = Array.from(this.uiManager.elements.chatMessages.querySelectorAll('.message.summarizer'));
            if (messages.length > 0) {
                const lastSummaryElement = messages[messages.length - 1];
                const contentElement = lastSummaryElement.querySelector('.content');
                if (contentElement) {
                    summary = contentElement.innerText;
                }
            }
            
            if (!summary) {
                // If still no summary, create a generic one
                summary = "Summary of the discussion so far.";
            }
        }
        
        // Implement voting logic
        this.uiManager.updateNetworkStatus('network1');
        await this.uiManager.simulateThinking('network1', this.networkManager.networks);
        const network1Vote = await this.networkManager.getVoteOnSummary('network1', summary);
        this.uiManager.addMessageToChat('network1', this.networkManager.networks.network1.name, network1Vote);
        
        this.uiManager.updateNetworkStatus('network2');
        await this.uiManager.simulateThinking('network2', this.networkManager.networks);
        const network2Vote = await this.networkManager.getVoteOnSummary('network2', summary);
        this.uiManager.addMessageToChat('network2', this.networkManager.networks.network2.name, network2Vote);
        
        // Continue with rest of voting process...
        // Process voting results and move to next iteration as needed
        // This would typically call relevant parts of the startNewIteration method
    }
    
    getDiscussionContext() {
        let context = `Topic Name: ${this.projectName}\nTopic Description: ${this.projectDescription}\n\n`;
        
        if (this.acceptedSummaries.length > 0) {
            context += "Accepted Summaries:\n";
            this.acceptedSummaries.forEach((summary, index) => {
                context += `Summary ${index + 1}: ${summary}\n\n`;
            });
        }
        
        context += "Current Discussion:\n";
        this.discussionHistory.forEach(entry => {
            const networkName = entry.role === 'network1' ? this.networkManager.networks.network1.name : 
                               (entry.role === 'network2' ? this.networkManager.networks.network2.name : 
                               (entry.role === 'network3' ? this.networkManager.networks.network3.name : 
                               (entry.role === 'network4' ? this.networkManager.networks.network4.name : 
                               (entry.role === 'network5' ? this.networkManager.networks.network5.name : 
                               (entry.role === 'network6' ? this.networkManager.networks.network6.name : 
                               (entry.role === 'network7' ? this.networkManager.networks.network7.name : 
                               (entry.role === 'network8' ? this.networkManager.networks.network8.name : 'Synthesizer')))))));
            context += `${networkName}: ${entry.content}\n\n`;
        });
        
        return context;
    }
    
    continueAfterCompletion() {
        // Hide the continue button
        if (this.uiManager.elements.continueDiscussionBtn) {
            this.uiManager.elements.continueDiscussionBtn.style.display = 'none';
        }
        
        // Add a system message indicating continuation
        this.uiManager.addSystemMessage("Continuing the discussion beyond the planned iterations...");
        
        // Reset state but maintain history
        this.currentState = 'discussing';
        
        // Start a special continuation iteration
        this.startContinuationIteration();
    }
    
    async startContinuationIteration() {
        // Create a special prompt for continuation
        const prompt = `Topic Name: ${this.projectName}\nTopic Description: ${this.projectDescription}\n\n` +
                      `This is a continuation of our previous discussion. We have completed ${this.iterations} iterations ` +
                      `and generated a final output, but we're continuing to explore this topic further. ` +
                      `Please build upon our previous conclusions and explore any aspects that merit further discussion.`;
        
        this.uiManager.showPauseButton();
        
        // Get attachments from file manager
        const attachments = this.fileManager.getAttachments();
        
        // Start with Network 1
        this.uiManager.updateNetworkStatus('network1');
        await this.uiManager.simulateThinking('network1', this.networkManager.networks);
        
        try {
            const network1Response = await this.networkManager.generateNetworkResponse('network1', prompt, attachments);
            
            if (this.discussionPaused) return;
            
            this.discussionHistory.push({role: 'network1', content: network1Response});
            this.uiManager.addMessageToChat('network1', this.networkManager.networks.network1.name, network1Response);
            
            // Continue the exchange with other networks
            // ... similar to startNewIteration() ...
            
            // No need for summarization or voting in continuation mode
            // Just keep the discussion going with multiple exchanges
            
            // Add a "continue further" option after this round
            this.uiManager.addSystemMessage("This continuation round is complete. You can reset or continue further.");
            if (this.uiManager.elements.continueDiscussionBtn) {
                this.uiManager.elements.continueDiscussionBtn.style.display = 'block';
            }
        } catch (error) {
            console.error("Error in continuation:", error);
            this.uiManager.addSystemMessage("Error occurred during continuation. Please try again.");
        }
    }
    
    saveCurrentDiscussion() {
        if (!this.projectName) return;
        
        const discussionData = {
            id: Date.now().toString(),
            projectName: this.projectName,
            projectDescription: this.projectDescription,
            acceptedSummaries: this.acceptedSummaries,
            finalOutput: this.finalOutput,
            timestamp: new Date().toISOString(),
            messages: Array.from(document.querySelectorAll('.message')).map(el => {
                // Get sender and content
                const sender = el.querySelector('.sender')?.textContent || 'System';
                const content = el.querySelector('.content')?.innerHTML || el.textContent;
                const network = Array.from(el.classList).find(c => c.startsWith('network')) || 'system';
                
                return { sender, content, network };
            })
        };
        
        // Get existing saved discussions
        const savedDiscussions = JSON.parse(localStorage.getItem('savedDiscussions') || '[]');
        
        // Add new discussion
        savedDiscussions.push(discussionData);
        
        // Save back to localStorage (limited to last 20 discussions)
        localStorage.setItem('savedDiscussions', JSON.stringify(savedDiscussions.slice(-20)));
    }
    
    loadSavedDiscussions() {
        const savedDiscussions = JSON.parse(localStorage.getItem('savedDiscussions') || '[]');
        if (savedDiscussions.length > 0) {
            this.uiManager.createHistoryUI(savedDiscussions);
        }
    }
    
    exportDiscussion(format = 'json') {
        if (!this.projectName) {
            this.uiManager.showErrorMessage('No discussion to export');
            return;
        }
        
        // Gather all discussion data
        const messages = Array.from(document.querySelectorAll('.message')).map(el => {
            const sender = el.querySelector('.sender')?.textContent || 'System';
            const content = el.querySelector('.content')?.innerHTML || el.textContent;
            const network = Array.from(el.classList).find(c => c.startsWith('network')) || 'system';
            
            return { sender, content, network };
        });
        
        const discussionData = {
            projectName: this.projectName,
            projectDescription: this.projectDescription,
            acceptedSummaries: this.acceptedSummaries,
            finalOutput: this.finalOutput,
            messages: messages,
            exportedAt: new Date().toISOString()
        };
        
        let content, filename, type;
        
        switch(format) {
            case 'json':
                content = JSON.stringify(discussionData, null, 2);
                filename = `${this.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.json`;
                type = 'application/json';
                break;
            case 'text':
                content = `Project: ${this.projectName}\n` +
                    `Description: ${this.projectDescription}\n\n` +
                    `Discussion:\n` +
                    messages.map(m => `${m.sender}: ${m.content.replace(/<[^>]*>/g, '')}`).join('\n\n') + 
                    `\n\nFinal Output:\n${this.finalOutput}`;
                filename = `${this.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.txt`;
                type = 'text/plain';
                break;
            case 'html':
                content = `<!DOCTYPE html>
                <html>
                <head>
                    <title>${this.projectName} Discussion</title>
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
                    <h1>${this.projectName}</h1>
                    <p>${this.projectDescription}</p>
                    <h2>Discussion</h2>
                    ${messages.map(m => `<div class="message ${m.network}">
                        <div class="sender">${m.sender}</div>
                        <div class="content">${m.content}</div>
                    </div>`).join('')}
                    <div class="final-output">
                        <h2>Final Output</h2>
                        ${this.finalOutput}
                    </div>
                </body>
                </html>`;
                filename = `${this.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_discussion.html`;
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
    
    toggleUnrestrictedMode(enabled) {
        this.unrestrictedMode = enabled;
        this.updateModelSettings();
    }

    async summarizeWithUserPrompt(userPrompt) {
        // Handle summarization with user input
        this.uiManager.updateNetworkStatus('summarizer');
        await this.uiManager.simulateThinking('summarizer', this.networkManager.networks, 2000);
        
        // Get the context with user prompt included
        const summaryContext = this.getDiscussionContext() + `\nUser's additional guidance for summarization: ${userPrompt}\n`;
        
        // Generate a summary with the user's additional guidance
        const summary = await this.networkManager.generateSummary(summaryContext, userPrompt);
        this.uiManager.addMessageToChat('summarizer', this.networkManager.networks.summarizer.name, summary);
        
        // Continue with voting phase
        this.currentState = 'voting';
        this.continueVoting();
    }
}