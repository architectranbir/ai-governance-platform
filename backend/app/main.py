from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from openai import AzureOpenAI

# =========================
# APP + LOGGING
# =========================

app = FastAPI(
    title="Enterprise Engineering AI Assistant",
    version="2.0.0"
)

logging.basicConfig(level=logging.INFO)

# =========================
# CONFIG
# =========================

SEARCH_ENDPOINT = "https://srch-eng-std-chatbot-dev.search.windows.net"
INDEX_NAME = "rag-1779537879070"

AZURE_OPENAI_ENDPOINT = "https://ranbir-9548-resource.openai.azure.com"
CHAT_MODEL = "gpt-4.1-mini"

TOP_K = 5

# =========================
# AUTH (Managed Identity)
# =========================

credential = DefaultAzureCredential()

# =========================
# SEARCH CLIENT
# =========================

search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=INDEX_NAME,
    credential=credential
)

# =========================
# OPENAI CLIENT
# =========================

token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

openai_client = AzureOpenAI(
    api_version="2024-05-01-preview",
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    azure_ad_token_provider=token_provider
)

# =========================
# REQUEST MODEL
# =========================

class ChatRequest(BaseModel):
    question: str

# =========================
# HEALTH CHECK
# =========================

@app.get("/api/health")
def health():
    return {"status": "healthy"}

# =========================
# CHAT ENDPOINT
# =========================

@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        logging.info(f"Incoming question: {req.question}")

        # =========================
        # 1. RETRIEVE (RAG)
        # =========================
        results = search_client.search(
            search_text=req.question,
            top=TOP_K
        )

        context = ""
        sources = []

        for i, r in enumerate(results):
            chunk = r.get("chunk")
            title = r.get("title") or "Unknown Document"

            if chunk:
                context += f"[Source {i+1}] {title}\n{chunk}\n\n"
                sources.append({
                    "source_id": f"Source {i+1}",
                    "title": title
                })

        # =========================
        # 2. SAFETY CHECK
        # =========================
        if not context:
            return {
                "answer": "I could not find this in the engineering standards knowledge base.",
                "sources": []
            }

        # =========================
        # 3. PROMPT (ENTERPRISE)
        # =========================
        system_prompt = f"""
You are an Enterprise Engineering AI Assistant.

STRICT RULES:
- Answer ONLY from the provided context
- Do NOT hallucinate
- If unsure → say you don't know
- Keep answer concise and professional
- ALWAYS include citations like (Source 1), (Source 2)

Context:
{context}
"""

        # =========================
        # 4. LLM CALL
        # =========================
        response = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ],
            temperature=0.2,
            max_tokens=800
        )

        answer = response.choices[0].message.content

        # =========================
        # 5. RESPONSE
        # =========================
        return {
            "answer": answer,
            "sources": sources
        }

    except Exception as e:
        logging.error(f"Error: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error while processing request"
        )