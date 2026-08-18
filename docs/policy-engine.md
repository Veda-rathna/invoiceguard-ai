# Configurable Expense Policy Engine

## 1. Overview

The Policy Engine allows corporate finance operations teams to dynamically configure threshold parameters without modifying source code.

---

## 2. Default Policy Rules

| Rule Key | Rule Name | Default Parameter | Unit | Description |
|---|---|---|---|---|
| `auto_approval_limit` | Auto-Approval Ceiling | 50,000.0 | Currency (₹) | Maximum amount eligible for zero-touch straight-through automation |
| `po_required_above` | Mandatory PO Threshold | 10,000.0 | Currency (₹) | Invoices above this threshold must reference a valid Purchase Order |
| `maximum_po_variance_percent` | Allowed PO Variance | 5.0 | Percentage (%) | Maximum allowable percentage deviation between Invoice Total and approved PO Total |
| `new_vendor_requires_review` | New Vendor Review | `True` | Boolean | Requires operations review for suppliers without verified historical invoices |
| `minimum_extraction_confidence` | Minimum Extraction Confidence | 75.0 | Percentage (%) | Confidence cutoff for critical financial fields before triggering HITL escalation |
| `duplicate_similarity_threshold` | Duplicate Block Cutoff | 90.0 | Percentage (%) | Similarity score threshold for automated payment halting |

---

## 3. Policy Simulation

The **Policy Simulator** (`/simulator`) allows finance managers to run counterfactual models on historical invoices to assess the operational impact of proposed threshold modifications before saving.
