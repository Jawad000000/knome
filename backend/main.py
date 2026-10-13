
import os
import json
import uuid
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import AsyncGroq
from fastapi.responses import StreamingResponse
from database import async_session
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prompt import build_system_prompt
from profile import CandidateProfile
from database import get_session, init_db, engine
from models import Conversation, Message

load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

if not my_api_key:
    raise ValueError("GROQ_API_KEY is missing! Check backend/.env.")

client = AsyncGroq(api_key=my_api_key)
model = "qwen/qwen3.8-27b"

BASE_DIR = Path(__file__).parent
candidate_path = BASE_DIR / "candidate.json"

with open(candidate_path, "r", encoding="utf-8") as file:
    data = json.load(file)

valid_data = CandidateProfile(**data)
candidate_data = valid_data.model_dump(mode="json")
system_message = build_system_prompt(candidate_data)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestModel(BaseModel):
    message: str
    session_id: str | None = None

@app.on_event("startup")
async def startup():
    await init_db()

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(
    request: RequestModel,
    session: AsyncSession = Depends(get_session),
):
    # 1. Identify or create the conversation
    session_id = request.session_id or str(uuid.uuid4())

    result = await session.execute(
        select(Conversation).where(
            Conversation.session_id == session_id
        )
    )
    conversation = result.scalar_one_or_none()

    if conversation is None:
        conversation = Conversation(session_id=session_id)
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

    # 2. Retrieve previous messages, oldest first
    result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at, Message.id)
    )
    previous_messages = result.scalars().all()

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in previous_messages
    ]

    # 3. Save the recruiter's question
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    session.add(user_message)
    await session.commit()

    # 4. Include previous history and the new question
    messages = [
        {"role": "system", "content": system_message},
        *history,
        {"role": "user", "content": request.message},
    ]

    # 5. Generate the answer
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
        )
        answer = response.choices[0].message.content

        if answer is None:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response.",
            )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate an AI response.",
        ) from exc

    # 6. Save the AI response
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
    )
    session.add(assistant_message)
    await session.commit()

    # 7. Return the answer and conversation ID
    return {
        "session_id": session_id,
        "message": request.message,
        "reply": answer,
    }

