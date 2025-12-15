export interface Invoice {
  invoice_key?: string;
  invoice_number: string;
  invoice_amount: number;
  client_name: string;
  client_address: string;
  issue_date: string;           // ISO 8601 format
  due_date: string;              // ISO 8601 format
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export enum InvoiceStatus {
  PROCESSING = 'PROCESSING',
  EXTRACTED = 'EXTRACTED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  PENDING = 'PENDING'
}
