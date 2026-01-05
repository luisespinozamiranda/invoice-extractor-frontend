export const ERROR_MESSAGES: Record<string, string> = {
  'INV-001': 'Invalid file type. Please upload PDF, PNG, JPG, or JPEG.',
  'INV-002': 'File too large. Maximum size is 10 MB.',
  'INV-003': 'File is empty or corrupted. Please try another file.',
  'INV-004': 'Failed to read the file. Please ensure the file is valid.',
  'INV-005': 'OCR extraction failed. The file may be corrupted or the text may not be readable.',
  'INV-006': 'Processing timed out. Please try with a smaller file.',
  'INV-007': 'Failed to extract invoice data. The document may not contain invoice information.',
  'INV-008': 'Failed to save invoice. Please try again.',
  'INV-009': 'Invoice not found.',
  'INV-010': 'Invalid invoice data. Please check the required fields.',
  'INV-011': 'Failed to update invoice. Please try again.',
  'INV-012': 'Failed to delete invoice. Please try again.',
  'INV-013': 'Database error. Please try again later.',
  'INV-014': 'LLM extraction service is not available. Using fallback extraction method.',
  'INV-015': 'Extraction service temporarily unavailable. Please try again later.',
  'INV-016': 'AI extraction service is temporarily unavailable. Using standard extraction.',
  'INV-017': 'Failed to process invoice with AI. Using fallback extraction.',
  'INV-018': 'Unable to parse AI extraction results. Using standard extraction.',
  'INV-019': 'AI returned invalid invoice data. Using fallback extraction.',
  'INV-020': 'OCR processing timed out. Please try with a smaller or clearer file.',
  'UNKNOWN': 'An unexpected error occurred. Please try again.'
};

export function getUserFriendlyMessage(errorCode?: string): string {
  if (!errorCode) {
    return ERROR_MESSAGES['UNKNOWN'];
  }
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['UNKNOWN'];
}
