# Enterprise Engineering AI Assistant

An enterprise-grade RAG-based AI assistant built on Microsoft Azure to answer engineering standards, GitHub governance, CI/CD, IaC, and deployment-related questions using grounded enterprise knowledge.

## What This Solution Does

This chatbot allows users to ask questions through a web interface and receive accurate, context-aware answers generated from an indexed enterprise knowledge base.

The solution follows a Retrieval-Augmented Generation pattern, where the system first retrieves relevant content from Azure AI Search and then uses Azure OpenAI to generate a grounded response with citations.

## Key Features

- Web-based AI assistant interface
- Azure Static Web Apps frontend
- FastAPI backend hosted on Azure Container Apps
- Azure AI Search for retrieval and indexing
- Azure OpenAI model deployment through Microsoft Foundry
- Managed Identity authentication with no API keys
- Citation-backed responses
- Dynamic chat history
- Clean enterprise-style user interface
- Observability support through Azure Monitor and Application Insights

## Architecture Overview

<img width="1600" height="983" alt="image" src="https://github.com/user-attachments/assets/7bd6daf9-ae3e-4a3c-81f4-682c147b718b" />

The solution uses the following Azure services:

| Layer | Service |
|---|---|
| Frontend | Azure Static Web Apps |
| Backend API | Azure Container Apps with FastAPI |
| Retrieval | Azure AI Search |
| Knowledge Source | Azure Blob Storage |
| AI Model | Azure OpenAI model deployment |
| Identity | Managed Identity |
| Monitoring | Azure Monitor / Application Insights |

## Request Flow

1. User submits a question from the web UI.
2. Azure Static Web App sends the request to the FastAPI backend.
3. Backend queries Azure AI Search for relevant document chunks.
4. Azure AI Search returns the most relevant context.
5. Backend builds a grounded prompt using the retrieved content.
6. Azure OpenAI generates the final response.
7. Backend returns the answer with citations.
8. UI displays the response to the user.

## Security

This solution uses Azure Managed Identity for secure service-to-service authentication.  
No API keys are stored in the application code.

Managed Identity is used by the backend to securely access:

- Azure AI Search
- Azure OpenAI model deployment

## RAG Implementation

The backend follows a simple RAG flow:

```text
User Question
→ FastAPI Backend
→ Azure AI Search
→ Relevant Context
→ Azure OpenAI
→ Grounded Answer with Citations
