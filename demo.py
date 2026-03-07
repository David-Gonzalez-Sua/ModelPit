import os
import ollama

# Set the Ollama API host (e.g., "http://192.168.1.100:11434")
os.environ["OLLAMA_HOST"] = "http://10.216.143.246:11434"

# Initialize the client, You dont need to store it in a var
client = ollama.Client()

response = ollama.list()
# List available models
for model in response["models"]:
    print(model["model"])

# A var to store our model string we want to use
model_name="rnj-1:8b"


# Simple with ollama.generate
response = ollama.generate(model=model_name, prompt="What is a 1965 Isuzu Elfin?")
print(response["response"])


# Simple with ollama.chat
# Define the conversation messages
messages = [
    {"role": "user", "content": "What is a 1965 Isuzu Elfin?"}
]
# Send the query and get a response
response = ollama.chat(
    model=model_name,
    messages=messages
)
print(response["message"]["content"])
