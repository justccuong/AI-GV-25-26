import io
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover
    genai = None


load_dotenv()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title='EduMind AI Backend')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

api_key = os.getenv('GEMINI_API_KEY')
gemini_model = None
if genai is not None and api_key:
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')


def parse_json_payload(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            raise
        return json.loads(match.group(0))


def extract_topic(prompt: str) -> str:
    cleaned = re.sub(r'^(generate|create|build|make)\s+(a\s+)?mind\s*map\s+(about|for|on)\s+', '', prompt, flags=re.I).strip()
    cleaned = cleaned or prompt.strip()
    if not cleaned:
        return 'New Mind Map'
    return cleaned[:48].strip().title()


def fallback_mindmap(prompt: str) -> Dict[str, Any]:
    topic = extract_topic(prompt)
    return {
        'id': 'root',
        'label': topic,
        'children': [
            {
                'id': 'overview',
                'label': 'Overview',
                'children': [
                    {'id': 'overview-goals', 'label': 'Goals', 'children': []},
                    {'id': 'overview-value', 'label': 'Why it matters', 'children': []},
                ],
            },
            {
                'id': 'core-pillars',
                'label': 'Core Pillars',
                'children': [
                    {'id': 'core-people', 'label': 'People', 'children': []},
                    {'id': 'core-process', 'label': 'Process', 'children': []},
                    {'id': 'core-tools', 'label': 'Tools', 'children': []},
                ],
            },
            {
                'id': 'workflow',
                'label': 'Workflow',
                'children': [
                    {'id': 'workflow-start', 'label': 'Inputs', 'children': []},
                    {'id': 'workflow-run', 'label': 'Execution', 'children': []},
                    {'id': 'workflow-output', 'label': 'Outcomes', 'children': []},
                ],
            },
            {
                'id': 'best-practices',
                'label': 'Best Practices',
                'children': [
                    {'id': 'best-risk', 'label': 'Risks', 'children': []},
                    {'id': 'best-metrics', 'label': 'Metrics', 'children': []},
                ],
            },
        ],
    }


def normalize_generated_tree(payload: Dict[str, Any], prompt: str) -> Dict[str, Any]:
    root = payload.get('root', payload)
    if 'label' not in root:
        root['label'] = extract_topic(prompt)
    if 'id' not in root:
        root['id'] = 'root'
    if 'children' not in root or not isinstance(root['children'], list):
        root['children'] = []
    return root


def serialize_mindmap(mindmap: models.MindMap) -> Dict[str, Any]:
    try:
        data = json.loads(mindmap.data or '{}')
    except json.JSONDecodeError:
        data = {}

    return {
        'id': mindmap.id,
        'title': mindmap.title,
        'data': data,
        'created_at': mindmap.created_at,
        'updated_at': mindmap.updated_at,
    }


def get_mindmap_or_404(db: Session, mindmap_id: int, owner_id: int) -> models.MindMap:
    mindmap = (
        db.query(models.MindMap)
        .filter(models.MindMap.id == mindmap_id, models.MindMap.owner_id == owner_id)
        .first()
    )
    if not mindmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Mind map not found.')
    return mindmap


def generate_mindmap_with_ai(prompt: str, current_diagram: Dict[str, Any] | None = None) -> Dict[str, Any]:
    if gemini_model is None:
        return fallback_mindmap(prompt)

    system_prompt = f"""
You are an expert mind map planner.
Return only JSON.
Create a concise but useful mind map for the user request.
Use this schema:
{{
  "id": "root",
  "label": "Main Topic",
  "children": [
    {{ "id": "child-1", "label": "Branch", "children": [] }}
  ]
}}
Rules:
- labels should be short, usually under 6 words
- create 3 to 6 top-level branches when appropriate
- every node must have id, label, and children
- do not wrap the JSON in markdown
- if the user wants to refine the current diagram, use it as context but still return a complete new tree
Current diagram context:
{json.dumps(current_diagram or {}, ensure_ascii=False)[:10000]}
User request:
{prompt}
"""

    response = gemini_model.generate_content(
        system_prompt,
        generation_config={'response_mime_type': 'application/json'},
    )
    payload = parse_json_payload(response.text)
    return normalize_generated_tree(payload, prompt)


@app.get('/')
def read_root():
    return {'message': 'EduMind AI Backend is running.'}


@app.post('/analyze-note')
async def analyze_note(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        if gemini_model is None:
            root = fallback_mindmap(f'Class notes from image: {file.filename or "Untitled"}')
            return {'title': root['label'], 'root': root}

        prompt = """
Analyze this study note image and convert it into a concise mind map.
Return JSON only.
Schema:
{
  "id": "root",
  "label": "Main Topic",
  "children": [
    {"id": "child-1", "label": "Branch", "children": []}
  ]
}
Rules:
- keep labels short
- every node must include id, label, children
- do not output markdown
"""
        response = gemini_model.generate_content(
            [prompt, image],
            generation_config={'response_mime_type': 'application/json'},
        )
        root = normalize_generated_tree(parse_json_payload(response.text), file.filename or 'Study Notes')
        return {'title': root['label'], 'root': root}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Image analysis failed: {exc}') from exc


@app.post('/register', response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='Email already registered.')

    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={'sub': new_user.email})
    return {'access_token': access_token, 'token_type': 'bearer'}


@app.post('/login', response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    access_token = auth.create_access_token(data={'sub': db_user.email})
    return {'access_token': access_token, 'token_type': 'bearer'}


@app.get('/mindmaps', response_model=list[schemas.MindMapSummary])
def list_mindmaps(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    mindmaps = db.query(models.MindMap).filter(models.MindMap.owner_id == current_user.id).all()
    mindmaps.sort(
        key=lambda item: item.updated_at or item.created_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return [serialize_mindmap(mindmap) for mindmap in mindmaps]


@app.get('/mindmaps/{mindmap_id}', response_model=schemas.MindMapDetail)
def get_saved_mindmap(
    mindmap_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return serialize_mindmap(get_mindmap_or_404(db, mindmap_id, current_user.id))


@app.post('/mindmaps', response_model=schemas.MindMapDetail)
def create_saved_mindmap(
    payload: schemas.MindMapCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    mindmap = models.MindMap(
        title=payload.title.strip() or 'Untitled diagram',
        data=json.dumps(payload.data, ensure_ascii=False),
        owner_id=current_user.id,
    )
    db.add(mindmap)
    db.commit()
    db.refresh(mindmap)
    return serialize_mindmap(mindmap)


@app.put('/mindmaps/{mindmap_id}', response_model=schemas.MindMapDetail)
def update_saved_mindmap(
    mindmap_id: int,
    payload: schemas.MindMapUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    mindmap = get_mindmap_or_404(db, mindmap_id, current_user.id)
    mindmap.title = payload.title.strip() or 'Untitled diagram'
    mindmap.data = json.dumps(payload.data, ensure_ascii=False)
    mindmap.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(mindmap)
    return serialize_mindmap(mindmap)


@app.patch('/mindmaps/{mindmap_id}/title', response_model=schemas.MindMapDetail)
def rename_saved_mindmap(
    mindmap_id: int,
    payload: schemas.MindMapRename,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    mindmap = get_mindmap_or_404(db, mindmap_id, current_user.id)
    mindmap.title = payload.title.strip() or mindmap.title
    mindmap.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(mindmap)
    return serialize_mindmap(mindmap)


@app.delete('/mindmaps/{mindmap_id}')
def delete_saved_mindmap(
    mindmap_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    mindmap = get_mindmap_or_404(db, mindmap_id, current_user.id)
    db.delete(mindmap)
    db.commit()
    return {'message': 'Mind map deleted successfully.'}


@app.post('/assistant/mindmap', response_model=schemas.AssistantMindMapResponse)
def assistant_mindmap(
    payload: schemas.AssistantMindMapRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    try:
        root = generate_mindmap_with_ai(payload.prompt, payload.current_diagram)
        title = root.get('label') or extract_topic(payload.prompt)
        return {
            'title': title,
            'message': f'Generated a new mind map about {title}.',
            'diagram': root,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'AI generation failed: {exc}') from exc
