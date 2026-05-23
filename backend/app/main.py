# Enterprise RAG backend that retrieves engineering standards from Azure AI Search using Managed Identity and generates grounded, citation-backed responses with Azure OpenAI.

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
    description="Enterprise-grade RAG AI assistant powered by Azure AI Search and Azure OpenAI with grounded enterprise citations.",
    version="3.0.0"
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
# AI SEARCH CLIENT
# =========================

search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=INDEX_NAME,
    credential=credential
)

# =========================
# OPENAI TOKEN PROVIDER
# =========================

token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

# =========================
# OPENAI CLIENT
# =========================

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

@app.get("/")
def root():
    return {
        "message": "Enterprise Engineering AI Assistant API is running"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }

# =========================
# CHAT ENDPOINT
# =========================

@app.post("/api/chat")
def chat(req: ChatRequest):

    try:

        logging.info(f"Incoming question: {req.question}")

        # =========================
        # 1. RETRIEVE DOCUMENTS (RAG)
        # =========================

        results = search_client.search(
            search_text=req.question,
            top=TOP_K
        )

        context = ""
        citations = []

        for i, r in enumerate(results):

            chunk = r.get("chunk")
            title = r.get("title") or "Unknown Document"

            # Optional future enterprise metadata
            section = r.get("section") or "General"
            page = r.get("page_number") or "N/A"

            if chunk:

                context += f"""
Document: {title}
Section: {section}
Page: {page}

Content:
{chunk}

==================================================
"""

                citations.append({
                    "document": title,
                    "section": section,
                    "page": page
                })

        # =========================
        # 2. NO CONTEXT SAFETY
        # =========================

        if not context:

            return {
                "answer": "I could not find this information in the engineering standards knowledge base.",
                "citations": []
            }

        # =========================
        # 3. ENTERPRISE SYSTEM PROMPT
        # =========================

        system_prompt = f"""
You are an Enterprise Engineering AI Assistant.

Your responsibility is to answer engineering governance, GitHub standards,
Azure DevOps, infrastructure, security, and enterprise architecture questions.

STRICT RULES:
- Answer ONLY from the provided context
- NEVER hallucinate
- NEVER invent standards or policies
- If information is missing, say:
  'I could not find this information in the engineering standards knowledge base.'

RESPONSE RULES:
- Keep responses concise
- Keep responses enterprise-professional
- Use bullet points when appropriate
- Use technically accurate terminology
- Use audit-friendly wording

CITATION RULES:
- ALWAYS include citations
- NEVER use:
  (Source 1), (Source 2)

- ALWAYS use enterprise citations like:
  [Document: EWT GitHub Standards | Section: Branch Protection | Page: 12]

- Only cite documents actually present in the provided context

CONTEXT:
{context}
"""

        # =========================
        # 4. GPT CALL
        # =========================

        response = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": req.question
                }
            ],
            temperature=0.2,
            max_tokens=1200
        )

        answer = response.choices[0].message.content

        # =========================
        # 5. FINAL RESPONSE
        # =========================

        return {
            "question": req.question,
            "answer": answer,
            "citations": citations
        }

    except Exception as e:

        logging.error(f"Error while processing request: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error while processing request"
        )