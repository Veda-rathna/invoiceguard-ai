import logging
from typing import Tuple, Dict, Any
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.agents.prompts import DOCUMENT_EXTRACTION_PROMPT
from app.services.document_service import document_service
from app.services.llm_service import llm_service
from app.schemas.extraction import ExtractedInvoice

logger = logging.getLogger("document_agent")


class DocumentAgent(BaseAgent):
    name = "DOCUMENT_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        file_path = state["document_path"]
        hint = state.get("original_filename", "")

        try:
            # 1. Preprocess document into normalized image bytes
            normalized_doc = document_service.preprocess_document(file_path)
            primary_page_bytes = normalized_doc.pages[0] if normalized_doc.pages else b""

            # 2. Invoke Qwen3-VL through multimodal Bedrock / LLM service
            extracted_obj, latency_ms, tokens, error = llm_service.invoke_multimodal_structured(
                image_bytes=primary_page_bytes,
                image_mime_type="image/jpeg",
                system_prompt=DOCUMENT_EXTRACTION_PROMPT,
                user_prompt="Inspect this financial invoice/receipt document visually. Extract all structured financial fields, line items, field confidences, and visual grounding evidence notes.",
                response_model=ExtractedInvoice,
                document_hint=hint
            )

            if error or not extracted_obj:
                logger.warning(f"Document extraction failed or returned empty: {error}")
                # Fallback empty extraction with low confidence
                extracted_data = {
                    "document_type": "unknown",
                    "vendor_name": None,
                    "invoice_number": None,
                    "total": None,
                    "line_items": []
                }
                field_conf = {"total": 0.2, "vendor_name": 0.2}
                ext_conf = 0.2
                evidence = []
                summary = f"Visual extraction error: {error or 'Malformed output'}. Routed to manual review."
                status = "FAILED"
            else:
                extracted_data = extracted_obj.dict()
                field_conf = extracted_obj.field_confidence or {}
                ext_conf = extracted_obj.extraction_confidence or 0.95
                evidence = [e.dict() for e in extracted_obj.evidence_metadata]
                vendor = extracted_obj.vendor_name or "Unknown Vendor"
                total = extracted_obj.total or 0.0
                inv_no = extracted_obj.invoice_number or "N/A"
                summary = f"Extracted {extracted_obj.document_type.upper()} #{inv_no} from '{vendor}' for ₹{total:,.2f} ({ext_conf*100:.0f}% confidence)"
                status = "SUCCESS"

            state["extracted_data"] = extracted_data
            state["field_confidence"] = field_conf
            state["extraction_confidence"] = ext_conf
            state["evidence_metadata"] = evidence
            state["document_type"] = extracted_data.get("document_type", "invoice")
            state["bedrock_latency_ms"] = state.get("bedrock_latency_ms", 0.0) + latency_ms
            state["tokens_used"] = state.get("tokens_used", 0) + tokens

            audit_event = {
                "agent_name": self.name,
                "action": "DOCUMENT_EXTRACTED",
                "status": status,
                "summary": summary,
                "details": {
                    "vendor": extracted_data.get("vendor_name"),
                    "invoice_number": extracted_data.get("invoice_number"),
                    "total": extracted_data.get("total"),
                    "field_confidence": field_conf,
                    "line_items_count": len(extracted_data.get("line_items", []))
                },
                "evidence": f"Model identified {len(evidence)} visual grounding anchors across document pages"
            }

            return state, audit_event

        except Exception as e:
            logger.error(f"DocumentAgent unhandled exception: {e}")
            state["error"] = str(e)
            state["extraction_confidence"] = 0.1
            state["field_confidence"] = {"total": 0.1}
            state["extracted_data"] = {"total": 0.0, "vendor_name": "Error"}
            audit_event = {
                "agent_name": self.name,
                "action": "EXTRACTION_EXCEPTION",
                "status": "FAILED",
                "summary": f"Unhandled extraction exception: {str(e)}",
                "details": {"error": str(e)}
            }
            return state, audit_event


document_agent = DocumentAgent()
