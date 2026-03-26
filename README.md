v2 AI-GV-25-26/
├── backend/ # FastAPI Application
│   ├── main.py # Main FastAPI app with endpoints
│   ├── auth.py # JWT authentication logic
│   ├── database.py # Database configuration
│   ├── models.py # SQLAlchemy database models

Create virtual environment:

bash
python -m venv .venv
source .venv/bin/activate # On Windows: .venv\Scripts\activate

Install dependencies:

bash
pip install -r requirements.txt

Configure environment:
Create a .env file in the backend/ directory:

Code
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET_KEY=your_secret_key_here
GOOGLE_API_KEY=your_google_api_key

Run FastAPI server:

bash
python -m uvicorn main:app --reload

API available at: http://localhost:8000
Docs available at: http://localhost:8000/docs

Frontend Setup
Navigate to frontend:

bash
cd frontend

Install dependencies:

bash
npm install

Start development server:

bash
npm run start-front

App available at: http://localhost:5173

Running Both Services
From the frontend/ directory:

bash
npm run dev

This runs both Vite (frontend) and Uvicorn (backend) concurrently.

📝 Available NPM Scripts
Command             Description
npm run dev        Start frontend and backend together
npm run start-front Start Vite dev server only
npm run start-back  Start FastAPI backend only
npm run build      Build React app for production
npm run lint       Run ESLint checks
npm run preview    Preview production build

🌐 Deployment
Frontend (Vercel)
The frontend is configured for automatic deployment to Vercel:
Connect your GitHub repository to Vercel
It will automatically detect vite.config.js and deploy
Backend
Deploy the FastAPI backend to:
Railway
Heroku
PythonAnywhere
AWS (Elastic Beanstalk, EC2)
DigitalOcean

🔑 Key Features
✅ RESTful API with FastAPI
✅ Async/await support for high performance
✅ JWT authentication system
✅ PostgreSQL database integration
✅ React components with modern hooks
✅ Responsive Tailwind CSS styling
✅ Graph/diagram visualization with ReactFlow
✅ Google Generative AI integration
✅ PDF export functionality
✅ Hot module reloading (HMR) in development

📦 Dependencies
Core Backend Requirements:
fastapi, uvicorn, sqlalchemy, psycopg2, pyjwt, google-generativeai
Core Frontend Dependencies:
react, react-dom, react-router-dom, axios, tailwindcss, vite

📄 License
This project is licensed under the MIT License.

🤝 Contributing
Contributions are welcome! Please:
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

📧 Contact
For questions or feedback, please open an issue on GitHub.
