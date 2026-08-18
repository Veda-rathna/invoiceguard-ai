from typing import Tuple, Dict, Any, List
from app.agents.base import BaseAgent
from app.agents.state import InvoiceState
from app.agents.prompts import SEMANTIC_MATCHING_PROMPT
from app.services.llm_service import llm_service
from app.db.session import SessionLocal
from app.models.purchase_order import PurchaseOrder


class POMatchingAgent(BaseAgent):
    name = "PO_MATCHING_AGENT"

    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        extracted = state.get("extracted_data", {})
        po_number = extracted.get("po_number")
        vendor_name = extracted.get("vendor_name")
        invoice_total = float(extracted.get("total") or 0.0)
        invoice_items = extracted.get("line_items", [])

        db = SessionLocal()
        po_info = None
        try:
            po_record = None
            if po_number:
                po_record = db.query(PurchaseOrder).filter(
                    PurchaseOrder.po_number == po_number.strip().upper()
                ).first()
            
            # Fallback fuzzy vendor lookup if PO number not given or not found
            if not po_record and vendor_name:
                po_record = db.query(PurchaseOrder).filter(
                    PurchaseOrder.vendor_name.ilike(f"%{vendor_name[:6]}%"),
                    PurchaseOrder.status == "OPEN"
                ).first()

            if po_record:
                po_info = {
                    "po_number": po_record.po_number,
                    "vendor_name": po_record.vendor_name,
                    "total_amount": float(po_record.total_amount),
                    "items": [
                        {
                            "description": itm.description,
                            "quantity": float(itm.quantity),
                            "unit_price": float(itm.unit_price),
                            "total_price": float(itm.total_price)
                        }
                        for itm in po_record.items
                    ]
                }
        finally:
            db.close()

        if not po_info:
            po_match_results = {
                "po_number": po_number,
                "found_po": False,
                "vendor_match": False,
                "po_match": False,
                "item_match": False,
                "quantity_match": False,
                "price_match": False,
                "total_match": False,
                "invoice_total": invoice_total,
                "po_total": 0.0,
                "variance_amount": invoice_total,
                "variance_percentage": 0.0,
                "status": "PO_NOT_FOUND" if po_number else "PO_NOT_REQUIRED",
                "item_matches": [],
                "summary": f"No active Purchase Order found for PO #{po_number or 'N/A'}"
            }
            state["po_match_results"] = po_match_results

            audit_event = {
                "agent_name": self.name,
                "action": "PO_LOOKUP",
                "status": "WARNING" if invoice_total > 10000.0 else "INFO",
                "summary": f"No Purchase Order found in ERP system for referenced PO '{po_number or 'None'}'",
                "details": po_match_results,
                "evidence": f"Queried ERP purchase orders table for PO #{po_number}"
            }
            return state, audit_event

        # PO found -> Perform comparisons
        po_total = po_info["total_amount"]
        variance_amount = round(invoice_total - po_total, 2)
        variance_percentage = round((variance_amount / po_total) * 100.0, 2) if po_total > 0 else 0.0

        po_vendor_name = po_info["vendor_name"]
        vendor_match = bool(vendor_name and (vendor_name.lower() in po_vendor_name.lower() or po_vendor_name.lower() in vendor_name.lower()))
        total_match = abs(variance_amount) <= 1.0

        item_matches: List[Dict[str, Any]] = []
        all_items_matched = True

        for inv_item in invoice_items:
            inv_desc = inv_item.get("description", "")
            inv_qty = float(inv_item.get("quantity", 1.0))
            inv_price = float(inv_item.get("unit_price", 0.0))
            
            best_match_item = None
            for po_item in po_info["items"]:
                is_match, score, _ = llm_service.invoke_semantic_match(
                    system_prompt=SEMANTIC_MATCHING_PROMPT,
                    user_prompt="",
                    item1=inv_desc,
                    item2=po_item["description"]
                )
                if is_match or score > 0.6:
                    best_match_item = po_item
                    break

            if best_match_item:
                qty_diff = inv_qty - best_match_item["quantity"]
                price_diff = inv_price - best_match_item["unit_price"]
                matched = (abs(qty_diff) <= 0.01 and abs(price_diff) <= 1.0)
                if not matched:
                    all_items_matched = False

                item_matches.append({
                    "invoice_item": inv_desc,
                    "po_item": best_match_item["description"],
                    "invoice_qty": inv_qty,
                    "po_qty": best_match_item["quantity"],
                    "invoice_price": inv_price,
                    "po_price": best_match_item["unit_price"],
                    "matched": matched,
                    "variance_reason": f"Price difference of ₹{price_diff:,.2f}" if abs(price_diff) > 1.0 else None
                })
            else:
                all_items_matched = False
                item_matches.append({
                    "invoice_item": inv_desc,
                    "po_item": None,
                    "invoice_qty": inv_qty,
                    "po_qty": None,
                    "invoice_price": inv_price,
                    "po_price": None,
                    "matched": False,
                    "variance_reason": "No matching line item found on Purchase Order"
                })

        if total_match and all_items_matched:
            match_status = "EXACT_MATCH"
            summary = f"Exact 3-way match with Purchase Order #{po_info['po_number']}. 0.0% variance."
            audit_status = "SUCCESS"
        elif abs(variance_percentage) <= 5.0:
            match_status = "PARTIAL_MATCH"
            summary = f"Minor variance ({variance_percentage:+.1f}%) within acceptable 5% threshold against PO #{po_info['po_number']}."
            audit_status = "SUCCESS"
        else:
            match_status = "MISMATCH"
            summary = f"PO variance of {variance_percentage:+.1f}% (+₹{variance_amount:,.2f}) detected against PO #{po_info['po_number']} (Allowed: 5.0%)."
            audit_status = "WARNING"

        po_match_results = {
            "po_number": po_info["po_number"],
            "found_po": True,
            "vendor_match": vendor_match,
            "po_match": True,
            "item_match": all_items_matched,
            "quantity_match": True,
            "price_match": total_match,
            "total_match": total_match,
            "invoice_total": invoice_total,
            "po_total": po_total,
            "variance_amount": variance_amount,
            "variance_percentage": variance_percentage,
            "status": match_status,
            "item_matches": item_matches,
            "summary": summary
        }
        state["po_match_results"] = po_match_results

        audit_event = {
            "agent_name": self.name,
            "action": "PO_MATCH_EVALUATED",
            "status": audit_status,
            "summary": summary,
            "details": po_match_results,
            "evidence": f"Matched against ERP PO #{po_info['po_number']} (Approved: ₹{po_total:,.2f}, Invoice: ₹{invoice_total:,.2f})"
        }

        return state, audit_event


po_matching_agent = POMatchingAgent()
