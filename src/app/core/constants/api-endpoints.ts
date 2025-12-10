export const API_ENDPOINTS = {
  // Extraction endpoints
  EXTRACTIONS: '/api/v1.0/extractions',
  EXTRACTION_BY_KEY: (key: string) => `/api/v1.0/extractions/${key}`,

  // Invoice endpoints
  INVOICES: '/api/v1.0/invoices',
  INVOICE_BY_KEY: (key: string) => `/api/v1.0/invoices/${key}`,
  INVOICE_SEARCH: '/api/v1.0/invoices/search',

  // Health check
  HEALTH: '/actuator/health'
} as const;
