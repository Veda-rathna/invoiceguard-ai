# Deterministic Risk Scoring Model

## 1. Overview

InvoiceGuard AI uses a transparent, explainable, additive risk engine that maps financial anomalies, compliance violations, and visual uncertainty to a calibrated **0 to 100** score.

```text
Risk Score = Sum(Contributing Factor Weights) + Confidence Penalty
Score normalized to [0, 100]
```

---

## 2. Risk Factors & Weight Distribution

| Risk Factor | Trigger Condition | Weight Contribution | Severity |
|---|---|---|---|
| **Potential Duplicate** | `duplicate_probability >= 90%` | +35.0 pts | CRITICAL |
| **PO Amount Variance** | `variance_percentage > 5.0%` | +15.0 to +30.0 pts | HIGH |
| **Missing Purchase Order** | Amount &gt; ₹10,000 without valid PO | +20.0 pts | HIGH |
| **Arithmetic Mismatch** | `subtotal + tax != total` (discrepancy &gt; 1.0) | +20.0 pts | HIGH |
| **Policy Violation** | Auto-approval ceiling breached | +20.0 pts | HIGH |
| **New Vendor Registration** | Unverified supplier without prior history | +15.0 pts | MEDIUM |
| **Vendor Spend Outlier** | Amount &gt; 250% of vendor historical average | +15.0 pts | MEDIUM |
| **Low Model Confidence** | Extraction confidence for total &lt; 75% | Up to +25.0 pts | MEDIUM |

---

## 3. Risk Tier Classifications & Routing Actions

```text
  0 – 30    LOW RISK       →  AUTO_APPROVE (Eligible for straight-through clearing)
 31 – 60    MEDIUM RISK    →  HUMAN_REVIEW (Secondary reviewer verification)
 61 – 80    HIGH RISK      →  HUMAN_REVIEW (Prioritized HITL review queue)
 81 – 100   CRITICAL RISK  →  BLOCK (Payment halted to prevent duplicate/fraud loss)
```
