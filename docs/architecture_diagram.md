# InvoiceGuard AI — System Architecture & Workflow Diagram

This document outlines the end-to-end architecture of **InvoiceGuard AI**, an explainable multi-agent finance operations platform. It illustrates the interaction between the client dashboard, the asynchronous FastAPI gateway, the multimodal Amazon Bedrock foundation model (`qwen.qwen3-vl-235b-a22b`), the 8-agent LangGraph orchestration graph, and the persistent storage tier.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    %% ================= GLOBAL STYLES =================
    classDef client fill:#0F172A,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef gateway fill:#1E1B4B,stroke:#818CF8,stroke-width:2px,color:#F8FAFC;
    classDef bedrock fill:#311042,stroke:#C084FC,stroke-width:2px,color:#F8FAFC;
    classDef agent fill:#042F2E,stroke:#2DD4BF,stroke-width:2px,color:#F8FAFC;
    classDef engine fill:#1F2937,stroke:#9CA3AF,stroke-width:2px,color:#F8FAFC;
    classDef approve fill:#064E3B,stroke:#34D399,stroke-width:2px,color:#ECFDF5;
    classDef review fill:#451A03,stroke:#FBBF24,stroke-width:2px,color:#FFFBEB;
    classDef block fill:#450A0A,stroke:#F87171,stroke-width:2px,color:#FEF2F2;
    classDef db fill:#0F172A,stroke:#64748B,stroke-width:2px,color:#F8FAFC;

    %% ================= CLIENT TIER =================
    subgraph Presentation_Layer["1. Presentation Tier (React 18 + TypeScript)"]
        UI_DASH["Interactive Operations Dashboard<br/><i>(Live Metrics & Triage Queue)</i>"]:::client
        UI_HITL["Human-in-the-Loop Review Screen<br/><i>(Visual PDF Viewer & Side-by-Side Audit)</i>"]:::client
        UI_SIM["Policy Matrix Simulator<br/><i>(Threshold Tuning & What-If Sandbox)</i>"]:::client
    end

    %% ================= API GATEWAY TIER =================
    subgraph Ingestion_Layer["2. Gateway & Ingestion Tier (FastAPI + Python 3.11)"]
        API_GW["FastAPI Async REST Service<br/><code>/api/v1/invoices</code>"]:::gateway
        DOC_PROC["Document Preprocessing Service<br/><i>(PyMuPDF / Pillow / Base64 Encoder)</i>"]:::gateway
    end

    %% ================= AI & MULTI-AGENT LAYER =================
    subgraph AI_Agent_Layer["3. Multi-Agent LangGraph Core (8 Specialized Agents)"]
        BEDROCK["Amazon Bedrock Runtime<br/><b>qwen.qwen3-vl-235b-a22b</b>"]:::bedrock
        
        AG_DOC["1. Document Agent<br/><i>Multimodal Vision Extraction</i>"]:::agent
        AG_VAL["2. Validation Agent<br/><i>Deterministic Math & Schema Check</i>"]:::agent
        AG_PO["3. PO Match Agent<br/><i>3-Way Line-Item Reconciliation</i>"]:::agent
        AG_POL["4. Policy Agent<br/><i>Corporate Limit & Rules Engine</i>"]:::agent
        AG_ANO["5. Anomaly Agent<br/><i>Duplicate & Spike Detector</i>"]:::agent
        AG_RISK["6. Risk Engine<br/><i>0-100 Additive Score Model</i>"]:::engine
        AG_DEC["7. Decision Router<br/><i>Confidence-Aware Triage</i>"]:::engine
        AG_EXP["8. Explanation Agent<br/><i>Natural Language Audit Synthesis</i>"]:::bedrock
    end

    %% ================= ROUTING & OUTCOMES =================
    subgraph Decision_Tier["4. Automated Triage & Governance"]
        OUT_APPROVE["AUTO_APPROVE<br/><b>Straight-Through Processing</b><br/><i>(Risk < 35, Variance ≤ 5%, Conf ≥ 75%)</i>"]:::approve
        OUT_REVIEW["HUMAN_REVIEW<br/><b>Prioritized Review Queue</b><br/><i>(Risk 35-70, Variance > 5%, Conf < 75%)</i>"]:::review
        OUT_BLOCK["BLOCK<br/><b>Payment Halted</b><br/><i>(Risk > 70, Duplicate Conf ≥ 85%)</i>"]:::block
    end

    %% ================= PERSISTENCE TIER =================
    subgraph Persistence_Layer["5. Data & Audit Tier (SQLAlchemy 2.0)"]
        DB_MAIN[("Primary Database<br/>PostgreSQL / SQLite Fallback<br/><i>(Invoices, Line Items, POs, Policies)</i>")]:::db
        AUDIT_LOG[("Immutable Audit Trail<br/><i>(Agent Timestamps, Latencies, Evidence)</i>")]:::db
    end

    %% ================= CONNECTIONS =================
    UI_DASH -->|"Upload PDF / Image"| API_GW
    UI_SIM -->|"Update Policies / Test Scenarios"| API_GW
    UI_HITL -->|"Manual Override (Approve / Reject)"| API_GW

    API_GW -->|"Sanitize & Convert"| DOC_PROC
    DOC_PROC -->|"Dispatch Initial InvoiceState"| AG_DOC

    AG_DOC <-->|"Multimodal Visual Inference"| BEDROCK
    AG_DOC --> AG_VAL
    AG_VAL --> AG_PO
    AG_PO --> AG_POL
    AG_POL --> AG_ANO
    AG_ANO --> AG_RISK
    AG_RISK --> AG_DEC
    AG_DEC --> AG_EXP
    AG_EXP <-->|"Executive Summary Generation"| BEDROCK

    AG_DEC -->|"Score < 35 & High Confidence"| OUT_APPROVE
    AG_DEC -->|"Score 35-70 OR Low Confidence"| OUT_REVIEW
    AG_DEC -->|"Score > 70 OR Confirmed Duplicate"| OUT_BLOCK

    OUT_REVIEW -.->|"Escalates to Reviewer"| UI_HITL

    API_GW -->|"Persist Transaction Records"| DB_MAIN
    AG_DOC -.->|"Record Step Metrics"| AUDIT_LOG
    AG_VAL -.->|"Record Step Metrics"| AUDIT_LOG
    AG_PO -.->|"Record Step Metrics"| AUDIT_LOG
    AG_POL -.->|"Record Step Metrics"| AUDIT_LOG
    AG_ANO -.->|"Record Step Metrics"| AUDIT_LOG
    AG_RISK -.->|"Record Step Metrics"| AUDIT_LOG
    AG_DEC -.->|"Record Step Metrics"| AUDIT_LOG
    AG_EXP -.->|"Record Step Metrics"| AUDIT_LOG
