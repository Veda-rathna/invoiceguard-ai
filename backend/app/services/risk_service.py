from typing import Dict, Any, List
from app.schemas.risk import RiskFactor, RiskResult


class RiskService:
    """
    Calculates deterministic, transparent, and additive risk score (0-100)
    broken down by individual explainable contributing factors.
    """

    @staticmethod
    def calculate_risk(
        validation_results: Dict[str, Any],
        po_results: Dict[str, Any],
        policy_results: Dict[str, Any],
        anomaly_results: Dict[str, Any],
        extraction_confidence: float,
        field_confidence: Dict[str, float]
    ) -> RiskResult:
        factors: List[RiskFactor] = []
        raw_score = 0.0

        # 1. Validation Failures (Arithmetic / Missing Fields)
        if validation_results.get("status") == "EXCEPTION":
            exceptions = validation_results.get("exceptions", [])
            for exc in exceptions:
                pts = 20.0
                raw_score += pts
                factors.append(RiskFactor(
                    factor="Arithmetic Mismatch",
                    category="Validation",
                    contribution=pts,
                    severity="HIGH",
                    description=exc.get("message", "Calculated subtotal + tax does not equal total amount"),
                    evidence=f"Expected: {exc.get('expected')}, Actual: {exc.get('actual')}"
                ))

        # 2. Purchase Order Variance or Missing PO
        po_status = po_results.get("status", "NOT_EVALUATED")
        if po_status == "PO_NOT_FOUND" and po_results.get("invoice_total", 0.0) > 10000.0:
            pts = 20.0
            raw_score += pts
            factors.append(RiskFactor(
                factor="Missing Purchase Order",
                category="PO Matching",
                contribution=pts,
                severity="HIGH",
                description="Transaction value exceeds mandatory PO threshold but no matching PO was found in system",
                evidence=f"Referenced PO: {po_results.get('po_number', 'None')}"
            ))
        elif po_results.get("variance_percentage", 0.0) > 5.0:
            var_pct = po_results.get("variance_percentage", 0.0)
            pts = min(30.0, 15.0 + (var_pct * 1.2))
            raw_score += pts
            factors.append(RiskFactor(
                factor="PO Amount Variance",
                category="PO Matching",
                contribution=round(pts, 1),
                severity="HIGH" if var_pct > 10.0 else "MEDIUM",
                description=f"Invoice total deviates by {var_pct:.1f}% from approved Purchase Order amount",
                evidence=f"Invoice: ₹{po_results.get('invoice_total', 0):,.2f} vs PO: ₹{po_results.get('po_total', 0):,.2f}",
                value=f"{var_pct:.1f}%"
            ))

        # 3. Duplicate Suspicions
        if anomaly_results.get("is_duplicate"):
            prob = anomaly_results.get("duplicate_probability", 80.0)
            pts = 35.0 if prob >= 90.0 else 25.0
            raw_score += pts
            factors.append(RiskFactor(
                factor="Potential Duplicate Invoice",
                category="Anomaly Detection",
                contribution=pts,
                severity="CRITICAL" if prob >= 90.0 else "HIGH",
                description=f"High probability duplicate ({prob:.0f}% match) with existing record #{anomaly_results.get('matched_invoice_id')}",
                evidence="; ".join(anomaly_results.get("duplicate_reasons", []))
            ))

        # 4. Vendor Baseline Outlier
        if anomaly_results.get("vendor_anomaly"):
            dev_pct = anomaly_results.get("vendor_deviation_percent", 0.0)
            pts = 15.0
            raw_score += pts
            factors.append(RiskFactor(
                factor="Vendor Spend Spike",
                category="Anomaly Detection",
                contribution=pts,
                severity="MEDIUM",
                description=f"Invoice amount exceeds vendor's historical baseline by +{dev_pct:.1f}%",
                evidence=f"Historical Average: ₹{anomaly_results.get('vendor_stats', {}).get('avg_amount', 0):,.2f}"
            ))

        # 5. New Vendor
        if anomaly_results.get("is_new_vendor"):
            pts = 15.0
            raw_score += pts
            factors.append(RiskFactor(
                factor="New Vendor Registration",
                category="Vendor Profile",
                contribution=pts,
                severity="MEDIUM",
                description="First time transaction from unverified vendor entity",
                evidence="No prior completed audit history"
            ))

        # 6. Policy Violations
        pol_list = policy_results.get("policy_results", [])
        for pol in pol_list:
            if pol.get("status") == "FAIL" and pol.get("policy") not in ["PO_REQUIRED", "PO_VARIANCE", "NEW_VENDOR"]:
                pts = pol.get("risk_contribution", 15.0)
                raw_score += pts
                factors.append(RiskFactor(
                    factor=f"Policy Violation: {pol.get('rule_name')}",
                    category="Policy",
                    contribution=pts,
                    severity=pol.get("severity", "MEDIUM"),
                    description=pol.get("evidence", "Configured expense policy threshold breached"),
                    evidence=f"Threshold: {pol.get('threshold_value')}, Actual: {pol.get('actual_value')}"
                ))

        # 7. Low Extraction Confidence Penalty
        total_conf = field_confidence.get("total", extraction_confidence)
        if total_conf < 0.75:
            penalty = (0.75 - total_conf) * 50.0  # up to 25 pts
            raw_score += penalty
            factors.append(RiskFactor(
                factor="Low Model Extraction Confidence",
                category="AI Confidence",
                contribution=round(penalty, 1),
                severity="MEDIUM",
                description=f"Vision model confidence for total amount is {total_conf*100:.1f}% (below 75% cutoff)",
                evidence="Visual ambiguity or low scan resolution"
            ))

        # Normalize score strictly to 0-100
        final_score = min(100.0, max(0.0, raw_score))

        # Classification
        if final_score <= 30.0:
            level = "LOW"
        elif final_score <= 60.0:
            level = "MEDIUM"
        elif final_score <= 80.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        summary = f"Calculated risk score: {final_score:.1f}/100 ({level}) across {len(factors)} identified risk factors."

        return RiskResult(
            risk_score=round(final_score, 1),
            risk_level=level,
            risk_factors=factors,
            confidence_penalty=0.0,
            summary=summary
        )


risk_service = RiskService()
