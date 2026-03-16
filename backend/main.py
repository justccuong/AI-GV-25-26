import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io

from database import engine, get_db
import models
from sqlalchemy.orm import Session

from fastapi import HTTPException, Depends
import schemas
import auth
import models

# 1. Load cái chìa khóa từ file .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# 2. Cấu hình Gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash') # Dùng bản Flash cho nhanh và Free

models.Base.metadata.create_all(bind=engine)

# 3. Khởi tạo App FastAPI
app = FastAPI()

# 4. Cấp quyền cho ReactJS (sau này sẽ dùng) gọi vào đây
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tương đương: res.header("Access-Control-Allow-Origin", "*");
    allow_credentials=False,
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
    
@app.post("/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra xem email đã tồn tại chưa
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký rồi nha!")
    
    # 2. Băm mật khẩu và lưu vào DB
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Trả về Token luôn cho nóng
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Tìm user theo email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    # 2. Kiểm tra user có tồn tại và mật khẩu có khớp không
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Sai email hoặc mật khẩu rồi đồ ngốc!")
    
    # 3. Cấp Token
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}