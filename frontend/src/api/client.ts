import axios from 'axios';
import {
  Invoice,
  DashboardMetrics,
  PolicyRule,
  VendorProfile,
  SimulationResult
} from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Invoices
  uploadInvoice: async (file: File, customId?: string): Promise<Invoice> => {
    const formData = new FormData();
    formData.append('file', file);
    if (customId) formData.append('custom_id', customId);
    const res = await apiClient.post<Invoice>('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getInvoices: async (params?: {
    page?: number;
    size?: number;
    decision?: string;
    risk_level?: string;
    status?: string;
    vendor_name?: string;
  }) => {
    const res = await apiClient.get<{ items: Invoice[]; total: number; page: number; total_pages: number }>('/invoices', { params });
    return res.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  // Review Queue
  getReviewQueue: async (page = 1, size = 20) => {
    const res = await apiClient.get<{ items: Invoice[]; total: number; page: number; total_pages: number }>('/review/queue', {
      params: { page, size },
    });
    return res.data;
  },

  submitReviewAction: async (invoiceId: string, action: string, reviewerUser: string, comment?: string): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>(`/review/${invoiceId}/action`, {
      action,
      reviewer_user: reviewerUser,
      comment,
    });
    return res.data;
  },

  // Dashboard & Telemetry
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await apiClient.get<DashboardMetrics>('/analytics/dashboard');
    return res.data;
  },

  getAgentTelemetry: async () => {
    const res = await apiClient.get('/analytics/agent-telemetry');
    return res.data;
  },

  // Policies
  getPolicies: async (): Promise<PolicyRule[]> => {
    const res = await apiClient.get<PolicyRule[]>('/policies');
    return res.data;
  },

  updatePolicy: async (ruleKey: string, payload: Partial<PolicyRule>): Promise<PolicyRule> => {
    const res = await apiClient.put<PolicyRule>(`/policies/${ruleKey}`, payload);
    return res.data;
  },

  // Policy Simulator
  runSimulation: async (payload: {
    auto_approval_limit?: number;
    po_required_above?: number;
    maximum_po_variance_percent?: number;
    new_vendor_requires_review?: boolean;
    minimum_extraction_confidence?: number;
  }): Promise<SimulationResult> => {
    const res = await apiClient.post<SimulationResult>('/simulator/run', payload);
    return res.data;
  },

  // Vendors
  getVendors: async (): Promise<VendorProfile[]> => {
    const res = await apiClient.get<VendorProfile[]>('/vendors');
    return res.data;
  },

  getVendorDetails: async (id: string): Promise<VendorProfile> => {
    const res = await apiClient.get<VendorProfile>(`/vendors/${id}`);
    return res.data;
  },

  // Bedrock Diagnostics
  getBedrockStatus: async () => {
    const res = await apiClient.get('/analytics/bedrock-status');
    return res.data;
  },

  testBedrockConnection: async () => {
    const res = await apiClient.post('/analytics/test-bedrock');
    return res.data;
  },

  // Demo Presets
  triggerDemoCase: async (caseId: number): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>(`/demo/trigger-case/${caseId}`);
    return res.data;
  },
};
