import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, tap, map, catchError } from 'rxjs';
import { ExtractionResponse, ExtractionMetadata } from '../../models';
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
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.Response) {
          return event.body as ExtractionResponse;
        }
        return null as any;
      }),
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

  getExtractionMetadata(key: string): Observable<ExtractionMetadata> {
    return this.http.get<ExtractionMetadata>(API_ENDPOINTS.EXTRACTION_BY_KEY(key));
  }
}
