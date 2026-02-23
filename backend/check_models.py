import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load key từ file .env của cậu
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Danh sách các model có thể dùng:")
for m in genai.list_models():
    # Chỉ lấy những model biết "chat" (generateContent)
    if 'generateContent' in m.supported_generation_methods:
        print(f"- {m.name}")