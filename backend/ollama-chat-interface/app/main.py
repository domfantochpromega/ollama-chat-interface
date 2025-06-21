from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import uuid
import os
import aiofiles
from typing import Optional, List, Dict, Any
import mimetypes
from PIL import Image
import zipfile
import tempfile

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

conversations: Dict[str, List[Dict[str, Any]]] = {}
file_storage: Dict[str, Dict[str, Any]] = {}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    model: str = "llama3.2"
    temperature: Optional[float] = None
    context: Optional[List[int]] = None
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    context: Optional[List[int]] = None

async def call_ollama(prompt: str, model: str = "llama3.2", context: Optional[List[int]] = None, temperature: Optional[float] = None, url: Optional[str] = None, stream: bool = False) -> Dict[str, Any]:
    """Call Ollama API exactly like the PHP function"""
    if url is None:
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        url = f"{ollama_base_url}/api/generate"
    
    data = {
        "model": model,
        "prompt": prompt,
        "stream": stream
    }
    
    if context:
        data["context"] = context
    
    if temperature is not None:
        data["options"] = {"temperature": temperature}
    
    try:
        headers = {"Content-Type": "application/json"}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            if stream:
                text = ""
                for line in response.text.strip().split("\n"):
                    if line.strip():
                        try:
                            json_data = json.loads(line)
                            text += json_data.get("response", "")
                        except json.JSONDecodeError:
                            continue
                return {"response": text}
            else:
                result = response.json()
                return result
                
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to Ollama: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Ollama API error: {str(e)}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON response from Ollama: {str(e)}")

def extract_text_from_file(file_path: str, filename: str) -> str:
    """Extract text content from various file types"""
    try:
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        if mime_type.startswith('text/') or filename.endswith(('.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml')):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if len(content) > 10000:
                        content = content[:10000] + "\n... (content truncated)"
                    return f"Text file '{filename}' content:\n{content}"
            except Exception:
                return f"Text file '{filename}' (unable to read as text)"
        
        elif mime_type.startswith('image/') or filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
            try:
                with Image.open(file_path) as img:
                    return f"Image file '{filename}': {img.format} format, size {img.size[0]}x{img.size[1]} pixels, mode {img.mode}"
            except Exception:
                return f"Image file '{filename}' (unable to read image details)"
        
        elif mime_type == 'application/zip' or filename.lower().endswith('.zip'):
            try:
                with zipfile.ZipFile(file_path, 'r') as zip_file:
                    file_list = zip_file.namelist()
                    return f"ZIP file '{filename}' contains {len(file_list)} files:\n" + "\n".join(file_list[:50])
            except Exception:
                return f"ZIP file '{filename}' (unable to read contents)"
        
        elif mime_type.startswith('audio/') or filename.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a', '.flac')):
            file_size = os.path.getsize(file_path)
            return f"Audio file '{filename}': {mime_type} format, size: {file_size} bytes"
        
        elif mime_type.startswith('video/') or filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
            file_size = os.path.getsize(file_path)
            return f"Video file '{filename}': {mime_type} format, size: {file_size} bytes"
        
        else:
            file_size = os.path.getsize(file_path)
            return f"File '{filename}': {mime_type} format, size: {file_size} bytes (binary content not displayed)"
            
    except Exception as e:
        return f"File '{filename}': Error reading file - {str(e)}"

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Send a message to Ollama and get response"""
    conversation_id = message.conversation_id or str(uuid.uuid4())
    
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    conversation = conversations[conversation_id]
    
    prompt = message.message
    if conversation:
        history = "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}" 
            for msg in conversation[-5:]  # Last 5 exchanges
        ])
        prompt = f"Previous conversation:\n{history}\n\nUser: {message.message}\nAssistant:"
    
    result = await call_ollama(
        prompt=prompt,
        model=message.model,
        context=message.context,
        temperature=message.temperature,
        stream=message.stream
    )
    
    response_text = result.get("response", "")
    context = result.get("context", [])
    
    conversation.append({
        "user": message.message,
        "assistant": response_text
    })
    
    return ChatResponse(
        response=response_text,
        conversation_id=conversation_id,
        context=context
    )

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    extracted_content = extract_text_from_file(file_path, file.filename)
    
    file_storage[file_id] = {
        "filename": file.filename,
        "file_path": file_path,
        "content": extracted_content,
        "size": len(content),
        "mime_type": mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    }
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "content": extracted_content,
        "size": len(content)
    }

@app.post("/api/chat-with-files", response_model=ChatResponse)
async def chat_with_files(
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    file_ids: Optional[str] = Form(None),
    model: str = Form("llama3.2"),
    temperature: Optional[float] = Form(None),
    stream: bool = Form(False)
):
    """Send a message with file context to Ollama"""
    conversation_id = conversation_id or str(uuid.uuid4())
    
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    conversation = conversations[conversation_id]
    
    prompt = message
    
    if file_ids:
        file_id_list = [fid.strip() for fid in file_ids.split(",") if fid.strip()]
        file_contents = []
        
        for file_id in file_id_list:
            if file_id in file_storage:
                file_info = file_storage[file_id]
                file_contents.append(f"File: {file_info['filename']}\n{file_info['content']}")
        
        if file_contents:
            prompt = f"Files provided:\n\n{chr(10).join(file_contents)}\n\nUser question: {message}"
    
    if conversation:
        history = "\n".join([
            f"User: {msg['user']}\nAssistant: {msg['assistant']}" 
            for msg in conversation[-5:]
        ])
        prompt = f"Previous conversation:\n{history}\n\n{prompt}\n\nAssistant:"
    
    result = await call_ollama(
        prompt=prompt,
        model=model,
        temperature=temperature,
        stream=stream
    )
    
    response_text = result.get("response", "")
    context = result.get("context", [])
    
    conversation.append({
        "user": message,
        "assistant": response_text
    })
    
    return ChatResponse(
        response=response_text,
        conversation_id=conversation_id,
        context=context
    )

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id]
    }

@app.get("/api/files/{file_id}")
async def get_file_info(file_id: str):
    """Get file information"""
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = file_storage[file_id]
    return {
        "file_id": file_id,
        "filename": file_info["filename"],
        "content": file_info["content"],
        "size": file_info["size"],
        "mime_type": file_info["mime_type"]
    }
