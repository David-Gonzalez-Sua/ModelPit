import os
import requests

# ============ GEMINI ============
def call_gemini(system_prompt, user_message):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={os.getenv('GEMINI_KEY')}"
    
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_message}]}]
    }

    res = requests.post(url, json=payload)
    data = res.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


# ============ CLAUDE ============
def call_claude(system_prompt, user_message):
    url = "https://api.anthropic.com/v1/messages"

    headers = {
        "Content-Type": "application/json",
        "x-api-key": os.getenv("CLAUDE_KEY"),
        "anthropic-version": "2023-06-01"
    }

    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}]
    }

    res = requests.post(url, headers=headers, json=payload)
    data = res.json()
    return data["content"][0]["text"]


# ============ CHATGPT ============
def call_gpt(system_prompt, user_message):
    url = "https://api.openai.com/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('OPENAI_KEY')}"
    }

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    res = requests.post(url, headers=headers, json=payload)
    data = res.json()
    return data["choices"][0]["message"]["content"]


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
    data = res.json()
    return data["choices"][0]["message"]["content"]


# ============ KIMI K2.5 ============
def call_kimi(system_prompt, user_message):
    url = "https://api.moonshot.ai/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('KIMI_KEY')}"
    }

    payload = {
        "model": "kimi-k2.5",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    res = requests.post(url, headers=headers, json=payload)
    data = res.json()
    return data["choices"][0]["message"]["content"]


# ============ OLLAMA (LOCAL MODELS) ============
def call_ollama(system_prompt, user_message, model="llama3"):
    url = "http://localhost:11434/api/chat"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": False
    }

    res = requests.post(url, json=payload)
    data = res.json()
    return data["message"]["content"]
