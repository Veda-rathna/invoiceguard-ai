import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["primary_model"] == "qwen.qwen3-vl-235b-a22b"


@pytest.mark.asyncio
async def test_policies_list():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/policies")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5
        rule_keys = [r["rule_key"] for r in data]
        assert "auto_approval_limit" in rule_keys
        assert "maximum_po_variance_percent" in rule_keys


@pytest.mark.asyncio
async def test_demo_case_1_safe():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/demo/trigger-case/1")
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "AUTO_APPROVE"
        assert data["risk_score"] <= 30.0
        assert data["po_match_status"] == "EXACT_MATCH"


@pytest.mark.asyncio
async def test_demo_case_2_variance():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/demo/trigger-case/2")
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "HUMAN_REVIEW"
        assert data["po_variance_percent"] > 5.0
        assert data["risk_score"] >= 40.0


@pytest.mark.asyncio
async def test_demo_case_3_duplicate():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/demo/trigger-case/3")
        assert response.status_code == 200
        data = response.json()
        assert data["decision"] == "BLOCK"
        assert data["duplicate_probability"] >= 90.0
        assert data["risk_score"] >= 35.0


@pytest.mark.asyncio
async def test_policy_simulator():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        sim_payload = {
            "auto_approval_limit": 75000.0,
            "maximum_po_variance_percent": 10.0,
            "minimum_extraction_confidence": 70.0
        }
        response = await client.post("/api/v1/simulator/run", json=sim_payload)
        assert response.status_code == 200
        data = response.json()
        assert "baseline" in data
        assert "proposed" in data
        assert "impact_summary" in data
