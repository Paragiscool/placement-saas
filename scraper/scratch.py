import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("../.env.local")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Supported embedding models:")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(m.name)
