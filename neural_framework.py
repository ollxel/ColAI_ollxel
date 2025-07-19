import requests
import json
import time
import random
import re
import asyncio
import traceback # Для вывода ошибок

# --- Configuration ---
OLLAMA_BASE_URL = "http://localhost:11434"  # Default Ollama API URL
DEFAULT_MODEL = "hf.co/roleplaiapp/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M-GGUF:latest" # Default model if user doesn't specify

# --- Ollama Client ---
class OllamaClient:
    """Handles communication with the Ollama API."""
    def __init__(self, base_url=OLLAMA_BASE_URL):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/chat"
        self._check_ollama_connection()

    def _check_ollama_connection(self):
        """Checks if Ollama is running."""
        try:
            response = requests.get(self.base_url)
            response.raise_for_status()
            print("Successfully connected to Ollama.")
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Ollama at {self.base_url}: {e}")
            print("Please ensure Ollama is running.")
            exit(1)

    def get_chat_completion(self, model_name, messages, temperature=0.7, max_tokens=500, top_p=1.0, **kwargs):
        """Gets a chat completion from a specified Ollama model."""
        if not messages:
            print(f"ERROR: No valid messages to send for model {model_name}.")
            return "Error: No content to send."

        payload = {
            "model": model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": float(temperature),
                "num_predict": int(max_tokens),
                "top_p": float(top_p),
            }
        }
        payload["options"].update(kwargs)

        # --- ИЗМЕНЕНИЕ: Отладочная печать payload и других деталей отключена ---
        # print(f"\n--- Sending Payload to Ollama ({model_name}) ---")
        # try:
        #     print(json.dumps(payload, indent=2, ensure_ascii=False))
        # except Exception as e:
        #     print(f"Error printing payload: {e}\nPayload content (raw): {payload}")
        # print("--- End Payload ---")

        try:
            response = requests.post(self.api_url, json=payload)
            response.raise_for_status()
            response_data = response.json()

            if 'message' in response_data and isinstance(response_data['message'], dict) and 'content' in response_data['message']:
                return response_data['message']['content'].strip()
            elif 'error' in response_data:
                error_msg = response_data['error']
                print(f"Ollama API Error for model {model_name}: {error_msg}")
                return f"Error from Ollama: {error_msg}"
            else:
                print(f"Unexpected Ollama response structure for model {model_name}: {response_data}")
                if 'response' in response_data and isinstance(response_data['response'], str):
                     return response_data['response'].strip()
                return "Error: Unexpected response structure from Ollama."

        except requests.exceptions.RequestException as e:
            error_details = str(e)
            if e.response is not None:
                 try: error_details += f" | Response: {e.response.text}"
                 except Exception: pass
            print(f"Error communicating with Ollama API for model {model_name}: {error_details}")
            return f"Error: Could not reach Ollama ({error_details})"
        except json.JSONDecodeError as e:
            raw_text = response.text if 'response' in locals() and hasattr(response, 'text') else "N/A"
            print(f"Error decoding Ollama response for model {model_name}: {e}. Raw response: {raw_text}")
            return "Error: Could not decode Ollama response."
        except Exception as e:
             print(f"An unexpected error occurred in get_chat_completion for {model_name}: {e}")
             traceback.print_exc()
             return f"Error: An unexpected error occurred ({e})"

