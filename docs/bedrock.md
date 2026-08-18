# Amazon Bedrock & Qwen3-VL Integration

## 1. Model Configuration

InvoiceGuard AI uses **`qwen.qwen3-vl-235b-a22b`** hosted on **Amazon Bedrock Runtime**.

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=qwen.qwen3-vl-235b-a22b
DEMO_MODE=false
```

Authentication relies on standard AWS credential resolution:
1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS CLI profile (`~/.aws/credentials`)
3. IAM Instance Profile / ECS Task Role

---

## 2. Multimodal Request Architecture

Documents (PDF or images) are processed visually rather than converted into lossy OCR text.

```text
Invoice Document (PDF/Image)
            ↓
  Document Preprocessing
  (PDF page render / JPEG resize)
            ↓
  Base64 Image Payload
            ↓
  Amazon Bedrock Runtime
  (qwen.qwen3-vl-235b-a22b)
            ↓
  Structured Pydantic Extraction
```

---

## 3. Prompt Security & Anti-Hallucination Guardrails

- **Prompt Injection Defense:** Document content is treated as untrusted data. System instructions explicitly forbid following commands inside the invoice image.
- **Explicit `null` Rule:** If a field is not visually legible or absent, the model returns `null` rather than guessing or inferring numbers.
- **Field-Level Confidences:** Every critical field (`vendor_name`, `invoice_number`, `total`, `tax`, `po_number`) receives an independent 0.0–1.0 visual clarity confidence rating.

---

## 4. Resilience, Retry, and Fallback Policies

- **Exponential Backoff:** Retries up to 3 times for transient errors (`ThrottlingException`, `ServiceUnavailable`, `RequestTimeout`).
- **Telemetry Capture:** Measures execution latency (ms) and token counts for observability.
- **Graceful Fallback:** If Bedrock is unavailable or credentials are not active, the system automatically routes the invoice to `HUMAN_REVIEW` with an auditable exception log, ensuring zero application crashes.
