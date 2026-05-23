from fastapi import FastAPI
from pydantic import BaseModel

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from openai import AzureOpenAI

app = FastAPI()

# CONFIG
SEARCH_ENDPOINT = "https://srch-eng-std-chatbot-dev.search.windows.net"
INDEX_NAME = "rag-1779537879070"

AZURE_OPENAI_ENDPOINT = "https://ranbir-9548-resource.openai.azure.com"
CHAT_MODEL = "gpt-4.1-mini"

# Managed Identity
credential = DefaultAzureCredential()

# Search client
search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=INDEX_NAME,
    credential=credential
)

# OpenAI token
token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

# OpenAI client
openai_client = AzureOpenAI(
    api_version="2024-05-01-preview",
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    azure_ad_token_provider=token_provider
)

class ChatRequest(BaseModel):
    question: str

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/chat")
def chat(req: ChatRequest):

    results = search_client.search(
        search_text=req.question,
        top=3
    )

    context = ""
    for r in results:
        if "content" in r:
            context += r["content"] + "\n"

    system_prompt = f"""
You are an Enterprise Engineering AI Assistant.

Answer ONLY from the provided context.
If not found, say you don’t know.

Context:
{context}
"""

    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.question}
        ]
    )

    answer = response.choices[0].message.content

    return {"answer": answer}