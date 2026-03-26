# AI-GV-25-26

## Project Overview
This project is aimed at developing an Artificial Intelligence system for the GV 25-26 course. It focuses on key methodologies in AI and their applications in various domains.

## Tech Stack
- **Programming Language:** Python
- **Web Framework:** Flask
- **Database:** PostgreSQL
- **Machine Learning Libraries:** TensorFlow, Scikit-learn
- **Frontend Technologies:** HTML, CSS, JavaScript

## Project Structure
```
AI-GV-25-26/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py
│   └── templates/
│       └── index.html
├── migrations/
├── tests/
├── requirements.txt
├── config.py
└── run.py
```

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/justccuong/AI-GV-25-26.git
   cd AI-GV-25-26
   ```
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Setup the database:
   Configure the database settings in `config.py` and run migrations:
   ```bash
   flask db upgrade
   ```

## Usage
To start the application, use:
```bash
python run.py
```
Access the application in your web browser at `http://127.0.0.1:5000/`.

## Deployment
For deployment, consider using a cloud platform like Heroku or AWS. Make sure to configure the environment variables and database settings accordingly. You can also use Docker for containerization to simplify the deployment process.