```

---

## 2. Multi-Agent LangGraph Linear & Conditional Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Finance User / Vendor
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Graph as LangGraph Orchestrator
    participant Bedrock as Amazon Bedrock (Qwen3-VL)
    participant DB as Database / Audit Store

    User->>UI: Uploads Invoice (PDF/PNG)
    UI->>API: POST /api/v1/invoices/upload
    API->>API: Preprocess & Convert to High-Res Image
    API->>Graph: Invoke StateGraph(InvoiceState)

    rect rgb(24, 24, 48)
        note right of Graph: Agent 1: Multimodal Extraction
        Graph->>Bedrock: Send Document Image + JSON Schema Prompt
        Bedrock-->>Graph: Structured Data + Field Confidences (0.00-1.00)
    end

    rect rgb(20, 36, 36)
        note right of Graph: Agent 2: Deterministic Validation
        Graph->>Graph: Validate Arithmetic: (Subtotal + Tax == Total)
        Graph->>Graph: Validate Required Metadata & Currency Code
    end

    rect rgb(20, 36, 36)
        note right of Graph: Agent 3: 3-Way ERP Matching
        Graph->>DB: Query PO Record by po_number
        DB-->>Graph: PO Details & Line Item Catalog
        Graph->>Graph: Calculate Line-Item Price & Quantity Variances
    end

    rect rgb(20, 36, 36)
        note right of Graph: Agent 4: Policy Enforcement
        Graph->>DB: Fetch Active Corporate Policies
        DB-->>Graph: Approval Ceilings & Variance Tolerances
        Graph->>Graph: Flag Policy Exceptions (e.g., Variance > 5%)
    end

    rect rgb(20, 36, 36)
        note right of Graph: Agent 5: Anomaly & Duplicate Detection
        Graph->>DB: Query Historical Invoices (Vendor + Amount + Date)
        DB-->>Graph: Matching Invoices & Historical Spend Patterns
        Graph->>Graph: Compute Duplicate Probability & Spend Spike Z-Score
    end

    rect rgb(30, 30, 40)
        note right of Graph: Agent 6: Calibrated Risk Engine
        Graph->>Graph: Calculate Composite Risk Score (0–100)
    end

    rect rgb(30, 30, 40)
        note right of Graph: Agent 7: Confidence-Aware Decision Router
        Graph->>Graph: Evaluate Rules & Extraction Confidence (< 75% -> Escalate)
        Graph->>Graph: Set Decision: AUTO_APPROVE | HUMAN_REVIEW | BLOCK
    end

    rect rgb(24, 24, 48)
        note right of Graph: Agent 8: Audit Explanation Synthesis
        Graph->>Bedrock: Synthesize Natural Language Audit Brief
        Bedrock-->>Graph: Fact-Grounded Executive Summary
    end

    Graph->>DB: Commit Invoice Record & Immutable Audit Events
    Graph-->>API: Return Final Evaluated InvoiceState
    API-->>UI: Return Full Evaluation Response
    UI-->>User: Display Interactive Triage Card & Visual PDF Grounding
```

