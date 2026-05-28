# Enterprise Engineering AI Assistant

An enterprise-grade Retrieval-Augmented Generation (RAG) AI assistant built on Microsoft Azure to deliver accurate, grounded responses for engineering standards, GitHub governance, CI/CD practices, Infrastructure as Code (IaC), and deployment policies.

---

## What This Solution Does

This solution enables developers, architects, and DevOps engineers to query internal engineering standards through a web-based interface and receive precise, context-aware responses.

It follows a **Retrieval-Augmented Generation (RAG)** pattern, where relevant enterprise content is first retrieved from a knowledge base and then used by an AI model to generate grounded responses with citations.

---
## Key Features

- Web-based AI assistant interface.
- Frontend hosted on Azure Static Web Apps.
- Backend API built with FastAPI and hosted on Azure Container Apps.
- Azure AI Search for document indexing and retrieval.
- Azure OpenAI (LLM deployment via Microsoft Foundry) for response generation.
- Hybrid search support: keyword + vector + semantic ranking.
- Distributed caching using Azure Managed Redis.
- Managed Identity authentication with role-based access control.
- Citation-backed grounded responses.
- Dynamic session-based chat history.
- Clean enterprise-grade user interface.
- Observability with Azure Monitor and Application Insights.

---

## Architecture Overview

The solution is designed using a layered enterprise architecture:

![Enterprise Engineering AI Assistant Architecture](https://github.com/user-attachments/assets/b51b10f9-aa0f-4f5f-b40d-d2e27344bd44)

1. **User Interaction Layer** – Internal users access the assistant via browser.
2. **Frontend Layer** – Azure Static Web Apps hosts the web UI.
3. **Application Layer** – Azure Container Apps runs the FastAPI-based RAG orchestration layer.
4. **Distributed Cache Layer** – Azure Managed Redis provides low-latency caching.
5. **Retrieval Layer** – Azure AI Search performs hybrid search (keyword + vector + semantic).
6. **AI / LLM Layer** – Azure OpenAI generates grounded responses.
7. **Knowledge Source Layer** – Azure Blob Storage stores enterprise documents.

---

## Azure Services Used

| Layer | Service |
|---|---|
| Frontend | Azure Static Web Apps |
| Backend API | Azure Container Apps (FastAPI) |
| Distributed Cache | Azure Managed Redis |
| Retrieval | Azure AI Search (Hybrid Search) |
| Knowledge Source | Azure Blob Storage |
| AI / LLM | Azure OpenAI (LLM deployment via Foundry) |
| Identity | Managed Identity |
| Monitoring | Azure Monitor & Application Insights |

---

## Request Flow

1. User submits a question via the web UI.
2. Frontend sends request to `/api/chat`.
3. Backend receives and processes the request.
4. Redis cache is checked for an existing response.
5. If cache HIT, the response is returned immediately.
6. If cache MISS, retrieval continues.
7. Azure AI Search retrieves relevant context using hybrid search.
8. Backend constructs a grounded prompt.
9. Azure OpenAI generates a response using the retrieved context.
10. Response is cached in Redis for cost and latency optimization.
11. Final response is returned to the UI with citations.

---

## Search Capabilities

The solution supports advanced enterprise retrieval patterns:

- **Keyword Search** – Traditional text-based matching.
- **Vector Search** – Semantic similarity using embeddings.
- **Semantic Ranking** – Context-aware ranking for better relevance.
- **Hybrid Search** – Combines keyword, vector, and semantic ranking for optimal results.

---

## Security and Identity

This solution uses **Managed Identity** for secure, passwordless authentication.

The backend container app uses role-based access control to reach downstream Azure services:

- **Backend container app -> Azure Blob Storage**: `Storage Blob Data Reader`
- **Backend container app -> Azure AI Search**: `Search Index Data Reader`
- **Backend container app -> Azure OpenAI / Foundry model endpoint**: `Cognitive Services OpenAI User`
- **Backend container app -> Azure Managed Redis**: managed identity-based authentication

Benefits:
- No API keys stored in application code.
- Secure access to Azure AI Search.
- Secure access to Azure OpenAI.
- Secure access to Azure Managed Redis.
- Easier auditability and enterprise governance.

---

## Caching Strategy

Azure Managed Redis is used as a distributed cache layer:

- Reduces repeated LLM and retrieval calls.
- Improves response time for frequently asked queries.
- Supports scalable and high-performance architecture.
- Acts as a shared cache for common engineering questions.

If the same question is asked again, the system can serve the response directly from Redis on a cache hit instead of calling the LLM again.

---

## Async Backend in Container Apps

The backend is implemented with **FastAPI async endpoints** and hosted on **Azure Container Apps**.

Why this matters:
- Most work in a RAG system is I/O-bound.
- Redis lookups, search calls, and model calls benefit from async handling.
- `async def` helps avoid blocking the event loop.
- The app can handle concurrent requests more efficiently.

This is especially useful for orchestration-heavy workloads like retrieval, prompt construction, and response generation.

---

## RAG Implementation

The backend implements a production-ready RAG pipeline:

```text
User Question
→ FastAPI (RAG Orchestration Layer)
→ Redis Cache (HIT / MISS)
→ Azure AI Search (Hybrid Retrieval)
→ Retrieved Context
→ Azure OpenAI (LLM Deployment)
→ Grounded Response with Citations
→ Redis Cache
→ UI Response
```

---

## Folder Structure

```text
.
├── app/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/
│   └── utils/
├── frontend/
├── infra/
├── data/
├── docs/
└── README.md
```

---

## What Makes This Enterprise-Ready

- Grounded responses with enterprise documents.
- Hybrid retrieval for better relevance.
- Redis caching for performance and cost optimization.
- Managed identity for secure service-to-service access.
- Async FastAPI backend for concurrent request handling.
- Azure-native monitoring and observability.

---

## Future Enhancements

This solution can be extended further with:

- API Management.
- Application Gateway / Front Door.
- Private endpoints and VNET integration.
- RBAC-trimmed retrieval.
- CI/CD pipelines.
- Multi-region resilience and disaster recovery.

---

## Getting Started

### Prerequisites

- Azure subscription.
- Azure Static Web Apps.
- Azure Container Apps environment.
- Azure AI Search.
- Azure OpenAI deployment.
- Azure Blob Storage.
- Azure Managed Redis.
- Microsoft Entra ID / Managed Identity configured.

### Run locally

```bash
git clone https://github.com/architectranbir/enterprise-rag-ai-assistant
cd enterprise-rag-ai-assistant
```

Follow the setup instructions in the repository to configure environment variables, Azure access, and local development dependencies.

---

## Project Repository

The reference implementation for this architecture is available here: [enterprise-rag-ai-assistant](https://github.com/architectranbir/enterprise-rag-ai-assistant).

---

## License

Add your preferred license here.

---

## Closing

This is not just a chatbot. It is a practical Azure-based foundation for building enterprise AI assistants that are grounded, scalable, secure, and usable in real engineering environments.

The biggest lesson is simple: do not stop at “LLM + prompt.” The real value comes from retrieval quality, caching, async orchestration, identity, and observability working together.
