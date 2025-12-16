import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, filter, interval, switchMap, takeWhile, take } from 'rxjs';
import { ExtractionResponse, ExtractionMetadata, ExtractionStatus } from '../../models';
import { API_ENDPOINTS } from '../../constants/api-endpoints';
import { UploadProgressService } from '../state/upload-progress.service';

@Injectable({
  providedIn: 'root'
})
export class ExtractionService {
  private http = inject(HttpClient);
  private uploadProgressService = inject(UploadProgressService);

  extractInvoice(file: File): Observable<ExtractionResponse> {
    console.log('[ExtractionService] Starting extraction for file:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ExtractionResponse>(API_ENDPOINTS.EXTRACTIONS, formData).pipe(
      tap((response) => {
        console.log('[ExtractionService] Extraction response body:', response);
      }),
      catchError((error) => {
        console.error('[ExtractionService] Extraction error:', error);
        this.uploadProgressService.setError(
          error.userMessage || 'Failed to extract invoice. Please try again.'
        );
        throw error;
      })
    );
  }

  getExtractionMetadataByInvoiceKey(invoiceKey: string): Observable<ExtractionMetadata> {
    return this.http.get<ExtractionMetadata>(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
  }

  /**
   * Polls the extraction status until it's no longer PROCESSING
   * @param invoiceKey - The invoice key to poll
   * @param pollingInterval - Interval in milliseconds (default: 2000ms)
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @returns Observable that emits the final extraction metadata
   */
  pollExtractionStatus(
    invoiceKey: string,
    pollingInterval: number = 2000,
    maxAttempts: number = 30
  ): Observable<ExtractionMetadata> {
    return interval(pollingInterval).pipe(
      switchMap(() => this.getExtractionMetadataByInvoiceKey(invoiceKey)),
      tap((metadata) => {
        console.log('Polling extraction status:', metadata.extraction_status);
      }),
      takeWhile(
        (metadata, index) => {
          // Continue polling if status is PROCESSING and we haven't exceeded max attempts
          const shouldContinue = metadata.extraction_status === ExtractionStatus.PROCESSING && index < maxAttempts;
          return shouldContinue;
        },
        true // inclusive: emit the final value that doesn't meet the condition
      ),
      filter((metadata) => metadata.extraction_status !== ExtractionStatus.PROCESSING),
      take(1) // Only take the first non-PROCESSING status
    );
  }
}
