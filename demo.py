import os
import ollama

# Set the Ollama API host (e.g., "http://192.168.1.100:11434")
os.environ["OLLAMA_HOST"] = "http://10.216.143.246:11434"

# Initialize the client
client = ollama.Client()

response = ollama.list()
for model in response["models"]:
    print(model["model"])
