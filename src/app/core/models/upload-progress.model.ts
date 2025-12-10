export interface UploadProgress {
  phase: UploadPhase;
  percentage: number;              // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
  startTime: Date;
  currentPhaseStartTime: Date;
}

export enum UploadPhase {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',             // 0-20%: ~3 seconds
  OCR_PROCESSING = 'OCR_PROCESSING',   // 20-70%: ~22 seconds
  LLM_PROCESSING = 'LLM_PROCESSING',   // 70-90%: ~3 seconds
  SAVING = 'SAVING',                   // 90-100%: ~1 second
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export const PHASE_MESSAGES: Record<UploadPhase, string> = {
  [UploadPhase.IDLE]: 'Ready to upload',
  [UploadPhase.UPLOADING]: 'Uploading file...',
  [UploadPhase.OCR_PROCESSING]: 'Extracting text with OCR...',
  [UploadPhase.LLM_PROCESSING]: 'Processing with AI...',
  [UploadPhase.SAVING]: 'Saving invoice...',
  [UploadPhase.COMPLETE]: 'Extraction complete!',
  [UploadPhase.ERROR]: 'Extraction failed'
};

export const PHASE_DURATIONS: Record<UploadPhase, number> = {
  [UploadPhase.IDLE]: 0,
  [UploadPhase.UPLOADING]: 3,          // 3 seconds
  [UploadPhase.OCR_PROCESSING]: 22,    // 22 seconds
  [UploadPhase.LLM_PROCESSING]: 3,     // 3 seconds
  [UploadPhase.SAVING]: 1,             // 1 second
  [UploadPhase.COMPLETE]: 0,
  [UploadPhase.ERROR]: 0
};
