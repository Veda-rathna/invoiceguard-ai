import os
import json
import random
import uuid
import datetime
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
SAMPLE_IMAGES_DIR = os.path.join(OUTPUT_DIR, "sample_invoices")
os.makedirs(SAMPLE_IMAGES_DIR, exist_ok=True)

CATEGORIES = ["Hardware & IT", "Cloud Infrastructure", "Professional Services", "Office Supplies", "Software Subscriptions", "Facilities & Maintenance", "Logistics", "Marketing & Advertising"]

COMPANY_NAMES = [
    "TechNova Solutions", "CloudPeak Infotech", "Zenith Hardware Labs", "Precision Networks",
    "Apex Cyber Systems", "Vanguard Cloud Services", "BlueMatrix Analytics", "Vertex Systems",
    "Nexus IT World", "Quantum Micro Labs", "Aegis Digital Security", "CyberByte Tech",
    "Starlight Media Group", "Horizon Facility Services", "Titanium Supplies", "SilverLine Logistics",
    "Alpha Enterprise Tools", "Delta Cloudworks", "Sigma Consultants", "OmniTech Global"
]

ITEMS_CATALOG = [
    ("Developer Laptop Workstation 16GB", 21000.0, "Hardware & IT"),
    ("Enterprise Cloud Server Node - 64 Core", 65000.0, "Cloud Infrastructure"),
    ("High-Speed Managed Gigabit Switch", 12500.0, "Hardware & IT"),
    ("Quarterly Financial Audit and Compliance Review", 45000.0, "Professional Services"),
    ("Cloud Storage 10TB S3 Tier Annual", 18000.0, "Cloud Infrastructure"),
    ("Ergonomic Mesh Office Executive Chair", 8500.0, "Office Supplies"),
    ("4K Ultra-HD Monitor 27-inch IPS", 19500.0, "Hardware & IT"),
    ("Enterprise CRM Annual License - 25 Users", 75000.0, "Software Subscriptions"),
    ("Security Operations Center Managed Retainer", 55000.0, "Professional Services"),
    ("Premium Conference Room AV System", 32000.0, "Office Supplies")
]


