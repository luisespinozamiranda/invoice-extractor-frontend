import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, filter, interval, switchMap, takeWhile, take } from 'rxjs';
import { ExtractionResponse, ExtractionMetadata, ExtractionStatus } from '../../models';
import { API_ENDPOINTS } from '../../constants/api-endpoints';
import { UploadProgressService } from '../state/upload-progress.service';
import { UploadPhase } from '../../models/upload-progress.model';

@Injectable({
  providedIn: 'root'
})
export class ExtractionService {
  private http = inject(HttpClient);
  private uploadProgressService = inject(UploadProgressService);

  extractInvoice(file: File): Observable<ExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Start upload progress
    this.uploadProgressService.startUpload();

    return this.http.post<ExtractionResponse>(API_ENDPOINTS.EXTRACTIONS, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      tap((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Upload phase: 0-20%
          const uploadPercentage = event.total
            ? Math.round((event.loaded / event.total) * 20)
            : 0;
          this.uploadProgressService.updateProgress(UploadPhase.UPLOADING, uploadPercentage);
        } else if (event.type === HttpEventType.Response) {
          // Upload complete, start simulating OCR and LLM phases
          this.simulateProcessingPhases();
        }
      }),
      filter((event: HttpEvent<any>): event is HttpResponse<ExtractionResponse> =>
        event.type === HttpEventType.Response
      ),
      map((event: HttpResponse<ExtractionResponse>) => event.body!),
      catchError((error) => {
        this.uploadProgressService.setError(
          error.userMessage || 'Failed to extract invoice. Please try again.'
        );
        throw error;
      })
    );
  }

  private simulateProcessingPhases(): void {
    // Simulate OCR phase (20-70%) for 22 seconds
    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.OCR_PROCESSING, 20);
    }, 100);

    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.OCR_PROCESSING, 40);
    }, 5000);

    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.OCR_PROCESSING, 60);
    }, 12000);

    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.OCR_PROCESSING, 70);
    }, 20000);

    // Simulate LLM phase (70-90%) for 3 seconds
    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.LLM_PROCESSING, 75);
    }, 21000);

    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.LLM_PROCESSING, 85);
    }, 22500);

    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.LLM_PROCESSING, 90);
    }, 23500);

    // Simulate Saving phase (90-100%) for 1 second
    setTimeout(() => {
      this.uploadProgressService.updateProgress(UploadPhase.SAVING, 95);
    }, 24000);

    setTimeout(() => {
      this.uploadProgressService.complete();
    }, 25000);
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
