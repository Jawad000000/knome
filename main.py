import os
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI
from pydantic import BaseModel
from prompt import build_system_prompt
from profile import CandidateProfile
import json
from pathlib import Path

load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")

if not my_api_key:
    raise ValueError("GROQ_API_KEY is missing! Check your backend/.env file.")

client = Groq(api_key=my_api_key)
model="qwen/qwen3.8-27b"

BASE_DIR = Path(__file__).parent
candidate_path = BASE_DIR / "candidate.json"

try:
    with open(candidate_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    print('JSON is valid')

except (FileNotFoundError , json.JSONDecodeError):
    raise

valid_Data= CandidateProfile(**data)
candidate_data = valid_Data.model_dump(mode="json")

system_message = build_system_prompt(candidate_data)

app= FastAPI()

class RequestModel(BaseModel):
    message:str

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/chat")
def chat(request:RequestModel):

    system_prompt={
        "role":"system",
        "content":system_message
    }
    prompt={
        "role":"user",
        "content":request.message
    }
    messages=[system_prompt,prompt]

    response=client.chat.completions.create(model=model, messages=messages)
    answer = response.choices[0].message.content
    return {
        "message":request.message,
        "reply":answer
    }


