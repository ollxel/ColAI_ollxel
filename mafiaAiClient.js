export class MafiaAiClient {
    constructor() {
        // Initialize with default model settings
        this.modelSettings = {
            temperature: 0.7,
            max_tokens: 300,
            top_p: 1.0,
            presence_penalty: 0.0,
            frequency_penalty: 0.0
        };
        this.retryCount = 0;
        this.maxRetries = 2;
    }
    
    updateSettings(settings) {
        this.modelSettings = {
            ...this.modelSettings,
            ...settings
        };
    }
    
    async getChatCompletion(prompt, temperature = null, language = 'en') {
        try {
            this.retryCount = 0;
            return await this._attemptChatCompletion(prompt, temperature, language);
        } catch (error) {
            console.error("Error in MafiaAiClient.getChatCompletion:", error);
            // Return more varied fallback messages instead of the same generic one
            const fallbackMessages = language === 'ru' ? [
                "Мне нужно больше времени, чтобы сформулировать свои мысли.",
                "Я внимательно наблюдаю за происходящим, но пока воздержусь от комментариев.",
                "Интересная ситуация складывается, продолжаю наблюдать.",
                "Нужно тщательно всё обдумать, прежде чем высказываться.",
                "Сложно сразу определить, кто здесь может быть мафией."
            ] : [
                "I need more time to formulate my thoughts.",
                "I'm carefully observing what's happening, but will withhold comments for now.",
                "The situation is developing interestingly. I'm continuing to observe.",
                "I need to think carefully before speaking.",
                "It's difficult to immediately determine who might be mafia here."
            ];
            return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
        }
    }
    
    async _attemptChatCompletion(prompt, temperature = null, language = 'en') {
        try {
            const systemPrompt = language === 'ru'
                ? "Вы играете за персонажа в игре Мафия. Отвечайте как ваш персонаж, основываясь на информации об игре. Держите свою роль в секрете, если вы член мафии. Никогда прямо не указывайте свою роль. Отвечайте содержательно и вдумчиво, избегая шаблонных и общих ответов."
                : "You are playing a character in a Mafia game. Respond as your character would, based on the game information. Keep your role secret if you are a mafia member. Never directly state your role. Give thoughtful and meaningful responses, avoiding generic answers.";
                
            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ];
            
            // Use provided temperature or default
            const tempToUse = temperature !== null ? temperature : this.modelSettings.temperature;
            
            const completion = await websim.chat.completions.create({
                messages: messages,
                temperature: tempToUse,
                max_tokens: this.modelSettings.max_tokens,
                top_p: this.modelSettings.top_p,
                presence_penalty: this.modelSettings.presence_penalty,
                frequency_penalty: this.modelSettings.frequency_penalty
            });
            
            return completion.content;
        } catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this._attemptChatCompletion(prompt, temperature, language);
            }
            throw error;
        }
    }
}