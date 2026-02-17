import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io

# 1. Load cái chìa khóa từ file .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# 2. Cấu hình Gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash') # Dùng bản Flash cho nhanh và Free

# 3. Khởi tạo App FastAPI
app = FastAPI()

# 4. Cấp quyền cho ReactJS (sau này sẽ dùng) gọi vào đây
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Tạm thời cho phép tất cả các nguồn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "EduMind AI Backend đang chạy ngon lành cành đào!"}

@app.post("/analyze-note")
async def analyze_note(file: UploadFile = File(...)):
    """
    API nhận ảnh vở ghi -> Trả về nội dung tóm tắt để vẽ Mindmap
    """
    try:
        # Đọc file ảnh upload lên
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Ra lệnh cho AI (Prompt Engineering ở đây)
        prompt = """
        Bạn là một trợ lý học tập AI thông minh. Nhiệm vụ của bạn là:
        Phân tích hình ảnh vở ghi này và tạo cấu trúc sơ đồ tư duy.
        Trả về kết quả dưới dạng JSON (KHÔNG markdown) theo cấu trúc đệ quy sau:
        {
            "id": "root",
            "label": "Chủ đề chính",
            "children": [
                {
                    "id": "unique_id_1",
                    "label": "Ý chính 1",
                    "children": [...]
                },
                ...
            ]
        }
        Lưu ý:
        1. "label" nên ngắn gọn (dưới 10 từ).
        2. Tạo ID ngẫu nhiên nhưng duy nhất cho mỗi node.
        3. Đảm bảo cấu trúc cây logic.
        """

        # Gửi ảnh + lệnh cho Gemini
        response = model.generate_content(
            [prompt, image],
            generation_config={"response_mime_type": "application/json"}
        )
        
        import json
        return json.loads(response.text)
    
    except Exception as e:
        return {"error": str(e)}