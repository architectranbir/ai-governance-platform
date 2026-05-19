from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Engineering Standards Chatbot API",
    description="Backend API for an enterprise engineering standards assistant.",
    version="1.0.0"
)

class ChatRequest(BaseModel):
    question: str

@app.get("/")
def root():
    return {"message": "Engineering Standards Chatbot API is running"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/chat")
def chat(request: ChatRequest):
    return {
        "question": request.question,
        "answer": "This is a placeholder response. Later this API will retrieve engineering standards from Azure AI Search and generate a grounded answer using Azure AI Foundry."
    }
