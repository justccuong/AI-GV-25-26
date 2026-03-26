# 🤖 AI-GV-25-26 | Intelligent Education Assistant 🚀

<p align="center">
  <a href="https://ai-gv-25-26.onrender.com/">
    <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge&logo=render&logoColor=white" alt="Status">
  </a>
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Postgres">
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini">
</p>

---

## 🌟 Project Overview
**AI-GV-25-26** là một nền tảng giáo dục thông minh thế hệ mới. Dự án kết hợp sức mạnh của **FastAPI** và **React** cùng trí tuệ nhân tạo từ **Google Gemini**, giúp tạo ra các sơ đồ tư duy (ReactFlow), quản lý dữ liệu học tập và xác thực bảo mật qua JWT.

> **💡 Status Update:** Hệ thống hiện đang được triển khai trên **Onrender** và được giám sát 24/7 để đảm bảo không bị ngủ đông (No-Idle mode activated). 😉

---

## 🏗 System Architecture

### 📂 Directory Structure
```bash
AI-GV-25-26/
├── 📂 backend/             # FastAPI Application (Python)
│   ├── main.py             # App entry & Endpoints
│   ├── auth.py             # JWT & Security logic
│   ├── database.py         # DB connection config
│   └── models.py           # SQLAlchemy models
├── 📂 frontend/            # React + Vite Application (JS)
│   ├── src/                # UI Components & Hooks
│   └── tailwind.config.js  # Styling config
└── 📄 README.md            # Documentation
````


## 🚀 Installation & Setup

### 🛰 1. Backend Setup

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo và kích hoạt môi trường ảo
python -m venv .venv
# Trên Windows: .venv\Scripts\activate
source .venv/bin/activate 

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

**Configuration:** Tạo file `.env` trong thư mục `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET_KEY=your_secret_key_here
GOOGLE_API_KEY=your_google_api_key
```

### 🎨 2. Frontend Setup

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt package
npm install
```

-----

## ⚡ Running the App

### **Option A: Run Both (Concurrent)**

Cách nhanh nhất để dev cả 2 cùng lúc:

```bash
cd frontend
npm run dev
```

### **Option B: Run Separately**

| Service | Command | URL |
| :--- | :--- | :--- |
| **Backend** | `python -m uvicorn main:app --reload` | `http://localhost:8000` |
| **Frontend** | `npm run start-front` | `http://localhost:5173` |
| **API Docs** | - | `http://localhost:8000/docs` |

-----

## 🔑 Key Features

  - ✨ **Full-stack Flow:** Tích hợp mượt mà giữa Python Backend và React Frontend.
  - 🧠 **AI-Powered:** Phân tích nội dung giáo dục thông qua Google Generative AI.
  - 🔐 **Secure:** Hệ thống đăng nhập và phân quyền bằng JWT (JSON Web Tokens).
  - 📊 **Visualized:** Vẽ sơ đồ, đồ thị tương tác với ReactFlow.
  - 📄 **Exportable:** Hỗ trợ xuất dữ liệu ra PDF nhanh chóng.
  - 📱 **Modern UI:** Responsive hoàn toàn với Tailwind CSS.

-----

## 🌐 Deployment

  - **Frontend:** Khuyến khích dùng [Vercel](https://vercel.com/).
  - **Backend:** Triển khai trên [Onrender](https://render.com/), Railway hoặc AWS.

-----

## 🤝 Contributing & License

  - Dự án được phát hành theo giấy phép **MIT License**.
  - Mọi đóng góp vui lòng mở **Pull Request** hoặc tạo **Issue** trên GitHub.

-----


Built with ✨ & 💻 by justccuong


```
