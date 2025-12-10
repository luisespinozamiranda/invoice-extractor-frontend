export interface ExtractionMetadata {
  extraction_key: string;
  invoice_key: string;
  source_file_name: string;
  file_type: string;
  file_size_bytes: number;
  extraction_timestamp: string;
  extraction_status: ExtractionStatus;
  confidence_score: number;      // 0.0 - 1.0
  ocr_engine: string;
  extraction_data?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export enum ExtractionStatus {
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}
