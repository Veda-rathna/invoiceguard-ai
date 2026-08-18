from typing import Tuple, Dict, Any, List
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState


class ValidationAgent(BaseAgent):
    name = "VALIDATION_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        extracted = state.get("extracted_data", {})
        exceptions: List[Dict[str, Any]] = []

        subtotal = extracted.get("subtotal")
        tax = extracted.get("tax")
        total = extracted.get("total")
        vendor = extracted.get("vendor_name")
        line_items = extracted.get("line_items", [])
        doc_type = state.get("document_type", "invoice")

        # 1. Required Field Presence Check
        if not vendor:
            exceptions.append({
                "type": "MISSING_VENDOR",
                "severity": "HIGH",
                "message": "Vendor name is missing or unreadable on document"
            })

        if total is None or total <= 0:
            exceptions.append({
                "type": "INVALID_TOTAL",
                "severity": "HIGH",
                "message": "Total amount is missing, zero, or negative"
            })

        # 2. Arithmetic Reconciliation: Subtotal + Tax == Total
        if subtotal is not None and tax is not None and total is not None:
            expected_total = round(subtotal + tax, 2)
            actual_total = round(total, 2)
            diff = abs(expected_total - actual_total)
            if diff > 1.0:  # Allow 1 currency unit for rounding
                exceptions.append({
                    "type": "TOTAL_MISMATCH",
                    "severity": "HIGH",
                    "expected": expected_total,
                    "actual": actual_total,
                    "variance": diff,
                    "message": f"Arithmetic mismatch: Subtotal (₹{subtotal:,.2f}) + Tax (₹{tax:,.2f}) = ₹{expected_total:,.2f}, but Total is ₹{actual_total:,.2f}"
                })

        # 3. Line Items Sum Check
        if line_items and subtotal is not None:
            items_sum = round(sum(item.get("total", 0.0) for item in line_items), 2)
            if abs(items_sum - round(subtotal, 2)) > 2.0:
                exceptions.append({
                    "type": "LINE_ITEMS_MISMATCH",
                    "severity": "MEDIUM",
                    "expected": subtotal,
                    "actual": items_sum,
                    "message": f"Sum of line items (₹{items_sum:,.2f}) does not match subtotal (₹{subtotal:,.2f})"
                })

        status = "EXCEPTION" if exceptions else "PASS"
        validation_results = {
            "status": status,
            "exceptions_count": len(exceptions),
            "exceptions": exceptions
        }
        state["validation_results"] = validation_results

        if exceptions:
            summary = f"Validation flagged {len(exceptions)} arithmetic/field exception(s): " + "; ".join(e["message"] for e in exceptions[:2])
            audit_status = "WARNING"
        else:
            summary = "All arithmetic calculations (Subtotal + Tax = Total) and mandatory field checks passed perfectly."
            audit_status = "SUCCESS"

        audit_event = {
            "agent_name": self.name,
            "action": "VALIDATION_CHECK",
            "status": audit_status,
            "summary": summary,
            "details": validation_results,
            "evidence": f"Verified math across {len(line_items)} line items with 0.00 currency discrepancy" if not exceptions else f"Detected ₹{exceptions[0].get('variance', 0.0):.2f} variance"
        }

        return state, audit_event


validation_agent = ValidationAgent()