def generate_dataset():
    random.seed(42)
    print("Generating 100 Vendors...")
    vendors = []
    for i in range(100):
        name = f"{random.choice(COMPANY_NAMES)} {i+1}"
        cat = random.choice(CATEGORIES)
        avg_spend = round(random.uniform(15000.0, 85000.0), 2)
        v = {
            "id": f"ven_{i+1:04d}",
            "name": name,
            "tax_id": f"{random.randint(10,35)}AABC{random.randint(1000,9999)}R1Z{random.choice('MNPQRST')}",
            "category": cat,
            "invoice_count": random.randint(5, 45),
            "avg_invoice_amount": avg_spend,
            "median_invoice_amount": round(avg_spend * random.uniform(0.9, 1.05), 2),
            "trust_score": round(random.uniform(85.0, 99.0), 1),
            "is_verified": True
        }
        vendors.append(v)

    print("Generating 300 Purchase Orders...")
    purchase_orders = []
    for i in range(300):
        vendor = random.choice(vendors)
        po_num = f"PO-{10000 + i}"
        item_desc, unit_price, cat = random.choice(ITEMS_CATALOG)
        qty = float(random.randint(1, 4))
        subtotal = round(unit_price * qty, 2)
        tax = round(subtotal * 0.18, 2)
        total = round(subtotal + tax, 2)

        po = {
            "id": f"po_{i+1:04d}",
            "po_number": po_num,
            "vendor_name": vendor["name"],
            "subtotal": subtotal,
            "tax": tax,
            "total_amount": total,
            "currency": "INR",
            "department": random.choice(["Engineering", "Operations", "Finance", "IT Support"]),
            "items": [
                {
                    "description": item_desc,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "total_price": subtotal,
                    "category": cat
                }
            ]
        }
        purchase_orders.append(po)

    print("Generating 500 Invoices with Target Ground Truth Distribution...")
    invoices = []
    # Distribution:
    # 60% Normal (300) -> AUTO_APPROVE
    # 10% Amount Mismatch / PO Variance (50) -> HUMAN_REVIEW
    # 8% Missing PO (40) -> HUMAN_REVIEW
    # 7% Duplicate (35) -> BLOCK
    # 5% New Vendor (25) -> HUMAN_REVIEW
    # 5% Policy Violation (25) -> HUMAN_REVIEW
    # 5% Low Confidence / Quality (25) -> HUMAN_REVIEW

    scenarios = (
        ["NORMAL"] * 300 +
        ["PO_VARIANCE"] * 50 +
        ["MISSING_PO"] * 40 +
        ["DUPLICATE"] * 35 +
        ["NEW_VENDOR"] * 25 +
        ["POLICY_VIOLATION"] * 25 +
        ["LOW_CONFIDENCE"] * 25
    )
    random.shuffle(scenarios)

    for idx, scenario in enumerate(scenarios, start=1):
        inv_id = f"INV-{idx:05d}"
        created_date = (datetime.date.today() - datetime.timedelta(days=random.randint(1, 90))).isoformat()
        
        if scenario == "NORMAL":
            po = random.choice(purchase_orders)
            vendor_name = po["vendor_name"]
            po_num = po["po_number"]
            subtotal = po["subtotal"]
            tax = po["tax"]
            total = po["total_amount"]
            items = po["items"]
            expected_decision = "AUTO_APPROVE"
            expected_exception = None
            risk_expected = "LOW"
            conf = 0.98

        elif scenario == "PO_VARIANCE":
            po = random.choice(purchase_orders)
            vendor_name = po["vendor_name"]
            po_num = po["po_number"]
            # Inflate subtotal by 8% - 20%
            inflation_factor = random.uniform(1.08, 1.25)
            subtotal = round(po["subtotal"] * inflation_factor, 2)
            tax = round(subtotal * 0.18, 2)
            total = round(subtotal + tax, 2)
            items = [{"description": po["items"][0]["description"], "quantity": po["items"][0]["quantity"], "unit_price": round(po["items"][0]["unit_price"] * inflation_factor, 2), "total": subtotal}]
            expected_decision = "HUMAN_REVIEW"
            expected_exception = "PO_VARIANCE"
            risk_expected = "HIGH"
            conf = 0.96

        elif scenario == "MISSING_PO":
            vendor = random.choice(vendors)
            vendor_name = vendor["name"]
            po_num = None  # Missing PO
            item_desc, unit_price, cat = random.choice(ITEMS_CATALOG)
            qty = float(random.randint(2, 5))
            subtotal = round(unit_price * qty, 2)
            tax = round(subtotal * 0.18, 2)
            total = round(subtotal + tax, 2)
            items = [{"description": item_desc, "quantity": qty, "unit_price": unit_price, "total": subtotal}]
            expected_decision = "HUMAN_REVIEW"
            expected_exception = "MISSING_PO"
            risk_expected = "HIGH"
            conf = 0.95

        elif scenario == "DUPLICATE":
            po = random.choice(purchase_orders)
            vendor_name = po["vendor_name"]
            po_num = po["po_number"]
            subtotal = po["subtotal"]
            tax = po["tax"]
            total = po["total_amount"]
            items = po["items"]
            expected_decision = "BLOCK"
            expected_exception = "DUPLICATE"
            risk_expected = "CRITICAL"
            conf = 0.97

        elif scenario == "NEW_VENDOR":
            vendor_name = f"Unregistered Frontier Labs {idx}"
            po_num = None
            subtotal = 38000.0
            tax = 6840.0
            total = 44840.0
            items = [{"description": "Specialized R&D Hardware Board", "quantity": 1.0, "unit_price": 38000.0, "total": 38000.0}]
            expected_decision = "HUMAN_REVIEW"
            expected_exception = "NEW_VENDOR"
            risk_expected = "MEDIUM"
            conf = 0.94

        elif scenario == "POLICY_VIOLATION":
            vendor = random.choice(vendors)
            vendor_name = vendor["name"]
            po = random.choice(purchase_orders)
            po_num = po["po_number"]
            # Total exceeds ₹50,000 auto approval limit
            subtotal = round(random.uniform(60000.0, 120000.0), 2)
            tax = round(subtotal * 0.18, 2)
            total = round(subtotal + tax, 2)
            items = [{"description": "High-End Server Array Upgrade", "quantity": 1.0, "unit_price": subtotal, "total": subtotal}]
            expected_decision = "HUMAN_REVIEW"
            expected_exception = "AUTO_APPROVAL_LIMIT"
            risk_expected = "MEDIUM"
            conf = 0.96

        else:  # LOW_CONFIDENCE
            vendor = random.choice(vendors)
            vendor_name = vendor["name"]
            po_num = "PO-8888"
            subtotal = 22000.0
            tax = 3960.0
            total = 25960.0
            items = [{"description": "Blurry Scan Supplies", "quantity": 1.0, "unit_price": 22000.0, "total": 22000.0}]
            expected_decision = "HUMAN_REVIEW"
            expected_exception = "LOW_CONFIDENCE"
            risk_expected = "MEDIUM"
            conf = 0.52

        inv = {
            "invoice_id": inv_id,
            "scenario": scenario,
            "vendor_name": vendor_name,
            "invoice_number": f"INV-2026-{idx:04d}",
            "invoice_date": created_date,
            "po_number": po_num,
            "currency": "INR",
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "line_items": items,
            "extraction_confidence": conf,
            "expected_decision": expected_decision,
            "expected_exception": expected_exception,
            "expected_risk_level": risk_expected
        }
        invoices.append(inv)

    dataset = {
        "metadata": {
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "total_vendors": len(vendors),
            "total_purchase_orders": len(purchase_orders),
            "total_invoices": len(invoices),
            "distribution_summary": {
                "normal_auto_approve": 300,
                "po_variance": 50,
                "missing_po": 40,
                "duplicate": 35,
                "new_vendor": 25,
                "policy_violation": 25,
                "low_confidence": 25
            }
        },
        "vendors": vendors,
        "purchase_orders": purchase_orders,
        "invoices": invoices
    }

    gt_file = os.path.join(OUTPUT_DIR, "synthetic_ground_truth.json")
    with open(gt_file, "w") as f:
        json.dump(dataset, f, indent=2)

    print(f"Synthetic ground-truth dataset successfully written to {gt_file}")
    return dataset


if __name__ == "__main__":
    generate_dataset()
