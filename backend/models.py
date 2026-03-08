
from enum import Enum
import json
import api_py as model_api

class Model(Enum):
    GPT = "chatgpt"
    CLAUDE = "claude"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    KIMI = "kimi"
    OLLAMA = "ollama"
    HUMAN = "human"

class Agent:
    def __init__(self, model: Model, sub_model: str = None):
        self.model = model
        self.sub_model = sub_model
        self.memory = []

    def _call_api(self, system_prompt: str, user_message: str):
        match self.model:
            case Model.GPT:
                return model_api.call_gpt(system_prompt=system_prompt, user_message=user_message)
            case Model.CLAUDE:
                return model_api.call_claude(system_prompt=system_prompt, user_message=user_message)
            case Model.GEMINI:
                target_model = self.sub_model if self.sub_model else "gemini-3-flash-preview"
                return model_api.call_gemini(system_prompt=system_prompt, user_message=user_message, model=target_model)
            case Model.DEEPSEEK:
                return model_api.call_deepseek(system_prompt=system_prompt, user_message=user_message)
            case Model.KIMI:
                return model_api.call_kimi(system_prompt=system_prompt, user_message=user_message)
            case Model.OLLAMA:
                target_model = self.sub_model if self.sub_model else "llama3"
                return model_api.call_ollama(system_prompt=system_prompt, user_message=user_message, model=target_model)
            case _:
                raise Exception(f"Model {self.model} not supported.")

    def prompt(self, system_prompt: str, user_message: str = 'Choose your move.'):
        if self.model == Model.HUMAN:
            return {"move": "WAITING_FOR_HUMAN"}

        max_retries = 3
        current_user_msg = user_message
        last_error = None

        for attempt in range(max_retries):
            try:
                result = self._call_api(system_prompt, current_user_msg)
                
                # Parse JSON safely
                clean_result = result.strip()
                if clean_result.startswith("```json"):
                    clean_result = clean_result.split("```json")[1].split("```")[0].strip()
                elif clean_result.startswith("```"):
                    clean_result = clean_result.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(clean_result)
                return parsed
            except Exception as e:
                last_error = str(e)
                print(f"Attempt {attempt + 1} failed for {self.model.value}: {last_error}")
                current_user_msg = f"{user_message}\n\nYour previous response caused an error: {last_error}\nPlease try again and ensure you return ONLY valid JSON matching the required format."
        
        # If all retries fail
        return {"raw_response": result if 'result' in locals() else None, "error": f"Failed after {max_retries} attempts. Last error: {last_error}"}
