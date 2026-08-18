export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  confidence: number;
}

export interface FieldEvidence {
  field: string;
  value: any;
  confidence: number;
  evidence: string;
}

export interface AuditEvent {
  id: string;
  invoice_id: string;
  agent_name: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
  timestamp: string;
  latency_ms: number;
  summary: string;
  details?: Record<string, any>;
  evidence?: string;
}

export interface RiskFactor {
  factor: string;
  category: string;
  contribution: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence?: string;
  value?: any;
}

export interface PolicyCheckResult {
  policy: string;
  rule_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_contribution: number;
  evidence: string;
  actual_value?: any;
  threshold_value?: any;
}

export interface PolicyRule {
  id: string;
  rule_key: string;
  name: string;
  description?: string;
  category: string;
  threshold_value?: number;
  bool_value?: boolean;
  string_value?: string;
  unit?: string;
  is_active: boolean;
  severity_if_failed: string;
  risk_points: number;
  updated_at?: string;
}

export interface POMatchResult {
  po_number?: string;
  found_po: boolean;
  vendor_match: boolean;
  po_match: boolean;
  item_match: boolean;
  quantity_match: boolean;
  price_match: boolean;
  total_match: boolean;
  invoice_total: number;
  po_total: number;
  variance_amount: number;
  variance_percentage: number;
  status: string;
  item_matches: Array<{
    invoice_item: string;
    po_item?: string;
    invoice_qty: number;
    po_qty?: number;
    invoice_price: number;
    po_price?: number;
    matched: boolean;
    variance_reason?: string;
  }>;
  summary: string;
}

export interface Invoice {
  id: string;
  invoice_number?: string;
  po_number?: string;
  vendor_name?: string;
  document_type: string;
  currency: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  invoice_date?: string;
  due_date?: string;
  original_filename: string;
  mime_type: string;
  document_path: string;
  created_at: string;

  extraction_confidence: number;
  field_confidence?: Record<string, number>;
  extracted_data?: Record<string, any>;
  evidence_metadata?: FieldEvidence[];

  validation_status: string;
  validation_exceptions?: Array<{
    type: string;
    severity: string;
    message: string;
    expected?: any;
    actual?: any;
  }>;

  po_match_status: string;
  po_variance_percent: number;
  po_match_details?: POMatchResult;

  policy_status: string;
  policy_results?: PolicyCheckResult[];

  anomaly_status: string;
  duplicate_probability: number;
  matched_duplicate_id?: string;
  anomaly_results?: Record<string, any>;

  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors?: RiskFactor[];

  decision: 'AUTO_APPROVE' | 'HUMAN_REVIEW' | 'BLOCK' | 'PROCESSING' | 'PENDING';
  decision_reason?: string;
  explanation?: string;

  reviewer_status: 'UNASSIGNED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO' | string;
  reviewer_user?: string;
  reviewer_decision?: string;
  reviewer_notes?: string;
  reviewed_at?: string;

  processing_latency_ms: number;
  bedrock_latency_ms: number;
  tokens_used: number;
  audit_events?: AuditEvent[];
}

export interface VendorProfile {
  id: string;
  name: string;
  tax_id?: string;
  category: string;
  is_verified: boolean;
  invoice_count: number;
  avg_invoice_amount: number;
  median_invoice_amount: number;
  max_invoice_amount: number;
  trust_score: number;
  created_at: string;
  recent_invoices?: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    decision: string;
    risk_score: number;
    created_at: string;
  }>;
}

export interface DashboardMetrics {
  total_processed: number;
  auto_approved: number;
  human_review: number;
  blocked: number;
  total_spend: number;
  automation_rate: number;
  avg_risk_score: number;
  decisions_distribution: Array<{ name: string; value: number; color: string }>;
  exceptions_breakdown: Array<{ name: string; count: number }>;
  risk_distribution: Array<{ name: string; count: number; color: string }>;
}

export interface SimulationResult {
  baseline: {
    total_invoices: number;
    auto_approved_count: number;
    human_review_count: number;
    blocked_count: number;
    automation_rate: number;
    avg_risk_score: number;
    total_spend: number;
    flagged_spend: number;
  };
  proposed: {
    total_invoices: number;
    auto_approved_count: number;
    human_review_count: number;
    blocked_count: number;
    automation_rate: number;
    avg_risk_score: number;
    total_spend: number;
    flagged_spend: number;
  };
  difference: {
    automation_rate_delta: number;
    auto_approved_delta: number;
    review_workload_reduction_count: number;
    estimated_reviewer_hours_saved: number;
    flagged_spend_delta: number;
  };
  impact_summary: string;
}
