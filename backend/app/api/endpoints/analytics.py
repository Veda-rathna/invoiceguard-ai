from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.invoice import Invoice
from app.models.audit import AuditEvent
from app.services.bedrock_service import bedrock_service
from app.core.config import settings

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Returns enterprise finance KPI statistics and analytics distributions for the main dashboard.
    """
    total_invoices = db.query(Invoice).count()
    if total_invoices == 0:
        return {
            "total_processed": 0,
            "auto_approved": 0,
            "human_review": 0,
            "blocked": 0,
            "total_spend": 0.0,
            "automation_rate": 0.0,
            "avg_risk_score": 0.0,
            "decisions_distribution": [],
            "exceptions_breakdown": [],
            "risk_distribution": [],
            "recent_activity": []
        }

    auto_approved = db.query(Invoice).filter(Invoice.decision == "AUTO_APPROVE").count()
    human_review = db.query(Invoice).filter(Invoice.decision == "HUMAN_REVIEW").count()
    blocked = db.query(Invoice).filter(Invoice.decision == "BLOCK").count()
    
    total_spend = db.query(func.sum(Invoice.total_amount)).scalar() or 0.0
    avg_risk = db.query(func.avg(Invoice.risk_score)).scalar() or 0.0
    automation_rate = round((auto_approved / total_invoices) * 100.0, 1) if total_invoices > 0 else 0.0

    # Decision distribution
    decisions = [
        {"name": "Auto Approved", "value": auto_approved, "color": "#10B981"},
        {"name": "Human Review", "value": human_review, "color": "#F59E0B"},
        {"name": "Blocked / Escalated", "value": blocked, "color": "#EF4444"}
    ]

    # Risk Distribution
    risk_low = db.query(Invoice).filter(Invoice.risk_level == "LOW").count()
    risk_med = db.query(Invoice).filter(Invoice.risk_level == "MEDIUM").count()
    risk_high = db.query(Invoice).filter(Invoice.risk_level == "HIGH").count()
    risk_crit = db.query(Invoice).filter(Invoice.risk_level == "CRITICAL").count()

    risk_dist = [
        {"name": "Low Risk (0-30)", "count": risk_low, "color": "#10B981"},
        {"name": "Medium Risk (31-60)", "count": risk_med, "color": "#3B82F6"},
        {"name": "High Risk (61-80)", "count": risk_high, "color": "#F59E0B"},
        {"name": "Critical Risk (81-100)", "count": risk_crit, "color": "#EF4444"}
    ]

    # Exception categories breakdown
    po_variance_count = db.query(Invoice).filter(Invoice.po_variance_percent > 5.0).count()
    missing_po_count = db.query(Invoice).filter(Invoice.po_match_status == "PO_NOT_FOUND").count()
    duplicate_count = db.query(Invoice).filter(Invoice.duplicate_probability >= 80.0).count()
    policy_viol_count = db.query(Invoice).filter(Invoice.policy_status == "VIOLATION").count()
    low_conf_count = db.query(Invoice).filter(Invoice.extraction_confidence < 0.75).count()
    arith_count = db.query(Invoice).filter(Invoice.validation_status == "EXCEPTION").count()

    exceptions_breakdown = [
        {"name": "PO Variance > 5%", "count": po_variance_count},
        {"name": "Missing Purchase Order", "count": missing_po_count},
        {"name": "Potential Duplicate", "count": duplicate_count},
        {"name": "Policy Violation", "count": policy_viol_count},
        {"name": "Low Model Confidence", "count": low_conf_count},
        {"name": "Arithmetic Mismatch", "count": arith_count}
    ]

    return {
        "total_processed": total_invoices,
        "auto_approved": auto_approved,
        "human_review": human_review,
        "blocked": blocked,
        "total_spend": round(total_spend, 2),
        "automation_rate": automation_rate,
        "avg_risk_score": round(avg_risk, 1),
        "decisions_distribution": decisions,
        "exceptions_breakdown": exceptions_breakdown,
        "risk_distribution": risk_dist
    }


@router.get("/agent-telemetry")
def get_agent_telemetry(db: Session = Depends(get_db)):
    """
    Returns multi-agent performance telemetry, execution latencies, and Amazon Bedrock metrics.
    """
    events = db.query(AuditEvent).all()
    
    agent_latencies = {}
    for ev in events:
        agent = ev.agent_name
        if agent not in agent_latencies:
            agent_latencies[agent] = []
        if ev.latency_ms > 0:
            agent_latencies[agent].append(ev.latency_ms)

    agent_metrics = []
    for agent, lat_list in agent_latencies.items():
        avg_lat = sum(lat_list) / len(lat_list) if lat_list else 0.0
        agent_metrics.append({
            "agent": agent,
            "invocations": len(lat_list),
            "avg_latency_ms": round(avg_lat, 1),
            "p95_latency_ms": round(sorted(lat_list)[int(len(lat_list) * 0.95)] if lat_list else 0.0, 1)
        })

    avg_bedrock_lat = db.query(func.avg(Invoice.bedrock_latency_ms)).scalar() or 0.0
    avg_total_lat = db.query(func.avg(Invoice.processing_latency_ms)).scalar() or 0.0
    total_tokens = db.query(func.sum(Invoice.tokens_used)).scalar() or 0

    return {
        "primary_model": settings.BEDROCK_MODEL_ID,
        "provider": "Amazon Bedrock Runtime",
        "aws_region": settings.AWS_REGION,
        "demo_mode": settings.DEMO_MODE,
        "client_initialized": bedrock_service.client is not None,
        "avg_bedrock_latency_ms": round(avg_bedrock_lat, 1),
        "avg_end_to_end_latency_ms": round(avg_total_lat, 1),
        "total_tokens_consumed": total_tokens,
        "agents": agent_metrics
    }


@router.get("/bedrock-status")
def get_bedrock_status():
    """
    Returns the real-time connectivity status and configuration of Amazon Bedrock Runtime.
    """
    return {
        "model_id": settings.BEDROCK_MODEL_ID,
        "region": settings.AWS_REGION,
        "demo_mode": settings.DEMO_MODE,
        "client_initialized": bedrock_service.client is not None,
        "has_explicit_keys": bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)
    }


@router.post("/test-bedrock")
def test_bedrock_connection():
    """
    Actively sends a test ping request to Amazon Bedrock Runtime to verify credentials and model accessibility.
    """
    return bedrock_service.check_connection()
