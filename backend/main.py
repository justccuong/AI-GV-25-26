import io
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(*_args, **_kwargs):
        return False
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


VALID_NODE_TYPES = {'standard', 'text', 'image', 'decision'}
VALID_EDGE_TYPES = {'floating', 'bezier', 'straight', 'step'}

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


def normalize_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ''


def normalize_edge_label(value: Any) -> str:
    return normalize_text(value)


def slugify(value: str) -> str:
    normalized = normalize_text(value).lower().replace('đ', 'd')
    normalized = re.sub(r'[^a-z0-9]+', '-', normalized)
    return normalized.strip('-')


def extract_topic(prompt: str) -> str:
    cleaned = normalize_text(prompt)
    cleaned = re.sub(
        r'^(generate|create|build|make|tao|tạo|vẽ|ve|sinh|lap|lập)\s+(a\s+)?(new\s+)?mind\s*map\s+(about|for|on|ve|về)\s+',
        '',
        cleaned,
        flags=re.I,
    )
    cleaned = cleaned or normalize_text(prompt)
    if not cleaned:
        return 'Mindmap mới'
    return cleaned[:64].strip().title()


def ensure_unique_id(base: str, existing_ids: set[str]) -> str:
    candidate = slugify(base) or 'node-moi'

    if candidate not in existing_ids:
        existing_ids.add(candidate)
        return candidate

    counter = 2
    while f'{candidate}-{counter}' in existing_ids:
        counter += 1

    resolved = f'{candidate}-{counter}'
    existing_ids.add(resolved)
    return resolved


def fallback_mindmap(prompt: str) -> Dict[str, Any]:
    topic = extract_topic(prompt)
    return {
        'id': 'root',
        'label': topic,
        'children': [
            {
                'id': 'tong-quan',
                'label': 'Tổng quan',
                'children': [
                    {'id': 'tong-quan-muc-tieu', 'label': 'Mục tiêu', 'children': []},
                    {'id': 'tong-quan-gia-tri', 'label': 'Giá trị', 'children': []},
                ],
            },
            {
                'id': 'tru-cot-chinh',
                'label': 'Trụ cột chính',
                'children': [
                    {'id': 'tru-cot-con-nguoi', 'label': 'Con người', 'children': []},
                    {'id': 'tru-cot-quy-trinh', 'label': 'Quy trình', 'children': []},
                    {'id': 'tru-cot-cong-cu', 'label': 'Công cụ', 'children': []},
                ],
            },
            {
                'id': 'dong-cong-viec',
                'label': 'Dòng công việc',
                'children': [
                    {'id': 'dong-cong-viec-dau-vao', 'label': 'Đầu vào', 'children': []},
                    {'id': 'dong-cong-viec-thuc-thi', 'label': 'Thực thi', 'children': []},
                    {'id': 'dong-cong-viec-dau-ra', 'label': 'Đầu ra', 'children': []},
                ],
            },
            {
                'id': 'luu-y',
                'label': 'Lưu ý',
                'children': [
                    {'id': 'luu-y-rui-ro', 'label': 'Rủi ro', 'children': []},
                    {'id': 'luu-y-do-luong', 'label': 'Đo lường', 'children': []},
                ],
            },
        ],
    }


def sanitize_tree_node(node: Dict[str, Any], fallback_label: str, existing_ids: set[str] | None = None) -> Dict[str, Any]:
    existing_ids = existing_ids or set()
    node_id = normalize_text(node.get('id'))
    label = normalize_text(node.get('label')) or fallback_label
    resolved_id = ensure_unique_id(node_id or label, existing_ids)
    children = node.get('children') if isinstance(node.get('children'), list) else []

    return {
        'id': resolved_id,
        'label': label,
        'children': [
            sanitize_tree_node(child if isinstance(child, dict) else {}, fallback_label='Nhánh mới', existing_ids=existing_ids)
            for child in children
        ],
    }


