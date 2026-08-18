import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.policy import PolicyRule
from app.schemas.policy import PolicyCheckResult, PolicyEvaluationResponse, PolicyRuleUpdate
from app.core.config import settings


class PolicyService:
    @staticmethod
    def get_all_rules(db: Session) -> List[PolicyRule]:
        rules = db.query(PolicyRule).all()
        if not rules:
            PolicyService.seed_default_rules(db)
            rules = db.query(PolicyRule).all()
        return rules

    @staticmethod
    def seed_default_rules(db: Session):
        defaults = [
            {
                "rule_key": "auto_approval_limit",
                "name": "Auto-Approval Upper Limit",
                "description": "Invoices exceeding this amount require manager review regardless of risk score",
                "category": "Threshold",
                "threshold_value": settings.AUTO_APPROVAL_LIMIT,
                "unit": "currency",
                "is_active": True,
                "severity_if_failed": "HIGH",
                "risk_points": 20.0
            },
            {
                "rule_key": "po_required_above",
                "name": "Mandatory PO Threshold",
                "description": "Invoices above this amount must reference an existing valid Purchase Order",
                "category": "Matching",
                "threshold_value": settings.PO_REQUIRED_ABOVE,
                "unit": "currency",
                "is_active": True,
                "severity_if_failed": "HIGH",
                "risk_points": 25.0
            },
            {
                "rule_key": "maximum_po_variance_percent",
                "name": "Maximum Allowed PO Variance",
                "description": "Variance percentage allowed between Invoice Total and Purchase Order Total",
                "category": "Matching",
                "threshold_value": settings.MAXIMUM_PO_VARIANCE_PERCENT,
                "unit": "%",
                "is_active": True,
                "severity_if_failed": "HIGH",
                "risk_points": 25.0
            },
            {
                "rule_key": "new_vendor_requires_review",
                "name": "New Vendor Review Requirement",
                "description": "Invoices from vendors with no prior approved transaction history must be reviewed",
                "category": "Vendor",
                "bool_value": settings.NEW_VENDOR_REQUIRES_REVIEW,
                "unit": "boolean",
                "is_active": True,
                "severity_if_failed": "MEDIUM",
                "risk_points": 15.0
            },
            {
                "rule_key": "minimum_extraction_confidence",
                "name": "Minimum Field Extraction Confidence",
                "description": "Minimum confidence required for critical extracted fields before escalation",
                "category": "Compliance",
                "threshold_value": settings.MINIMUM_EXTRACTION_CONFIDENCE,
                "unit": "%",
                "is_active": True,
                "severity_if_failed": "MEDIUM",
                "risk_points": 15.0
            },
            {
                "rule_key": "duplicate_similarity_threshold",
                "name": "Duplicate Detection Cutoff",
                "description": "Similarity percentage cutoff for blocking duplicate invoices",
                "category": "Compliance",
                "threshold_value": settings.DUPLICATE_SIMILARITY_THRESHOLD,
                "unit": "%",
                "is_active": True,
                "severity_if_failed": "CRITICAL",
                "risk_points": 35.0
            }
        ]

        for item in defaults:
            existing = db.query(PolicyRule).filter(PolicyRule.rule_key == item["rule_key"]).first()
            if not existing:
                rule = PolicyRule(
                    id=f"pol_{uuid.uuid4().hex[:10]}",
                    rule_key=item["rule_key"],
                    name=item["name"],
                    description=item["description"],
                    category=item["category"],
                    threshold_value=item.get("threshold_value"),
                    bool_value=item.get("bool_value"),
                    unit=item["unit"],
                    is_active=item["is_active"],
                    severity_if_failed=item["severity_if_failed"],
                    risk_points=item["risk_points"]
                )
                db.add(rule)
        db.commit()

    @staticmethod
    def update_rule(db: Session, rule_key: str, update_in: PolicyRuleUpdate) -> Optional[PolicyRule]:
        rule = db.query(PolicyRule).filter(PolicyRule.rule_key == rule_key).first()
        if not rule:
            return None
        
        for k, v in update_in.dict(exclude_unset=True).items():
            setattr(rule, k, v)
        
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def evaluate_policies(
        db: Session,
        extracted_data: Dict[str, Any],
        po_results: Dict[str, Any],
        vendor_info: Optional[Dict[str, Any]],
        extraction_confidence: float,
        field_confidence: Dict[str, float]
    ) -> PolicyEvaluationResponse:
        rules = PolicyService.get_all_rules(db)
        rule_map = {r.rule_key: r for r in rules if r.is_active}
        
        results: List[PolicyCheckResult] = []
        violations_count = 0
        total_amount = float(extracted_data.get("total") or 0.0)
        po_number = extracted_data.get("po_number")

        # 1. PO Mandatory Check
        po_req_rule = rule_map.get("po_required_above")
        if po_req_rule:
            threshold = po_req_rule.threshold_value or 10000.0
            if total_amount > threshold:
                if not po_number or not po_results.get("found_po"):
                    violations_count += 1
                    results.append(PolicyCheckResult(
                        policy="PO_REQUIRED",
                        rule_name=po_req_rule.name,
                        status="FAIL",
                        severity=po_req_rule.severity_if_failed,
                        risk_contribution=po_req_rule.risk_points,
                        evidence=f"Invoice total ₹{total_amount:,.2f} exceeds ₹{threshold:,.2f} threshold without a valid Purchase Order",
                        actual_value=f"PO: {po_number or 'None'}",
                        threshold_value=f"> ₹{threshold:,.2f}"
                    ))
                else:
                    results.append(PolicyCheckResult(
                        policy="PO_REQUIRED",
                        rule_name=po_req_rule.name,
                        status="PASS",
                        severity="LOW",
                        evidence=f"Valid Purchase Order #{po_number} attached for ₹{total_amount:,.2f} invoice",
                        actual_value=po_number,
                        threshold_value=f"> ₹{threshold:,.2f}"
                    ))

        # 2. PO Variance Check
        variance_rule = rule_map.get("maximum_po_variance_percent")
        if variance_rule and po_results.get("found_po"):
            max_var = variance_rule.threshold_value or 5.0
            actual_var = po_results.get("variance_percentage", 0.0)
            if actual_var > max_var:
                violations_count += 1
                results.append(PolicyCheckResult(
                    policy="PO_VARIANCE",
                    rule_name=variance_rule.name,
                    status="FAIL",
                    severity=variance_rule.severity_if_failed,
                    risk_contribution=variance_rule.risk_points,
                    evidence=f"PO variance of {actual_var:.1f}% exceeds maximum allowable threshold of {max_var:.1f}%",
                    actual_value=f"{actual_var:.1f}%",
                    threshold_value=f"<= {max_var:.1f}%"
                ))
            else:
                results.append(PolicyCheckResult(
                    policy="PO_VARIANCE",
                    rule_name=variance_rule.name,
                    status="PASS",
                    severity="LOW",
                    evidence=f"PO variance {actual_var:.1f}% is within allowable {max_var:.1f}% margin",
                    actual_value=f"{actual_var:.1f}%",
                    threshold_value=f"<= {max_var:.1f}%"
                ))

        # 3. Auto-Approval Upper Limit Check
        limit_rule = rule_map.get("auto_approval_limit")
        if limit_rule:
            limit_val = limit_rule.threshold_value or 50000.0
            if total_amount > limit_val:
                violations_count += 1
                results.append(PolicyCheckResult(
                    policy="AUTO_APPROVAL_LIMIT",
                    rule_name=limit_rule.name,
                    status="FAIL",
                    severity=limit_rule.severity_if_failed,
                    risk_contribution=limit_rule.risk_points,
                    evidence=f"Invoice total ₹{total_amount:,.2f} exceeds auto-approval ceiling of ₹{limit_val:,.2f}",
                    actual_value=f"₹{total_amount:,.2f}",
                    threshold_value=f"<= ₹{limit_val:,.2f}"
                ))
            else:
                results.append(PolicyCheckResult(
                    policy="AUTO_APPROVAL_LIMIT",
                    rule_name=limit_rule.name,
                    status="PASS",
                    severity="LOW",
                    evidence=f"Invoice total ₹{total_amount:,.2f} is within auto-approval limit of ₹{limit_val:,.2f}",
                    actual_value=f"₹{total_amount:,.2f}",
                    threshold_value=f"<= ₹{limit_val:,.2f}"
                ))

        # 4. New Vendor Check
        vendor_rule = rule_map.get("new_vendor_requires_review")
        if vendor_rule and vendor_rule.bool_value:
            is_new = not vendor_info or (vendor_info.get("invoice_count", 0) == 0) or not vendor_info.get("is_verified", True)
            if is_new:
                violations_count += 1
                results.append(PolicyCheckResult(
                    policy="NEW_VENDOR",
                    rule_name=vendor_rule.name,
                    status="FAIL",
                    severity=vendor_rule.severity_if_failed,
                    risk_contribution=vendor_rule.risk_points,
                    evidence="Vendor has no approved historical invoices in system",
                    actual_value="New/Unverified Vendor",
                    threshold_value="Established Vendor"
                ))
            else:
                results.append(PolicyCheckResult(
                    policy="NEW_VENDOR",
                    rule_name=vendor_rule.name,
                    status="PASS",
                    severity="LOW",
                    evidence=f"Vendor is verified with {vendor_info.get('invoice_count', 1)} prior invoices",
                    actual_value="Established Vendor",
                    threshold_value="Established Vendor"
                ))

        # 5. Extraction Confidence Check
        conf_rule = rule_map.get("minimum_extraction_confidence")
        if conf_rule:
            min_conf = (conf_rule.threshold_value or 75.0) / 100.0
            total_conf = field_confidence.get("total", extraction_confidence)
            if total_conf < min_conf:
                violations_count += 1
                results.append(PolicyCheckResult(
                    policy="EXTRACTION_CONFIDENCE",
                    rule_name=conf_rule.name,
                    status="FAIL",
                    severity=conf_rule.severity_if_failed,
                    risk_contribution=conf_rule.risk_points,
                    evidence=f"Financial total confidence ({total_conf*100:.1f}%) is below minimum threshold of {min_conf*100:.0f}%",
                    actual_value=f"{total_conf*100:.1f}%",
                    threshold_value=f">= {min_conf*100:.0f}%"
                ))
            else:
                results.append(PolicyCheckResult(
                    policy="EXTRACTION_CONFIDENCE",
                    rule_name=conf_rule.name,
                    status="PASS",
                    severity="LOW",
                    evidence=f"Extraction confidence ({total_conf*100:.1f}%) satisfies minimum threshold",
                    actual_value=f"{total_conf*100:.1f}%",
                    threshold_value=f">= {min_conf*100:.0f}%"
                ))

        overall_status = "VIOLATION" if violations_count > 0 else "PASS"
        summary = f"{violations_count} policy violation(s) detected." if violations_count > 0 else "All configured enterprise expense policies passed."

        return PolicyEvaluationResponse(
            status=overall_status,
            total_violations=violations_count,
            policy_results=results,
            summary=summary
        )


policy_service = PolicyService()
