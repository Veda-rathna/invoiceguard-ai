from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.policy_service import policy_service
from app.schemas.policy import PolicyRuleSchema, PolicyRuleUpdate

router = APIRouter()


@router.get("", response_model=List[PolicyRuleSchema])
def list_policies(db: Session = Depends(get_db)):
    return policy_service.get_all_rules(db)


@router.put("/{rule_key}", response_model=PolicyRuleSchema)
def update_policy(rule_key: str, update_in: PolicyRuleUpdate, db: Session = Depends(get_db)):
    rule = policy_service.update_rule(db, rule_key, update_in)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Policy rule '{rule_key}' not found")
    return rule