def normalize_generated_tree(payload: Dict[str, Any], prompt: str) -> Dict[str, Any]:
    root = payload.get('root', payload) if isinstance(payload, dict) else {}
    fallback_label = extract_topic(prompt)
    return sanitize_tree_node(root if isinstance(root, dict) else {}, fallback_label=fallback_label, existing_ids=set())


def summarize_current_diagram(current_diagram: Dict[str, Any] | None) -> Dict[str, Any]:
    current_diagram = current_diagram or {}
    nodes = current_diagram.get('nodes') if isinstance(current_diagram.get('nodes'), list) else []
    edges = current_diagram.get('edges') if isinstance(current_diagram.get('edges'), list) else []

    summarized_nodes = []
    for node in nodes[:80]:
        if not isinstance(node, dict):
            continue
        data = node.get('data') if isinstance(node.get('data'), dict) else {}
        summarized_nodes.append({
            'id': node.get('id'),
            'label': data.get('label'),
            'nodeType': data.get('nodeType'),
            'isRoot': data.get('isRoot'),
        })

    summarized_edges = []
    for edge in edges[:120]:
        if not isinstance(edge, dict):
            continue
        summarized_edges.append({
            'id': edge.get('id'),
            'source': edge.get('source'),
            'target': edge.get('target'),
            'label': edge.get('label') or '',
        })

    return {
        'title': current_diagram.get('title') or '',
        'node_count': len(nodes),
        'edge_count': len(edges),
        'nodes': summarized_nodes,
        'edges': summarized_edges,
    }


def get_root_node_id(current_diagram: Dict[str, Any] | None) -> str | None:
    current_diagram = current_diagram or {}
    nodes = current_diagram.get('nodes') if isinstance(current_diagram.get('nodes'), list) else []
    edges = current_diagram.get('edges') if isinstance(current_diagram.get('edges'), list) else []

    for node in nodes:
        data = node.get('data') if isinstance(node, dict) and isinstance(node.get('data'), dict) else {}
        if data.get('isRoot'):
            return str(node.get('id'))

    incoming = {str(node.get('id')): 0 for node in nodes if isinstance(node, dict) and node.get('id')}
    for edge in edges:
        if isinstance(edge, dict) and edge.get('target'):
            target = str(edge.get('target'))
            incoming[target] = incoming.get(target, 0) + 1

    for node in nodes:
        if isinstance(node, dict) and incoming.get(str(node.get('id')), 0) == 0:
            return str(node.get('id'))

    if nodes and isinstance(nodes[0], dict) and nodes[0].get('id'):
        return str(nodes[0]['id'])

    return None


def should_replace_diagram(prompt: str, current_diagram: Dict[str, Any] | None) -> bool:
    current_diagram = current_diagram or {}
    nodes = current_diagram.get('nodes') if isinstance(current_diagram.get('nodes'), list) else []
    lowered = normalize_text(prompt).lower()

    if not nodes:
        return True

    replace_keywords = [
        'mindmap mới',
        'so do moi',
        'sơ đồ mới',
        'tạo mới',
        'làm mới',
        'dựng lại',
        'thay toàn bộ',
        'rebuild',
        'replace',
        'new mind map',
        'generate a mind map',
    ]
    return any(keyword in lowered for keyword in replace_keywords)


