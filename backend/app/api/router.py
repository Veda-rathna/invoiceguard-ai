from fastapi import APIRouter

from app.api.endpoints import invoices, review, purchase_orders, policies, vendors, simulator, analytics, demo

api_router = APIRouter()

api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(review.router, prefix="/review", tags=["HITL Review Queue"])
api_router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["Purchase Orders"])
api_router.include_router(policies.router, prefix="/policies", tags=["Expense Policies"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Policy Simulator"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Telemetry"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo Presets"])
