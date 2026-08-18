# InvoiceGuard AI — System Architecture

## 1. Executive Summary

**InvoiceGuard AI** is an enterprise-grade, explainable multi-agent finance operations platform. It autonomously processes incoming invoices and expense receipts, extracts structured data using Amazon Bedrock (`qwen.qwen3-vl-235b-a22b`), performs mathematical validation, matches transactions against Purchase Orders, enforces configurable corporate expense policies, detects duplicates and spend anomalies, calculates a calibrated composite risk score (0–100), and routes each transaction to:

- `AUTO_APPROVE` (Straight-through automation)
- `HUMAN_REVIEW` (Prioritized Human-in-the-Loop review queue)
- `BLOCK` (Automated halting of high-risk / duplicate payments)

---

## 2. Architectural Blueprint

```text
                        CLIENT BROWSER
                     (React + TypeScript)
                              │
                              ▼
                     ┌───────────────────┐
                     │  FastAPI Backend  │
                     │  (Async REST API) │
                     └─────────┬─────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   Document Service    │             │   LangGraph Engine    │
│ (MIME, PDF Rendering) │             │  (Multi-Agent Graph)  │
└───────────────────────┘             └───────────┬───────────┘
                                                  │
 ┌────────────────────────────────────────────────┼────────────────────────────────────────┐
 │                                                │                                        │
 ▼                                                ▼                                        ▼
┌──────────────────┐                    ┌──────────────────┐                     ┌──────────────────┐
│  Document Agent  │                    │ Validation Agent │                     │ PO Match Agent   │
│  (Bedrock Qwen3) │                    │ (Python Math)    │                     │ (3-Way Match)    │
└────────┬─────────┘                    └──────────────────┘                     └──────────────────┘
         │                                        │                                        │
         └────────────────────────────────────────┼────────────────────────────────────────┘
                                                  ▼
                                       ┌──────────────────────┐
                                       │     Policy Agent     │
                                       │ (Configurable Rules) │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │    Anomaly Agent     │
                                       │(Duplicates & Outliers│
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │     Risk Engine      │
                                       │  (0-100 Score Model) │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │   Decision Engine    │
                                       │ (Confidence-Aware)   │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │  Explanation Agent   │
                                       │(Factual AI Summary)  │
                                       └──────────┬───────────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────────┐
                        ▼                         ▼                         ▼
                 ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
                 │ AUTO_APPROVE │          │ HUMAN_REVIEW │          │    BLOCK     │
                 └──────────────┘          └──────┬───────┘          └──────────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │   HITL Review UI     │
                                       │  (Approve / Reject)  │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │     PostgreSQL /     │
                                       │   SQLite Database    │
                                       └──────────────────────┘
```

---

## 3. Technology Stack

### Backend
- **Framework:** Python 3.11, FastAPI (Asynchronous REST API)
- **Agent Orchestration:** LangGraph, LangChain Core
- **AI Runtime:** Amazon Bedrock Runtime (`boto3`)
- **Primary AI Model:** `qwen.qwen3-vl-235b-a22b`
- **Data Validation:** Pydantic v2
- **ORM & Database:** SQLAlchemy 2.0, PostgreSQL (with SQLite zero-config fallback)
- **Imaging & PDF:** Pillow, PyMuPDF / pypdfium2

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS (Enterprise Dark Palette)
- **Routing:** React Router v6
- **Visualizations:** Recharts (Donut charts, vertical breakdown bars)
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## 4. Key Architectural Design Principles

1. **AI Interprets, Python Calculates:**
   The vision model extracts visual data and provides semantic similarity; deterministic Python arithmetic validates `subtotal + tax == total`, percentage deviations, and approval thresholds.
2. **Confidence-Aware HITL:**
   Even if mathematical risk is low, if the multimodal model's extraction confidence for a critical financial field is below 75%, the invoice automatically escalates to a human reviewer.
3. **Resilient Offline Fallback (`DEMO_MODE=true`):**
   The application seamlessly transitions between Amazon Bedrock and deterministic high-fidelity mock generators so evaluators can run the full UI and multi-agent workflow even without live cloud credentials.
