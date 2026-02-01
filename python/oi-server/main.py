"""
Open Interpreter Server for Jawir OS
FastAPI wrapper around Open Interpreter with safety controls

Features:
- Execute prompts via REST API
- Require confirmation for dangerous actions
- Stream output in real-time via WebSocket
- Whitelist/blacklist commands
"""

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import uuid
from datetime import datetime
from enum import Enum

# Try to import interpreter
try:
    from interpreter import interpreter
    INTERPRETER_AVAILABLE = True
except ImportError:
    INTERPRETER_AVAILABLE = False
    print("⚠️ Open Interpreter not installed. Run: pip install open-interpreter")

app = FastAPI(
    title="Jawir OI Server",
    description="Open Interpreter API for Jawir OS",
    version="1.0.0"
)

# CORS for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ExecuteRequest(BaseModel):
    prompt: str
    auto_confirm: bool = False  # If true, skip confirmation for safe actions
    session_id: Optional[str] = None

class ConfirmRequest(BaseModel):
    action_id: str
    approved: bool
    
class ExecuteResponse(BaseModel):
    success: bool
    action_id: str
    status: str  # pending_confirmation, executing, completed, failed
    output: Optional[str] = None
    error: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.LOW
    requires_confirmation: bool = False
    action_description: Optional[str] = None

class StatusResponse(BaseModel):
    server: str
    interpreter_available: bool
    version: str
    pending_actions: int

# ============== STATE ==============

# Pending actions waiting for confirmation
pending_actions: dict = {}

# Action history
action_history: List[dict] = []

# ============== SAFETY ==============

# Keywords that indicate dangerous operations
DANGEROUS_KEYWORDS = [
    'rm -rf', 'del /f', 'format', 'shutdown', 'restart',
    'delete', 'remove', 'drop table', 'truncate',
    'kill', 'taskkill', 'pkill', 'sudo',
    'password', 'credential', 'secret', 'token',
    'registry', 'regedit', 'chmod 777',
]

MEDIUM_RISK_KEYWORDS = [
    'move', 'rename', 'copy', 'write', 'create',
    'install', 'pip install', 'npm install',
    'download', 'upload', 'send', 'post',
]

def assess_risk(prompt: str) -> RiskLevel:
    """Assess the risk level of a prompt"""
    prompt_lower = prompt.lower()
    
    for keyword in DANGEROUS_KEYWORDS:
        if keyword in prompt_lower:
            return RiskLevel.CRITICAL
    
    for keyword in MEDIUM_RISK_KEYWORDS:
        if keyword in prompt_lower:
            return RiskLevel.MEDIUM
    
    # File system operations
    if any(word in prompt_lower for word in ['file', 'folder', 'directory', 'path']):
        return RiskLevel.MEDIUM
    
    # Network operations
    if any(word in prompt_lower for word in ['http', 'api', 'request', 'fetch']):
        return RiskLevel.MEDIUM
    
    return RiskLevel.LOW

def requires_confirmation(risk: RiskLevel, auto_confirm: bool) -> bool:
    """Check if action requires user confirmation"""
    if risk == RiskLevel.CRITICAL:
        return True  # Always require confirmation
    if risk == RiskLevel.HIGH:
        return True
    if risk == RiskLevel.MEDIUM and not auto_confirm:
        return True
    return False

# ============== INTERPRETER SETUP ==============

def setup_interpreter():
    """Configure interpreter with safety settings"""
    if not INTERPRETER_AVAILABLE:
        return
    
    # SAFETY: Always require confirmation
    interpreter.auto_run = False
    
    # Use conversation history
    interpreter.conversation_history = True
    
    # Set system message
    interpreter.system_message = """
    You are Jawir's computer control assistant. You help users manage files,
    run applications, and automate tasks on their Windows computer.
    
    IMPORTANT SAFETY RULES:
    1. Never delete files without explicit confirmation
    2. Never run destructive commands (format, rm -rf, etc)
    3. Always explain what you're about to do before doing it
    4. If unsure, ask for clarification
    5. Prefer safe, reversible actions
    
    When searching for files, use PowerShell commands appropriate for Windows.
    When opening applications, use 'start' command or full paths.
    """
    
    print("✅ Open Interpreter configured with safety settings")

# ============== ENDPOINTS ==============

@app.get("/", response_model=StatusResponse)
async def get_status():
    """Get server status"""
    return StatusResponse(
        server="Jawir OI Server",
        interpreter_available=INTERPRETER_AVAILABLE,
        version="1.0.0",
        pending_actions=len(pending_actions)
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "interpreter": INTERPRETER_AVAILABLE}