# --- Collaboration Mode ---
class NetworkManager:
    """Manages AI networks/personas for collaboration mode."""
    def __init__(self, ollama_client, model_name=DEFAULT_MODEL):
        self.ollama_client = ollama_client
        self.model_name = model_name
        self.networks = {
            'network1': { 'name': 'Analytical Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You are an analytical thinker. Focus on logic, structure, and evidence.' },
            'network2': { 'name': 'Creative Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You are a creative thinker. Focus on novel ideas, alternatives, and possibilities.' },
            'network3': { 'name': 'Implementation Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!!You focus on practical implementation, technical feasibility, and resources.' },
            'network4': { 'name': 'Data Science Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!!You focus on data, statistics, patterns, and empirical evidence.' },
            'network5': { 'name': 'Ethical Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!!You focus on ethical implications, societal impact, fairness, and transparency.' },
            'network6': { 'name': 'User Experience Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You focus on user-centered design, accessibility, and usability.' },
            'network7': { 'name': 'Systems Thinking Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You focus on holistic views, interconnections, feedback loops, and emergence.' },
            'network8': { 'name': 'Devil\'s Advocate Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You critically challenge assumptions, identify weaknesses, and stress-test ideas.' },
            'summarizer': { 'name': 'Synthesizer Network', 'persona': 'ПИШИ НА РУССКОМ ЯЗЫКЕ ВСЕГДА!! You synthesize discussions, find consensus, and summarize key points accurately.' }
        }
        self.model_settings = {'temperature': 0.7, 'max_tokens': 1000, 'top_p': 1.0}
        self.active_networks = ['network1', 'network2']
        self.discussion_history = []
        self.user_system_prompts = {}

    def set_active_networks(self, network_ids):
        """Устанавливает активные сети для обсуждения."""
        self.active_networks = [nid for nid in network_ids if nid in self.networks and nid != 'summarizer']
        if not self.active_networks:
            self.active_networks = ['network1']
        active_names = [self.networks[nid]['name'] for nid in self.active_networks]
        print(f"Active networks for discussion: {active_names}")

    def update_model_settings(self, settings):
        """Обновляет общие настройки модели."""
        self.model_settings.update(settings)
        print(f"Updated model settings: {self.model_settings}")

    def set_user_system_prompt(self, network_id, prompt):
        """Устанавливает пользовательский системный промпт."""
        if network_id in self.networks:
            self.user_system_prompts[network_id] = prompt.strip()
            print(f"Set custom system prompt for {self.networks[network_id]['name']}")

    def _create_full_prompt(self, network_id, context_prompt, is_summary=False, summary_instructions=""):
        """Создает полный текст для 'user' сообщения, включая инструкции и историю."""
        network_info = self.networks[network_id]
        user_sys_prompt = self.user_system_prompts.get(network_id)

        if user_sys_prompt:
            instructions = user_sys_prompt
        else:
            instructions = network_info['persona']
            if network_id == 'summarizer':
                instructions += ("\nReview the discussion context and summaries provided below. "
                                 "Your task is to create a concise summary (around 150 words) of the key points, agreements, and progress.")
                if summary_instructions:
                    instructions += f"\nFollow these specific instructions: {summary_instructions}"
            else:
                instructions += ("\nYou are participating in a collaborative discussion. Respond thoughtfully based on your persona. "
                                 "Focus on the topic and the previous messages.")

        instructions += "\nIMPORTANT: Respond with plain text only. Do NOT wrap your answer in markdown code blocks (like ```text ... ```) unless specifically asked for code."
        full_prompt_text = f"{instructions}\n\n--- Task Context ---\n{context_prompt}\n\n"

        if self.discussion_history:
            full_prompt_text += "--- Recent Discussion ---\n"
            history_limit = 10
            start_index = max(0, len(self.discussion_history) - history_limit)
            for entry in self.discussion_history[start_index:]:
                if entry['role'] == network_id:
                    continue
                network_name = self.networks.get(entry['role'], {'name': entry['role'].capitalize()})['name']
                escaped_content = entry['content'].replace('"', '\\"')
                full_prompt_text += f"{network_name}: \"{escaped_content}\"\n\n"
            full_prompt_text += "---\n\n"

        if is_summary:
            full_prompt_text += f"Now, {network_info['name']}, please generate the summary based on the discussion above."
        else:
            last_speaker_text = ""
            if self.discussion_history and self.discussion_history[-1]['role'] != network_id:
                last_entry = self.discussion_history[-1]
                last_speaker = self.networks.get(last_entry['role'], {'name': 'Previous'})['name']
                escaped_content = last_entry['content'].replace('"', '\\"')
                last_speaker_text = f"{last_speaker} just said:\n\"{escaped_content}\"\n\n"
            full_prompt_text += f"{last_speaker_text}Now it's your turn, {network_info['name']}. What are your thoughts?"

        return full_prompt_text.strip()

    async def generate_network_response(self, network_id, context_prompt):
        """Генерирует ответ от конкретной сети."""
        full_user_prompt = self._create_full_prompt(network_id, context_prompt)
        messages = [{"role": "user", "content": full_user_prompt}]

        response = self.ollama_client.get_chat_completion(
            self.model_name, messages, **self.model_settings
        )

        # --- ИЗМЕНЕНИЕ: Вывод сделан чистым и лаконичным ---
        network_name = self.networks[network_id]['name']
        print(f"\n{network_name}:\n{response}")

        if response is not None and not response.lower().startswith("error:"):
            self.discussion_history.append({'role': network_id, 'content': response})
        else:
            print(f"--- {network_name} encountered an error or returned no content. ---")

        return response

    async def generate_summary(self, context_prompt, custom_instructions=""):
        """Генерирует саммари обсуждения."""
        network_id = 'summarizer'
        full_user_prompt = self._create_full_prompt(network_id, context_prompt, is_summary=True, summary_instructions=custom_instructions)
        messages = [{"role": "user", "content": full_user_prompt}]

        response = self.ollama_client.get_chat_completion(
            self.model_name, messages, **self.model_settings
        )

        # --- ИЗМЕНЕНИЕ: Вывод сделан чистым и лаконичным ---
        network_name = self.networks[network_id]['name']
        print(f"\n--- {network_name} (Summary) ---\n{response}")
        return response

    async def get_vote_on_summary(self, network_id, summary, context_prompt):
        """Получает голос (Accept/Reject) от сети по поводу саммари."""
        network_info = self.networks[network_id]
        user_sys_prompt = self.user_system_prompts.get(network_id)

        if user_sys_prompt: instructions = user_sys_prompt
        else: instructions = network_info['persona']
        instructions += ("\nYou are participating in a vote. Review the proposed summary and the discussion context.")
        instructions += "\nIMPORTANT: Respond ONLY with 'Accept' or 'Reject'. If rejecting, you MAY add a very brief reason after the word 'Reject'."
        instructions += "\nDo NOT wrap your answer in markdown code blocks."

        vote_context = (f"--- Task Context ---\n{context_prompt}\n\n"
                        f"--- Proposed Summary ---\n\"{summary}\"\n\n"
                        f"--- Recent Discussion ---\n")
        history_limit = 10
        start_index = max(0, len(self.discussion_history) - history_limit)
        for entry in self.discussion_history[start_index:]:
            if entry['role'] == network_id: continue
            network_name = self.networks.get(entry['role'], {'name': entry['role'].capitalize()})['name']
            escaped_content = entry['content'].replace('"', '\\"')
            vote_context += f"{network_name}: \"{escaped_content}\"\n\n"
        vote_context += "---\n\n"

        vote_request = f"Now, {network_info['name']}, based on your understanding and persona, do you accept this summary? Respond ONLY 'Accept' or 'Reject' (with optional brief reason)."
        full_user_prompt = f"{instructions}\n\n{vote_context}{vote_request}"
        messages = [{"role": "user", "content": full_user_prompt}]

        response = self.ollama_client.get_chat_completion(
            self.model_name, messages, temperature=0.1, max_tokens=60
        )

        # --- ИЗМЕНЕНИЕ: Отладочный вывод голосов отключен для чистоты ---
        # print(f"{self.networks[network_id]['name']} (Vote Raw): {repr(response)}")
        # print(f"{self.networks[network_id]['name']} (Vote Formatted): {response}")

        response_lower = response.lower().strip()
        if response_lower.startswith("accept"):
            return True, response
        elif response_lower.startswith("reject"):
            return False, response
        else:
            print(f"WARN: Unclear vote from {network_id}. Interpreting as Reject.")
            return False, f"Reject (Unclear response: {response})"

    async def generate_final_output(self, topic_name, topic_description, accepted_summaries):
        """Генерирует финальный отчет на основе принятых саммари."""
        print("\n--- Generating Final Output ---")
        context = f"Topic: {topic_name}\nDescription: {topic_description}\n\n--- Accepted Summaries from All Iterations ---\n"
        if not accepted_summaries:
            context += "(No summaries were accepted during the discussion.)\n"
        else:
            for i, summary in enumerate(accepted_summaries):
                context += f"--- Iteration {i+1} Summary ---\n{summary}\n---\n"

        system_like_instructions = ("You are a final report generator. Based on the topic, description, and the "
                                    "sequence of accepted summaries from a multi-agent discussion, create a comprehensive "
                                    "final output document. Structure it logically (e.g., Introduction, Key Findings/Points, Conclusion). "
                                    "Synthesize the information effectively and coherently. Respond in plain text without code blocks.")
        full_user_prompt = f"{system_like_instructions}\n\n{context}"
        messages = [{"role": "user", "content": full_user_prompt}]

        response = self.ollama_client.get_chat_completion(
            self.model_name, messages, temperature=0.5, max_tokens=2000
        )

        print(f"\n{response}")
        print("--- END FINAL OUTPUT ---")
        return response

    def clear_history(self):
        """Очищает историю диалога."""
        self.discussion_history = []


