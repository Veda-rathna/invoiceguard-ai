import time
import datetime
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from app.agents.state import InvoiceState


class BaseAgent(ABC):
    """
    Abstract base class for all specialized financial operations agents in InvoiceGuard AI.
    Standardizes state input/output, execution timing, and structured audit event creation.
    """
    name: str = "BASE_AGENT"

    async def __call__(self, state: InvoiceState) -> InvoiceState:
        start_time = time.time()
        updated_state, audit_event = await self.execute(state)
        latency_ms = (time.time() - start_time) * 1000.0
        
        if audit_event:
            audit_event["latency_ms"] = round(latency_ms, 2)
            audit_event["timestamp"] = datetime.datetime.utcnow().isoformat()
            state_events = updated_state.get("audit_events", [])
            state_events.append(audit_event)
            updated_state["audit_events"] = state_events

        return updated_state

    @abstractmethod
    async def execute(self, state: InvoiceState) -> Tuple[InvoiceState, Dict[str, Any]]:
        """
        Executes the agent logic.
        Returns: (updated_state, audit_event_dict)
        """
        pass