@app.post("/execute", response_model=ExecuteResponse)
async def execute_prompt(request: ExecuteRequest):
    """Execute a prompt via Open Interpreter"""
    if not INTERPRETER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Open Interpreter not available. Install with: pip install open-interpreter"
        )
    
    action_id = str(uuid.uuid4())[:8]
    risk = assess_risk(request.prompt)
    needs_confirm = requires_confirmation(risk, request.auto_confirm)
    
    if needs_confirm:
        # Store pending action
        pending_actions[action_id] = {
            "prompt": request.prompt,
            "risk": risk,
            "created_at": datetime.now().isoformat(),
            "session_id": request.session_id,
        }
        
        return ExecuteResponse(
            success=True,
            action_id=action_id,
            status="pending_confirmation",
            requires_confirmation=True,
            risk_level=risk,
            action_description=f"Menjalankan: {request.prompt[:100]}..."
        )
    
    # Execute directly for low-risk actions
    try:
        output = await run_interpreter(request.prompt)
        
        # Log action
        action_history.append({
            "action_id": action_id,
            "prompt": request.prompt,
            "output": output,
            "risk": risk.value,
            "timestamp": datetime.now().isoformat(),
        })
        
        return ExecuteResponse(
            success=True,
            action_id=action_id,
            status="completed",
            output=output,
            risk_level=risk
        )
    except Exception as e:
        return ExecuteResponse(
            success=False,
            action_id=action_id,
            status="failed",
            error=str(e),
            risk_level=risk
        )

@app.post("/confirm", response_model=ExecuteResponse)
async def confirm_action(request: ConfirmRequest):
    """Confirm or reject a pending action"""
    if request.action_id not in pending_actions:
        raise HTTPException(status_code=404, detail="Action not found")
    
    action = pending_actions.pop(request.action_id)
    
    if not request.approved:
        return ExecuteResponse(
            success=True,
            action_id=request.action_id,
            status="cancelled",
            output="Action cancelled by user"
        )
    
    # Execute confirmed action
    try:
        output = await run_interpreter(action["prompt"])
        
        action_history.append({
            "action_id": request.action_id,
            "prompt": action["prompt"],
            "output": output,
            "risk": action["risk"].value,
            "confirmed": True,
            "timestamp": datetime.now().isoformat(),
        })
        
        return ExecuteResponse(
            success=True,
            action_id=request.action_id,
            status="completed",
            output=output
        )
    except Exception as e:
        return ExecuteResponse(
            success=False,
            action_id=request.action_id,
            status="failed",
            error=str(e)
        )

@app.get("/pending")
async def get_pending_actions():
    """Get list of pending actions"""
    return {"pending": pending_actions}

@app.get("/history")
async def get_action_history():
    """Get action history"""
    return {"history": action_history[-50:]}  # Last 50 actions

@app.delete("/pending/{action_id}")
async def cancel_pending_action(action_id: str):
    """Cancel a pending action"""
    if action_id in pending_actions:
        del pending_actions[action_id]
        return {"success": True, "message": "Action cancelled"}
    raise HTTPException(status_code=404, detail="Action not found")

# ============== INTERPRETER EXECUTION ==============

async def run_interpreter(prompt: str) -> str:
    """Run interpreter in async context"""
    if not INTERPRETER_AVAILABLE:
        return "Error: Interpreter not available"
    
    # Run in thread to not block
    loop = asyncio.get_event_loop()
    
    def execute():
        try:
            # Collect all output
            output_parts = []
            for chunk in interpreter.chat(prompt, stream=True, display=False):
                if isinstance(chunk, dict):
                    if 'content' in chunk:
                        output_parts.append(chunk['content'])
                    elif 'output' in chunk:
                        output_parts.append(chunk['output'])
                elif isinstance(chunk, str):
                    output_parts.append(chunk)
            return "\n".join(output_parts)
        except Exception as e:
            return f"Error: {str(e)}"
    
    result = await loop.run_in_executor(None, execute)
    return result

# ============== WEBSOCKET FOR STREAMING ==============

@app.websocket("/ws/execute")
async def websocket_execute(websocket: WebSocket):
    """WebSocket endpoint for streaming execution output"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            prompt = data.get("prompt", "")
            
            if not INTERPRETER_AVAILABLE:
                await websocket.send_json({
                    "type": "error",
                    "message": "Interpreter not available"
                })
                continue
            
            # Check risk
            risk = assess_risk(prompt)
            if risk in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                await websocket.send_json({
                    "type": "confirmation_required",
                    "risk": risk.value,
                    "prompt": prompt
                })
                
                # Wait for confirmation
                confirm_data = await websocket.receive_json()
                if not confirm_data.get("confirmed", False):
                    await websocket.send_json({
                        "type": "cancelled",
                        "message": "Action cancelled"
                    })
                    continue
            
            # Stream execution
            await websocket.send_json({"type": "start", "prompt": prompt})
            
            for chunk in interpreter.chat(prompt, stream=True, display=False):
                if isinstance(chunk, dict):
                    await websocket.send_json({
                        "type": "chunk",
                        "content": chunk.get('content', chunk.get('output', ''))
                    })
                elif isinstance(chunk, str):
                    await websocket.send_json({
                        "type": "chunk",
                        "content": chunk
                    })
            
            await websocket.send_json({"type": "complete"})
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()

# ============== STARTUP ==============

@app.on_event("startup")
async def startup():
    """Initialize on startup"""
    print("🚀 Jawir OI Server starting...")
    setup_interpreter()
    print(f"📡 Server ready at http://localhost:8765")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
