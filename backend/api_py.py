import os
import requests
import json
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

def handle_api_error(res, service_name):
    try:
        data = res.json()
    except:
        data = res.text
    
    error_msg = f"API Error from {service_name}: Status {res.status_code} - {data}"
    print(error_msg)
    raise Exception(error_msg)

# ============ GEMINI ============
def get_gemini_models():
    api_key = os.getenv('GEMINI_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("Error: No Gemini API key found in environment variables (checked GEMINI_KEY and GOOGLE_API_KEY)")
        return []
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            models = []
            for m in data.get('models', []):
                name = m['name'].split('/')[-1]
                methods = m.get('supportedGenerationMethods', [])
                if 'generateContent' in methods:
                    models.append(name)
            
            if models:
                # Put preview/flash models first if they exist
                models.sort(key=lambda x: ("preview" in x or "flash" in x), reverse=True)
                # Ensure the user's mentioned model is included if not found but seems likely to exist
                if "gemini-3-flash-preview" not in models:
                    models.insert(0, "gemini-3-flash-preview")
                return models
                
            return ["gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
            
        print(f"Gemini API Error: Status {response.status_code} - {response.text}")
        return []
    except Exception as e:
        print(f"Error fetching Gemini models: {e}")
        return []

def call_gemini(system_prompt, user_message, model="gemini-2.0-flash"):
    api_key = os.getenv('GEMINI_KEY') or os.getenv('GOOGLE_API_KEY')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}]
    }

    res = requests.post(url, json=payload)
    if res.status_code != 200:
        handle_api_error(res, "Gemini")
    
    data = res.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except KeyError:
        raise Exception(f"Unexpected response format from Gemini: {data}")


# ============ CLAUDE ============
def call_claude(system_prompt, user_message):
    url = "https://api.anthropic.com/v1/messages"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": os.getenv("CLAUDE_KEY"),
        "anthropic-version": "2023-06-01"
    }

    payload = {
        "model": "claude-3-5-sonnet-20240620",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}]
    }

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        handle_api_error(res, "Claude")
        
    data = res.json()
    try:
        return data["content"][0]["text"]
    except KeyError:
        raise Exception(f"Unexpected response format from Claude: {data}")


# ============ CHATGPT ============
def call_gpt(system_prompt, user_message):
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        handle_api_error(res, "ChatGPT")
        
    data = res.json()
    try:
        return data["choices"][0]["message"]["content"]
    except KeyError:
        raise Exception(f"Unexpected response format from ChatGPT: {data}")


# ============ DEEPSEEK ============
def call_deepseek(system_prompt, user_message):
    url = "https://api.deepseek.com/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('DEEPSEEK_KEY')}"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        handle_api_error(res, "DeepSeek")
        
    data = res.json()
    try:
        return data["choices"][0]["message"]["content"]
    except KeyError:
        raise Exception(f"Unexpected response format from DeepSeek: {data}")


# ============ KIMI K2.5 ============
def call_kimi(system_prompt, user_message):
    url = "https://api.moonshot.ai/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('KIMI_KEY')}"
    }

    payload = {
        "model": "moonshot-v1-8k",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        handle_api_error(res, "Kimi")
        
    data = res.json()
    try:
        return data["choices"][0]["message"]["content"]
    except KeyError:
        raise Exception(f"Unexpected response format from Kimi: {data}")


# ============ OLLAMA (LOCAL MODELS) ============
def call_ollama(system_prompt, user_message, model="llama3"):
    url = "http://10.216.143.246:11434/api/chat"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": False
    }

    try:
        res = requests.post(url, json=payload, timeout=30)
        if res.status_code != 200:
            handle_api_error(res, "Ollama")
        
        data = res.json()
        return data["message"]["content"]
    except Exception as e:
        print(f"Ollama Error: {e}")
        raise e

def list_ollama_models():
    url = "http://10.216.143.246:11434/api/tags"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code != 200:
            return []
        data = res.json()
        return [m["name"] for m in data.get("models", [])]
    except Exception as e:
        print(f"Failed to list Ollama models: {e}")
        return []