---

## 3. Component Architecture & Responsibility Matrix

| Layer | Component | Core Technology | Primary Responsibility |
|---|---|---|---|
| **Presentation** | Interactive Dashboard | React 18, Vite, TypeScript | Displays live throughput, triage metrics, and instant evaluation presets |
| **Presentation** | HITL Review UI | Tailwind CSS, Lucide React | Side-by-side visual PDF viewer with field grounding badges and reviewer actions |
| **Presentation** | Policy Simulator | Recharts, Axios | Interactive sandbox for finance admins to simulate policy impacts before production |
| **API Gateway** | REST Endpoints | FastAPI, Uvicorn | Request validation, asynchronous orchestration triggering, file streaming |
| **AI Foundation** | Vision Model | `qwen.qwen3-vl-235b-a22b` via Bedrock | Multimodal extraction with spatial bounding boxes and field-level confidence |
| **Multi-Agent** | LangGraph Pipeline | LangGraph `StateGraph` | Linear execution and state passing across 8 specialized agents |
| **Business Logic**| Deterministic Engines | Python 3.11, Pydantic v2 | Exact math validation, PO 3-way matching, duplicate detection, and risk scoring |
| **Persistence** | Relational & Audit DB| PostgreSQL / SQLite, SQLAlchemy | Stores invoices, PO records, active expense policies, and granular audit trails |

---

## 4. Key Architectural Pillars

1. **AI Interprets, Python Calculates:**
   - Visual understanding and semantic comprehension are delegated to **Qwen3-VL via Amazon Bedrock**.
   - Mathematical calculations (`subtotal + tax == total`), percentage variance tolerances, and policy ceilings are executed deterministically in **Python** with 0% hallucination risk.

2. **Confidence-Aware Human-in-the-Loop Routing:**
   - An invoice with zero math errors will still automatically route to `HUMAN_REVIEW` if any critical financial field extraction confidence falls below **75%**.

3. **Auditable Lineage:**
   - Every agent execution is permanently recorded with microsecond timestamps, latency benchmarks, input parameters, and exact evidence citations.
