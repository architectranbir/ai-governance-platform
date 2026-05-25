# Enterprise RAG backend using Azure AI Search + Azure OpenAI with Managed Identity,
# supporting keyword search, semantic search, vector search, and hybrid search.

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
import uuid

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI

app = FastAPI(
    title="Enterprise Engineering AI Assistant",
    description="Production-grade RAG assistant with hybrid retrieval, grounded answers, deduplicated citations, and audit-ready metadata.",
    version="5.0.0"
)

logging.basicConfig(level=logging.INFO)

SEARCH_ENDPOINT = "https://srch-eng-std-chatbot-dev.search.windows.net"
INDEX_NAME = "rag-1779537879070"

AZURE_OPENAI_ENDPOINT = "https://ranbir-9548-resource.openai.azure.com"
CHAT_MODEL = "gpt-4.1-mini"
EMBEDDING_MODEL = "text-embedding-3-large"

TOP_K = 5
VECTOR_FIELD_NAME = "text_vector"

credential = DefaultAzureCredential()

search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT,
    index_name=INDEX_NAME,
    credential=credential
)

token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

openai_client = AzureOpenAI(
    api_version="2024-05-01-preview",
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    azure_ad_token_provider=token_provider
)

class ChatRequest(BaseModel):
    question: str
    search_mode: str = "hybrid"  # keyword | semantic | vector | hybrid

@app.get("/")
def root():
    return {"message": "Enterprise Engineering AI Assistant API is running"}

@app.get("/api/health")
def health():
    return {"status": "healthy"}

def generate_embedding(text: str):
    embedding_response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return embedding_response.data[0].embedding

def run_search(question: str, search_mode: str):
    mode = search_mode.lower().strip()

    if mode == "keyword":
        return search_client.search(
            search_text=question,
            top=TOP_K
        )

    if mode == "semantic":
        return search_client.search(
            search_text=question,
            query_type="semantic",
            semantic_configuration_name="default",
            top=TOP_K
        )

    if mode == "vector":
        query_vector = generate_embedding(question)

        vector_query = VectorizedQuery(
            vector=query_vector,
            k_nearest_neighbors=TOP_K,
            fields=VECTOR_FIELD_NAME
        )

        return search_client.search(
            search_text=None,
            vector_queries=[vector_query],
            top=TOP_K
        )

    # Default: hybrid search = keyword + vector + optional semantic ranking
    query_vector = generate_embedding(question)

    vector_query = VectorizedQuery(
        vector=query_vector,
        k_nearest_neighbors=TOP_K,
        fields=VECTOR_FIELD_NAME
    )

    return search_client.search(
        search_text=question,
        vector_queries=[vector_query],
        query_type="semantic",
        semantic_configuration_name="rag-1779537879070-semantic-configuration",
        top=TOP_K
    )

@app.post("/api/chat")
def chat(req: ChatRequest):
    request_id = str(uuid.uuid4())

    try:
        logging.info(
            f"request_id={request_id} | Incoming question: {req.question} | search_mode={req.search_mode}"
        )

        results = run_search(req.question, req.search_mode)

        context = ""
        citations = []
        seen_sources = set()

        for r in results:
            chunk = r.get("chunk")
            title = r.get("title") or "EWT Engineering Standards"
            section = r.get("section") or "Engineering Standards"
            score = r.get("@search.score")

            if chunk:
                context += f"""
[Source]
Document: {title}
Section: {section}
Relevance Score: {score}

Content:
{chunk}

---
"""

                source_key = f"{title}|{section}"

                if source_key not in seen_sources:
                    seen_sources.add(source_key)
                    citations.append({
                        "document": title,
                        "section": section,
                        "relevance_score": round(score, 3) if score else None
                    })

        if not context:
            return {
                "request_id": request_id,
                "question": req.question,
                "answer": "I could not find this information in the engineering standards knowledge base.",
                "citations": [],
                "metadata": {
                    "model": CHAT_MODEL,
                    "embedding_model": EMBEDDING_MODEL,
                    "search_index": INDEX_NAME,
                    "search_mode": req.search_mode,
                    "top_k": TOP_K
                }
            }

        system_prompt = f"""
You are an Enterprise Engineering AI Assistant.

STRICT RULES:
- Answer ONLY from the provided context.
- Do NOT hallucinate.
- Do NOT use external knowledge.
- If the answer is not found, say:
  "I could not find this information in the engineering standards knowledge base."

STYLE:
- Professional
- Concise
- Clear for engineering, audit, governance, and DevOps teams
- Use bullet points when helpful

CITATION RULES:
- Use clean enterprise citations only.
- Format citations like:
  [Document: <document> | Section: <section>]
- Do NOT expose chunk IDs, hashes, blob paths, or internal IDs.
- Do NOT use vague references like Source 1, Source 2, or Sources 1-5.
- Do NOT mention page numbers unless page metadata is explicitly available.
- Cite only documents present in the provided context.

CONTEXT:
{context}
"""

        response = openai_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ],
            temperature=0.1,
            max_tokens=1000
        )

        answer = response.choices[0].message.content

        return {
            "request_id": request_id,
            "question": req.question,
            "answer": answer,
            "citations": citations,
            "metadata": {
                "model": CHAT_MODEL,
                "embedding_model": EMBEDDING_MODEL,
                "search_index": INDEX_NAME,
                "search_mode": req.search_mode,
                "top_k": TOP_K
            }
        }

    except Exception as e:
        logging.error(f"request_id={request_id} | Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal Server Error"
        )