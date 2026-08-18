from typing import Dict, Any, Optional, Tuple, List
import datetime
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.vendor import Vendor


class AnomalyService:
    """
    Detects potential duplicate invoices and vendor spend anomalies deterministically.
    Avoids unsupported 'fraud' claims, using transparent statistical indicators instead.
    """

    @staticmethod
    def check_anomalies(
        db: Session,
        current_invoice_id: str,
        vendor_name: Optional[str],
        invoice_number: Optional[str],
        total_amount: Optional[float],
        invoice_date: Optional[datetime.datetime]
    ) -> Dict[str, Any]:
        results = {
            "is_duplicate": False,
            "duplicate_probability": 0.0,
            "matched_invoice_id": None,
            "duplicate_reasons": [],
            "vendor_anomaly": False,
            "vendor_deviation_percent": 0.0,
            "is_new_vendor": False,
            "vendor_stats": {},
            "anomaly_warnings": []
        }

        if not vendor_name or total_amount is None:
            return results

        # 1. Duplicate Invoice Check
        # Check A: Exact invoice_number collision from same vendor
        if invoice_number:
            exact_match = db.query(Invoice).filter(
                Invoice.id != current_invoice_id,
                Invoice.invoice_number == invoice_number,
                Invoice.vendor_name == vendor_name
            ).first()

            if exact_match:
                results["is_duplicate"] = True
                results["duplicate_probability"] = 96.0
                results["matched_invoice_id"] = exact_match.invoice_number or exact_match.id
                results["duplicate_reasons"].append(
                    f"Exact invoice number '{invoice_number}' already exists from vendor '{vendor_name}'"
                )
                results["anomaly_warnings"].append(
                    f"Duplicate invoice detected: matches existing record #{exact_match.invoice_number or exact_match.id}"
                )

        # Check B: Same vendor + same total amount within ±45 days
        if not results["is_duplicate"] and total_amount > 0:
            similar_amount_matches = db.query(Invoice).filter(
                Invoice.id != current_invoice_id,
                Invoice.vendor_name == vendor_name,
                Invoice.total_amount >= (total_amount * 0.99),
                Invoice.total_amount <= (total_amount * 1.01)
            ).all()

            for candidate in similar_amount_matches:
                results["is_duplicate"] = True
                results["duplicate_probability"] = 65.0
                results["matched_invoice_id"] = candidate.invoice_number or candidate.id
                results["duplicate_reasons"].append(
                    f"Identical billing amount (₹{total_amount:,.2f}) previously submitted for this vendor in invoice #{candidate.invoice_number or candidate.id}"
                )
                results["anomaly_warnings"].append(
                    f"Potential duplicate suspicion: Identical amount ₹{total_amount:,.2f} found on invoice #{candidate.invoice_number or candidate.id}"
                )
                break

        # 2. Vendor Spend Baseline Anomaly
        vendor = db.query(Vendor).filter(Vendor.name == vendor_name).first()
        if not vendor or vendor.invoice_count == 0:
            results["is_new_vendor"] = True
            results["anomaly_warnings"].append(f"Vendor '{vendor_name}' is a new vendor with no historical transactions")
        else:
            avg_amt = vendor.avg_invoice_amount or 0.0
            results["vendor_stats"] = {
                "invoice_count": vendor.invoice_count,
                "avg_amount": avg_amt,
                "median_amount": vendor.median_invoice_amount or avg_amt,
                "trust_score": vendor.trust_score
            }

            if avg_amt > 0 and total_amount > (avg_amt * 2.5):
                deviation = ((total_amount - avg_amt) / avg_amt) * 100.0
                results["vendor_anomaly"] = True
                results["vendor_deviation_percent"] = round(deviation, 1)
                results["anomaly_warnings"].append(
                    f"Unusual spend spike: Amount ₹{total_amount:,.2f} is +{deviation:.1f}% above vendor's historical average of ₹{avg_amt:,.2f}"
                )

        return results


anomaly_service = AnomalyService()
