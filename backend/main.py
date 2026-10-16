import asyncio
import os
import json
import uuid
from pathlib import Path

from dotenv import load_dotenv
from groq import AsyncGroq
from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session, get_session, init_db, engine
from models import Conversation, Message
from prompt import build_system_prompt
from profile import CandidateProfile


# --------------------------------------------------
# Environment configuration
# --------------------------------------------------

load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

if not my_api_key:
    raise ValueError("GROQ_API_KEY is missing!")

client = AsyncGroq(api_key=my_api_key)

model = "qwen/qwen3.8-27b"


# --------------------------------------------------
# Load candidate profile
# --------------------------------------------------

BASE_DIR = Path(__file__).parent
candidate_path = BASE_DIR / "candidate.json"

with open(candidate_path, "r", encoding="utf-8") as file:
    data = json.load(file)

valid_data = CandidateProfile(**data)
candidate_data = valid_data.model_dump(mode="json")

system_message = build_system_prompt(candidate_data)


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(title="knome API")


# --------------------------------------------------
# CORS configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://knome-theta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request model
# --------------------------------------------------

class RequestModel(BaseModel):
    message: str
    session_id: str | None = None


# --------------------------------------------------
# Application lifecycle
# --------------------------------------------------

@app.on_event("startup")
async def startup():
    await init_db()


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# --------------------------------------------------
# Chat endpoint
# --------------------------------------------------

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

    # 2. Retrieve previous messages
    result = await session.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation.id
        )
        .order_by(Message.created_at, Message.id)
    )

    previous_messages = result.scalars().all()

    history = [
        {
            "role": msg.role,
            "content": msg.content,
        }
        for msg in previous_messages
    ]

    # 3. Save the user's message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )

    session.add(user_message)
    await session.commit()

    # 4. Construct the LLM messages
    messages = [
        {
            "role": "system",
            "content": system_message,
        },
        *history,
        {
            "role": "user",
            "content": request.message,
        },
    ]

    # 5. Generate the AI response
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

    # 6. Save the assistant's response
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
    )

    session.add(assistant_message)
    await session.commit()

    # 7. Return the response
    return {
        "session_id": session_id,
        "message": request.message,
        "reply": answer,
    }


# --------------------------------------------------
# Streaming chat endpoint (SSE)
# --------------------------------------------------

@app.post("/chat/stream")
async def chat_stream(request: RequestModel):
    async def event_generator():
        try:
            async with async_session() as session:
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

                # Send session_id immediately so frontend can sync state
                yield f"data: {json.dumps({'event': 'session', 'session_id': session_id})}\n\n"

                # 2. Retrieve previous messages for LLM context
                result = await session.execute(
                    select(Message)
                    .where(
                        Message.conversation_id == conversation.id
                    )
                    .order_by(Message.created_at, Message.id)
                )

                previous_messages = result.scalars().all()

                history = [
                    {
                        "role": msg.role,
                        "content": msg.content,
                    }
                    for msg in previous_messages
                ]

                # 3. Save the user's message before generation
                user_message = Message(
                    conversation_id=conversation.id,
                    role="user",
                    content=request.message,
                )

                session.add(user_message)
                await session.commit()

                # 4. Construct LLM message list
                llm_messages = [
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    *history,
                    {
                        "role": "user",
                        "content": request.message,
                    },
                ]

                # 5. Call Groq with stream=True
                stream = await client.chat.completions.create(
                    model=model,
                    messages=llm_messages,
                    stream=True,
                )

                full_reply_parts = []
                async for chunk in stream:
                    delta = (
                        chunk.choices[0].delta.content
                        if chunk.choices and chunk.choices[0].delta
                        else None
                    )
                    if delta:
                        full_reply_parts.append(delta)
                        yield f"data: {json.dumps({'event': 'delta', 'delta': delta})}\n\n"

                full_reply = "".join(full_reply_parts)

                if not full_reply:
                    yield f"data: {json.dumps({'event': 'error', 'error': 'The AI returned an empty response.'})}\n\n"
                    return

                # 6. Save complete assistant response to database
                assistant_message = Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=full_reply,
                )

                session.add(assistant_message)
                await session.commit()

                # 7. Notify client that stream is finished
                yield f"data: {json.dumps({'event': 'done', 'session_id': session_id})}\n\n"

        except asyncio.CancelledError:
            # Client disconnected early
            return

        except Exception as exc:
            yield f"data: {json.dumps({'event': 'error', 'error': str(exc) or 'Failed to generate AI streaming response.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )