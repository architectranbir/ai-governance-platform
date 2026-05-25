# Enterprise Engineering AI Assistant

An enterprise-grade Retrieval-Augmented Generation (RAG) AI assistant built on Microsoft Azure to deliver accurate, grounded responses for engineering standards, GitHub governance, CI/CD practices, Infrastructure as Code (IaC), and deployment policies.

---

## What This Solution Does

This solution enables developers, architects, and DevOps engineers to query internal engineering standards through a web-based interface and receive precise, context-aware responses.

It follows a **Retrieval-Augmented Generation (RAG)** pattern, where relevant enterprise content is first retrieved from a knowledge base and then used by an AI model to generate grounded responses with citations.

---

## Key Features

- Web-based AI assistant interface  
- Frontend hosted on Azure Static Web Apps  
- Backend API built using FastAPI and hosted on Azure Container Apps  
- Azure AI Search for document indexing and retrieval  
- Azure OpenAI (LLM Deployment via Microsoft Foundry) for response generation  
- Hybrid search support (keyword + vector + semantic ranking)  
- Distributed caching using Azure Managed Redis  
- Managed Identity authentication (no API keys in code)  
- Citation-backed grounded responses  
- Dynamic session-based chat history  
- Clean enterprise-grade user interface  
- Observability with Azure Monitor and Application Insights  

---

## Architecture Overview

The solution is designed using a layered enterprise architecture:

<img width="1535" height="1024" alt="image" src="https://github.com/user-attachments/assets/b51b10f9-aa0f-4f5f-b40d-d2e27344bd44" />


1. **User Interaction Layer** – Internal users access the assistant via browser  
2. **Frontend Layer** – Azure Static Web Apps hosts the web UI  
3. **Application Layer** – Azure Container Apps runs the FastAPI-based RAG orchestration layer  
4. **Distributed Cache Layer** – Azure Managed Redis provides low-latency caching  
5. **Retrieval Layer** – Azure AI Search performs hybrid search (keyword + vector + semantic)  
6. **AI / LLM Layer** – Azure OpenAI generates grounded responses  
7. **Knowledge Source Layer** – Azure Blob Storage stores enterprise documents  

---

## Azure Services Used

| Layer | Service |
|------|--------|
| Frontend | Azure Static Web Apps |
| Backend API | Azure Container Apps (FastAPI) |
| Distributed Cache | Azure Managed Redis |
| Retrieval | Azure AI Search (Hybrid Search) |
| Knowledge Source | Azure Blob Storage |
| AI / LLM | Azure OpenAI (LLM Deployment via Foundry) |
| Identity | Managed Identity |
| Monitoring | Azure Monitor & Application Insights |

---

## Request Flow

<img width="2234" height="1486" alt="image" src="https://github.com/user-attachments/assets/3398e315-bb40-4f81-96d5-330119a54ed2" />


1. User submits a question via the web UI  
2. Frontend sends request to `/api/chat`  
3. Backend receives and processes the request  
4. Redis cache is checked for existing response  
5. If cache HIT → response returned immediately  
6. If cache MISS → continue retrieval  
7. Azure AI Search retrieves relevant context using hybrid search  
8. Backend constructs a grounded prompt  
9. Azure OpenAI generates a response using retrieved context  
10. Response is cached in Redis (cost + latency optimization)  
11. Final response is returned to the UI with citations  

---

## Search Capabilities

The solution supports advanced enterprise retrieval patterns:

- **Keyword Search** – Traditional text-based matching  
- **Vector Search** – Semantic similarity using embeddings  
- **Semantic Ranking** – Context-aware ranking for better relevance  
- **Hybrid Search** – Combines keyword, vector, and semantic ranking for optimal results  

---

## Security

This solution uses **Azure Managed Identity** for secure, passwordless authentication.

- No API keys stored in application code  
- Secure access to Azure AI Search  
- Secure access to Azure OpenAI  
- Secure access to Azure Managed Redis  

This aligns with enterprise security and compliance standards.

---

## Caching Strategy

Azure Managed Redis is used as a distributed cache layer:

- Reduces repeated LLM and retrieval calls (cost + latency optimization)  
- Improves response time for frequently asked queries  
- Enables scalable and high-performance architecture  

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