async def run_collaboration_mode(ollama_client):
    """Запускает режим коллаборации."""
    print("\n--- Collaboration Mode ---")

    topic_name = input("Enter the topic name: ").strip()
    topic_description = input("Enter a brief description of the topic: ").strip()
    try: max_iterations = int(input("Enter max discussion iterations (e.g., 3): ") or 3)
    except ValueError: max_iterations = 3; print("Invalid input, using 3.")

    model_name = input(f"Enter Ollama model name (e.g., llama3, default: {DEFAULT_MODEL}): ").strip() or DEFAULT_MODEL

    try: temperature = float(input("Enter temperature (0.0-1.0, default: 0.7): ") or 0.7)
    except ValueError: temperature = 0.7
    try: max_tokens = int(input("Enter max tokens per response (default: 1000): ") or 1000)
    except ValueError: max_tokens = 1000

    print("\nAvailable Networks for Discussion:")
    temp_mgr = NetworkManager(ollama_client, model_name)
    available_discuss_nets = {i+1: net_id for i, net_id in enumerate(n for n in temp_mgr.networks if n != 'summarizer')}
    for num, net_id in available_discuss_nets.items(): print(f"{num}. {temp_mgr.networks[net_id]['name']}")
    selected_indices_str = input(f"Enter numbers of networks (comma-separated, min 1, default: 1,2): ").strip()
    active_networks_ids = ['network1', 'network2']
    if selected_indices_str:
        try:
            selected_indices = [int(x.strip()) for x in selected_indices_str.split(',') if x.strip()]
            valid_selected = [available_discuss_nets[i] for i in selected_indices if i in available_discuss_nets]
            if valid_selected: active_networks_ids = valid_selected
            else: print("No valid networks selected. Using defaults.")
        except (ValueError, KeyError): print("Invalid network selection format. Using defaults.")

    network_manager = NetworkManager(ollama_client, model_name)
    network_manager.update_model_settings({'temperature': temperature, 'max_tokens': max_tokens})
    network_manager.set_active_networks(active_networks_ids)

    use_custom_prompts = input("\nSet custom system prompts for networks & summarizer? (yes/no, default: no): ").lower().strip()
    if use_custom_prompts == 'yes':
        networks_to_prompt = network_manager.active_networks + ['summarizer']
        for net_id in networks_to_prompt:
            default_persona = network_manager.networks[net_id]['persona']
            print(f"\n--- Setting System Prompt for: {network_manager.networks[net_id]['name']} ---")
            print(f"(Default Persona Hint: {default_persona[:100]}...)")
            print("Enter custom system prompt (press Enter twice to finish):")
            lines = []
            while True:
                try:
                    line = input()
                    if line == "": break
                    lines.append(line)
                except EOFError: break
            custom_prompt = "\n".join(lines).strip()
            if custom_prompt:
                network_manager.set_user_system_prompt(net_id, custom_prompt)
            else:
                print("(Using default persona)")

    accepted_summaries = []
    current_iteration = 0
    base_prompt_context = f"Topic: {topic_name}\nDescription: {topic_description}"

    while current_iteration < max_iterations:
        current_iteration += 1
        network_manager.clear_history()
        print(f"\n--- Starting Iteration {current_iteration}/{max_iterations} ---")

        iteration_context = f"{base_prompt_context}\n\nIteration {current_iteration}."
        if accepted_summaries:
            iteration_context += "\n\n--- Previous Accepted Summaries ---\n"
            for i, s in enumerate(accepted_summaries):
                iteration_context += f"Summary {i+1}:\n{s}\n---\n"
            iteration_context += "\n"

        discussion_rounds = 2
        for r_num in range(discussion_rounds):
            print(f"\n-- Discussion Round {r_num + 1}/{discussion_rounds} --")
            current_round_order = network_manager.active_networks[:]
            random.shuffle(current_round_order)
            for network_id in current_round_order:
                await network_manager.generate_network_response(network_id, iteration_context)
                await asyncio.sleep(0.5)

        summary = await network_manager.generate_summary(iteration_context)
        await asyncio.sleep(0.5)

        if not summary or summary.lower().startswith("error:"):
             print("WARN: Summarizer failed to generate a valid summary. Skipping voting.")
             if current_iteration < max_iterations: input("\nPress Enter to continue to the next iteration...")
             continue

        votes_accept, votes_reject = 0, 0
        rejection_reasons = []
        print("\n-- Voting on Summary --")
        for network_id in network_manager.active_networks:
            accepts, reason = await network_manager.get_vote_on_summary(network_id, summary, iteration_context)
            if accepts:
                votes_accept += 1
            else:
                votes_reject += 1
                rejection_reasons.append(f"{network_manager.networks[network_id]['name']}: {reason}")
            await asyncio.sleep(0.5)

        print(f"\n--- Iteration {current_iteration} Voting Results ---")
        needed_for_accept = len(network_manager.active_networks)
        print(f"Accept: {votes_accept}, Reject: {votes_reject} (Needed: {needed_for_accept} accepts)")
        if votes_reject == 0 and votes_accept == needed_for_accept:
            print("Summary Accepted!")
            accepted_summaries.append(summary)
        else:
            print("Summary Rejected.")
            if rejection_reasons:
                print("Reasons for rejection:")
                for r in rejection_reasons:
                    print(f"- {r}")

        if current_iteration < max_iterations:
            input("\nPress Enter to continue to the next iteration...")

    await network_manager.generate_final_output(topic_name, topic_description, accepted_summaries)
    print("\n--- Collaboration Finished ---")


async def main():
    """Главная функция для выбора режима и запуска."""
    print("Welcome to the Neural Collaborative Framework (Python CLI Version)\nPowered by Ollama")
    ollama_client = OllamaClient()
    while True:
        print("\nSelect Mode:")
        print("1. Collaboration Mode (Multi-Agent Chat)")
        print("2. Exit")
        choice = input("Enter choice (1 or 2): ").strip()

        if choice == '1':
            await run_collaboration_mode(ollama_client)
        elif choice == '2':
            print("Exiting.")
            break
        else:
            print("Invalid choice. Please enter 1 or 2.")

        cont = input("\nRun another session? (yes/no): ").lower().strip()
        if cont != 'yes':
            break

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
         print(f"\nAn unexpected error occurred at the top level: {e}")
         traceback.print_exc()
