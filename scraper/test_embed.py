import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(r'c:\Users\patle\OneDrive\Documents\Desktop\placement-saas\.env.local')

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

try:
    models = genai.list_models()
    for m in models:
        print(f"Name: {m.name}")
        print(f"Supported methods: {m.supported_generation_methods}")
        print("---")
except Exception as e:
    print(f"Error listing models: {e}")
