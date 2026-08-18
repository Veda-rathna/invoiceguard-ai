from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.invoice import Invoice
from app.schemas.reviewer import SimulationRequest, SimulationResult, SimulationMetrics

router = APIRouter()


@router.post("/run", response_model=SimulationResult)
def run_policy_simulation(sim_in: SimulationRequest, db: Session = Depends(get_db)):
    """
    Simulates the operational and risk impact of changing policy thresholds across the historical invoice database.
    """
    invoices = db.query(Invoice).all()
    total_count = len(invoices)
    
    if total_count == 0:
        empty_metrics = SimulationMetrics(
            total_invoices=0,
            auto_approved_count=0,
            human_review_count=0,
            blocked_count=0,
            automation_rate=0.0,
            avg_risk_score=0.0,
            total_spend=0.0,
            flagged_spend=0.0
        )
        return SimulationResult(
            baseline=empty_metrics,
            proposed=empty_metrics,
            difference={"automation_rate_delta": 0.0, "review_workload_reduction_count": 0},
            impact_summary="No historical invoices available for simulation."
        )

    # 1. Compute Baseline Metrics from current DB records
    base_approved = sum(1 for inv in invoices if inv.decision == "AUTO_APPROVE")
    base_review = sum(1 for inv in invoices if inv.decision == "HUMAN_REVIEW")
    base_blocked = sum(1 for inv in invoices if inv.decision == "BLOCK")
    base_avg_risk = sum(inv.risk_score or 0.0 for inv in invoices) / total_count
    base_total_spend = sum(inv.total_amount or 0.0 for inv in invoices)
    base_flagged_spend = sum(inv.total_amount or 0.0 for inv in invoices if inv.decision != "AUTO_APPROVE")
    base_auto_rate = round((base_approved / total_count) * 100.0, 1)

    baseline = SimulationMetrics(
        total_invoices=total_count,
        auto_approved_count=base_approved,
        human_review_count=base_review,
        blocked_count=base_blocked,
        automation_rate=base_auto_rate,
        avg_risk_score=round(base_avg_risk, 1),
        total_spend=round(base_total_spend, 2),
        flagged_spend=round(base_flagged_spend, 2)
    )

    # 2. Simulate Counterfactual Routing under Proposed Parameters
    prop_approved = 0
    prop_review = 0
    prop_blocked = 0
    prop_flagged_spend = 0.0

    prop_auto_limit = sim_in.auto_approval_limit or 50000.0
    prop_max_variance = sim_in.maximum_po_variance_percent or 5.0
    prop_min_conf = (sim_in.minimum_extraction_confidence or 75.0) / 100.0
    prop_new_vendor_req = sim_in.new_vendor_requires_review if sim_in.new_vendor_requires_review is not None else True

    for inv in invoices:
        amt = float(inv.total_amount or 0.0)
        dup_prob = float(inv.duplicate_probability or 0.0)
        var_pct = float(inv.po_variance_percent or 0.0)
        conf = float(inv.extraction_confidence or 0.95)
        is_new_vendor = (inv.anomaly_results or {}).get("is_new_vendor", False)
        val_status = inv.validation_status or "PASS"

        # Routing simulation
        if dup_prob >= 90.0:
            prop_blocked += 1
            prop_flagged_spend += amt
        elif conf < prop_min_conf:
            prop_review += 1
            prop_flagged_spend += amt
        elif val_status == "EXCEPTION":
            prop_review += 1
            prop_flagged_spend += amt
        elif amt > prop_auto_limit:
            prop_review += 1
            prop_flagged_spend += amt
        elif abs(var_pct) > prop_max_variance and inv.po_number:
            prop_review += 1
            prop_flagged_spend += amt
        elif prop_new_vendor_req and is_new_vendor:
            prop_review += 1
            prop_flagged_spend += amt
        elif inv.risk_score and inv.risk_score <= 30.0:
            prop_approved += 1
        else:
            prop_review += 1
            prop_flagged_spend += amt

    prop_auto_rate = round((prop_approved / total_count) * 100.0, 1)
    proposed = SimulationMetrics(
        total_invoices=total_count,
        auto_approved_count=prop_approved,
        human_review_count=prop_review,
        blocked_count=prop_blocked,
        automation_rate=prop_auto_rate,
        avg_risk_score=round(base_avg_risk, 1),
        total_spend=round(base_total_spend, 2),
        flagged_spend=round(prop_flagged_spend, 2)
    )

    # Difference & Insights
    delta_rate = round(prop_auto_rate - base_auto_rate, 1)
    workload_delta = base_review - prop_review
    est_hours_saved = round(workload_delta * (8 / 60), 1)  # ~8 mins per invoice manual review

    diff = {
        "automation_rate_delta": delta_rate,
        "auto_approved_delta": prop_approved - base_approved,
        "review_workload_reduction_count": workload_delta,
        "estimated_reviewer_hours_saved": max(0.0, est_hours_saved),
        "flagged_spend_delta": round(prop_flagged_spend - base_flagged_spend, 2)
    }

    if delta_rate > 0:
        impact = f"Increasing tolerance to {prop_max_variance}% variance & ₹{prop_auto_limit:,.0f} limit unlocks +{delta_rate}% automation rate, reducing reviewer workload by {workload_delta} cases (~{est_hours_saved} hours saved)."
    elif delta_rate < 0:
        impact = f"Tightening policy parameters reduces automation rate by {abs(delta_rate)}%, routing {abs(workload_delta)} additional transactions to Human Review to mitigate financial risk."
    else:
        impact = "Policy parameters yield identical automation and review rates on current historical dataset."

    return SimulationResult(
        baseline=baseline,
        proposed=proposed,
        difference=diff,
        impact_summary=impact
    )