def fallback_assistant_payload(prompt: str, current_diagram: Dict[str, Any] | None = None) -> Dict[str, Any]:
    current_diagram = current_diagram or {}

    if should_replace_diagram(prompt, current_diagram):
        root = fallback_mindmap(prompt)
        return {
            'mode': 'replace',
            'title': root['label'],
            'message': f'Đã dựng một mindmap mới về {root["label"]}.',
            'root': root,
        }

    nodes = current_diagram.get('nodes') if isinstance(current_diagram.get('nodes'), list) else []
    existing_ids = {str(node.get('id')) for node in nodes if isinstance(node, dict) and node.get('id')}
    root_id = get_root_node_id(current_diagram) or 'root'
    branch_title = extract_topic(prompt)
    branch_id = ensure_unique_id(branch_title, existing_ids)
    child_one = ensure_unique_id(f'{branch_title}-tong-quan', existing_ids)
    child_two = ensure_unique_id(f'{branch_title}-hanh-dong', existing_ids)
    child_three = ensure_unique_id(f'{branch_title}-luu-y', existing_ids)

    return {
        'mode': 'merge',
        'title': current_diagram.get('title') or branch_title,
        'message': f'Đã thêm nhánh mới "{branch_title}" vào sơ đồ hiện tại.',
        'nodes': [
            {'id': branch_id, 'label': branch_title, 'parentId': root_id, 'nodeType': 'standard', 'edgeLabel': ''},
            {'id': child_one, 'label': 'Tổng quan', 'parentId': branch_id, 'nodeType': 'standard', 'edgeLabel': ''},
            {'id': child_two, 'label': 'Việc cần làm', 'parentId': branch_id, 'nodeType': 'standard', 'edgeLabel': ''},
            {'id': child_three, 'label': 'Lưu ý', 'parentId': branch_id, 'nodeType': 'standard', 'edgeLabel': ''},
        ],
        'edges': [],
        'removeNodeIds': [],
        'removeEdgeIds': [],
    }


def sanitize_remove_ids(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []

    cleaned: list[str] = []
    for value in values:
        item = normalize_text(value)
        if item:
            cleaned.append(item)
    return cleaned


def sanitize_assistant_node(
    node: Dict[str, Any],
    index: int,
    existing_ids: set[str],
    root_id: str | None,
    current_node_ids: set[str],
) -> Dict[str, Any] | None:
    if not isinstance(node, dict):
        return None

    requested_id = normalize_text(node.get('id'))
    label = normalize_text(node.get('label'))
    node_type = normalize_text(node.get('nodeType')) or 'standard'
    if node_type not in VALID_NODE_TYPES:
        node_type = 'standard'

    if requested_id and requested_id in current_node_ids:
        resolved_id = requested_id
    else:
        resolved_id = ensure_unique_id(requested_id or label or f'nhanh-moi-{index + 1}', existing_ids)

    parent_id = normalize_text(node.get('parentId'))
    if parent_id and parent_id not in current_node_ids and parent_id not in existing_ids:
        parent_id = root_id or ''

    if not requested_id and not parent_id and root_id and root_id != resolved_id:
        parent_id = root_id

    payload: Dict[str, Any] = {'id': resolved_id}

    if label:
        payload['label'] = label[:80]

    if parent_id and parent_id != resolved_id:
        payload['parentId'] = parent_id
        payload['edgeLabel'] = normalize_edge_label(node.get('edgeLabel'))
    elif 'edgeLabel' in node:
        payload['edgeLabel'] = normalize_edge_label(node.get('edgeLabel'))

    if node_type != 'standard' or 'nodeType' in node:
        payload['nodeType'] = node_type

    if 'imageUrl' in node:
        payload['imageUrl'] = normalize_text(node.get('imageUrl'))

    if 'fontSize' in node:
        try:
            font_size = int(node.get('fontSize'))
            if font_size > 0:
                payload['fontSize'] = font_size
        except (TypeError, ValueError):
            pass

    return payload if len(payload) > 1 else None


def sanitize_assistant_edge(edge: Dict[str, Any], known_node_ids: set[str]) -> Dict[str, Any] | None:
    if not isinstance(edge, dict):
        return None

    source = normalize_text(edge.get('source'))
    target = normalize_text(edge.get('target'))
    if not source or not target or source == target or source not in known_node_ids or target not in known_node_ids:
        return None

    payload: Dict[str, Any] = {
        'source': source,
        'target': target,
        'label': normalize_edge_label(edge.get('label')),
    }

    edge_id = normalize_text(edge.get('id'))
    edge_type = normalize_text(edge.get('type'))
    if edge_id:
        payload['id'] = edge_id
    if edge_type in VALID_EDGE_TYPES:
        payload['type'] = edge_type
    if normalize_text(edge.get('accentColor')):
        payload['accentColor'] = normalize_text(edge.get('accentColor'))

    try:
        stroke_width = int(edge.get('strokeWidth'))
        if stroke_width > 0:
            payload['strokeWidth'] = stroke_width
    except (TypeError, ValueError):
        pass

    if normalize_text(edge.get('strokeColor')):
        payload['strokeColor'] = normalize_text(edge.get('strokeColor'))

    return payload


def sanitize_assistant_payload(payload: Dict[str, Any], prompt: str, current_diagram: Dict[str, Any] | None = None) -> Dict[str, Any]:
    current_diagram = current_diagram or {}
    current_nodes = current_diagram.get('nodes') if isinstance(current_diagram.get('nodes'), list) else []
    current_node_ids = {str(node.get('id')) for node in current_nodes if isinstance(node, dict) and node.get('id')}
    root_id = get_root_node_id(current_diagram)
    diagram_payload = payload.get('diagram', payload) if isinstance(payload, dict) else {}

    if not isinstance(diagram_payload, dict):
        return fallback_assistant_payload(prompt, current_diagram)

    mode = normalize_text(diagram_payload.get('mode')).lower()
    if mode == 'replace' or 'root' in diagram_payload or 'children' in diagram_payload:
        root = normalize_generated_tree(diagram_payload.get('root', diagram_payload), prompt)
        return {
            'mode': 'replace',
            'title': normalize_text(diagram_payload.get('title')) or root['label'],
            'message': normalize_text(diagram_payload.get('message')) or f'Đã tạo lại mindmap về {root["label"]}.',
            'root': root,
        }

    node_instructions = diagram_payload.get('nodes')
    if not isinstance(node_instructions, list):
        node_instructions = diagram_payload.get('node_updates') if isinstance(diagram_payload.get('node_updates'), list) else []

    edge_instructions = diagram_payload.get('edges')
    if not isinstance(edge_instructions, list):
        edge_instructions = diagram_payload.get('edge_updates') if isinstance(diagram_payload.get('edge_updates'), list) else []

    if not node_instructions and not edge_instructions:
        return fallback_assistant_payload(prompt, current_diagram)

    existing_ids = set(current_node_ids)
    sanitized_nodes = []
    for index, node in enumerate(node_instructions):
        sanitized = sanitize_assistant_node(node, index, existing_ids, root_id, current_node_ids)
        if sanitized:
            sanitized_nodes.append(sanitized)

    known_node_ids = set(current_node_ids)
    known_node_ids.update(node['id'] for node in sanitized_nodes)
    sanitized_edges = []
    for edge in edge_instructions:
        sanitized = sanitize_assistant_edge(edge, known_node_ids)
        if sanitized:
            sanitized_edges.append(sanitized)

    if not sanitized_nodes and not sanitized_edges:
        return fallback_assistant_payload(prompt, current_diagram)

    return {
        'mode': 'merge',
        'title': normalize_text(diagram_payload.get('title')) or current_diagram.get('title') or extract_topic(prompt),
        'message': normalize_text(diagram_payload.get('message')) or 'Đã tạo cập nhật có cấu trúc cho sơ đồ hiện tại.',
        'nodes': sanitized_nodes,
        'edges': sanitized_edges,
        'removeNodeIds': sanitize_remove_ids(diagram_payload.get('removeNodeIds') or diagram_payload.get('removedNodeIds')),
        'removeEdgeIds': sanitize_remove_ids(diagram_payload.get('removeEdgeIds') or diagram_payload.get('removedEdgeIds')),
    }


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Không tìm thấy sơ đồ tư duy.')
    return mindmap


def generate_mindmap_with_ai(prompt: str, current_diagram: Dict[str, Any] | None = None) -> Dict[str, Any]:
    if gemini_model is None:
        return fallback_assistant_payload(prompt, current_diagram)

    summarized_context = summarize_current_diagram(current_diagram)
    system_prompt = f"""
You are an AI copilot for a React Flow mind map editor.
Return JSON only and never use Markdown.

You must inspect the current diagram context and choose one of these two response formats:

1) Replace the whole diagram only if the canvas is empty or the user explicitly asks for a new/rebuilt map:
{{
  "mode": "replace",
  "title": "Tên sơ đồ",
  "message": "Mô tả ngắn gọn",
  "root": {{
    "id": "root",
    "label": "Chủ đề trung tâm",
    "children": [
      {{ "id": "nhanh-1", "label": "Nhánh", "children": [] }}
    ]
  }}
}}

2) Prefer targeted updates when the current diagram already has content:
{{
  "mode": "merge",
  "title": "Giữ nguyên hoặc cập nhật tiêu đề nếu cần",
  "message": "Mô tả ngắn gọn",
  "nodes": [
    {{
      "id": "existing-id-or-new-id",
      "label": "Tên nhánh ngắn",
      "nodeType": "standard",
      "parentId": "existing-parent-id",
      "edgeLabel": ""
    }}
  ],
  "edges": [
    {{ "source": "id-1", "target": "id-2", "label": "" }}
  ],
  "removeNodeIds": [],
  "removeEdgeIds": []
}}

Rules:
- If the current diagram has nodes, prefer mode="merge".
- Use exact existing node ids from the provided context whenever you attach to or edit current nodes.
- For new node ids, use short slug-like ids with hyphens.
- Labels must be short, usually under 6 words.
- Edge labels are optional. Use an empty string unless the user explicitly asks for a label.
- Do not include positions, React Flow styles, or any prose outside the JSON.
- A merge response should contain only the changed nodes or edges, not the entire graph.

Current diagram context:
{json.dumps(summarized_context, ensure_ascii=False)[:12000]}

User request:
{prompt}
"""

    try:
        response = gemini_model.generate_content(
            system_prompt,
            generation_config={'response_mime_type': 'application/json'},
        )
        payload = parse_json_payload(response.text)
        return sanitize_assistant_payload(payload, prompt, current_diagram)
    except Exception:
        return fallback_assistant_payload(prompt, current_diagram)


@app.get('/')
def read_root():
    return {'message': 'EduMind AI Backend đang hoạt động.'}


@app.post('/analyze-note')
async def analyze_note(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        if gemini_model is None:
            root = fallback_mindmap(f'Ghi chú từ ảnh: {file.filename or "Tài liệu"}')
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
        root = normalize_generated_tree(parse_json_payload(response.text), file.filename or 'Ghi chú học tập')
        return {'title': root['label'], 'root': root}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Phân tích ảnh thất bại: {exc}') from exc


@app.post('/register', response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail='Email này đã được đăng ký.')

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
        raise HTTPException(status_code=401, detail='Email hoặc mật khẩu không đúng.')

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
        title=payload.title.strip() or 'Sơ đồ chưa đặt tên',
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
    mindmap.title = payload.title.strip() or 'Sơ đồ chưa đặt tên'
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
    return {'message': 'Đã xóa sơ đồ thành công.'}


@app.post('/assistant/mindmap', response_model=schemas.AssistantMindMapResponse)
def assistant_mindmap(
    payload: schemas.AssistantMindMapRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    try:
        diagram = generate_mindmap_with_ai(payload.prompt, payload.current_diagram)
        title = diagram.get('title') or extract_topic(payload.prompt)
        return {
            'title': title,
            'message': diagram.get('message') or 'Đã tạo cập nhật cho sơ đồ hiện tại.',
            'diagram': diagram,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Không thể tạo cập nhật AI: {exc}') from exc

