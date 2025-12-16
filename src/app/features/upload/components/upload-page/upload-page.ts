import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FileDropZone } from '../file-drop-zone/file-drop-zone';
import { ExtractionProgress } from '../extraction-progress/extraction-progress';
import { ExtractionService } from '../../../../core/services/api/extraction.service';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { UploadProgressService } from '../../../../core/services/state/upload-progress.service';
import { ExtractionResponse, Invoice, ExtractionStatus } from '../../../../core/models';
import { UploadPhase } from '../../../../core/models/upload-progress.model';
import { switchMap, filter, take, skip } from 'rxjs';

@Component({
  selector: 'app-upload-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    FileDropZone,
    ExtractionProgress
  ],
  templateUrl: './upload-page.html',
  styleUrl: './upload-page.scss',
})
export class UploadPage {
  private extractionService = inject(ExtractionService);
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private uploadProgressService = inject(UploadProgressService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isExtracting = false;
  extractionMetadata: ExtractionResponse | null = null;
  extractedInvoice: Invoice | null = null;

  constructor() {
    // Upload page component initialized
  }

  onFileSelected(file: File): void {
    this.isExtracting = true;
    this.extractionMetadata = null;
    this.extractedInvoice = null;

    this.extractionService.extractInvoice(file).pipe(
      switchMap((extractionResponse) => {
        // Save extraction metadata
        this.extractionMetadata = extractionResponse;

        // Check if extraction is still processing or already completed
        const extractionKey = extractionResponse.extraction_key;

        // If extraction is still PROCESSING, use WebSocket for real-time updates
        if (extractionResponse.extraction_status === ExtractionStatus.PROCESSING && extractionKey) {
          this.uploadProgressService.startWebSocketProgress(extractionKey);
        } else if (extractionResponse.extraction_status === ExtractionStatus.COMPLETED ||
                   extractionResponse.extraction_status === ExtractionStatus.SUCCESS) {
          // If extraction already COMPLETED, restart simulated progress for better UX
          this.uploadProgressService.reset();
          this.uploadProgressService.simulateProgress();
        } else if (extractionResponse.extraction_status === ExtractionStatus.FAILED) {
          // If extraction failed, set error state
          this.uploadProgressService.setError('Extraction failed');
        }

        // Check if invoice_key exists
        const invoiceKey = extractionResponse.invoice_key || (extractionResponse as any).invoiceKey;
        if (!invoiceKey) {
          throw new Error('Invoice key not found in extraction response');
        }

        // If status is PROCESSING, start polling for status updates
        if (extractionResponse.extraction_status === ExtractionStatus.PROCESSING) {
          return this.extractionService.pollExtractionStatus(invoiceKey).pipe(
            switchMap((finalMetadata) => {
              this.extractionMetadata = finalMetadata;

              // Check if extraction was successful
              if (finalMetadata.extraction_status === ExtractionStatus.FAILED) {
                this.uploadProgressService.setError(finalMetadata.error_message || 'Extraction failed');
                throw new Error(finalMetadata.error_message || 'Extraction failed');
              }

              // Fetch invoice data after successful extraction
              return this.invoiceService.getInvoiceByKey(invoiceKey);
            })
          );
        }

        // If already SUCCESS, wait for simulated progress to complete, then fetch invoice
        return this.uploadProgressService.progress$.pipe(
          // Skip the first emission (which is the current/stale state from BehaviorSubject)
          skip(1),
          // Now wait for COMPLETE phase from the fresh simulation
          filter(progress => progress?.phase === UploadPhase.COMPLETE),
          take(1),
          switchMap(() => this.invoiceService.getInvoiceByKey(invoiceKey))
        );
      })
    ).subscribe({
      next: (invoice) => {
        this.isExtracting = false;
        this.extractedInvoice = invoice;
        this.cdr.detectChanges();
        this.notificationService.success('Invoice extracted successfully!');
      },
      error: (error) => {
        this.isExtracting = false;
        this.uploadProgressService.setError(error.userMessage || 'Extraction failed');
        this.cdr.detectChanges();
        this.notificationService.error(
          error.userMessage || 'Failed to extract invoice. Please try again.'
        );
      }
    });
  }

  viewInvoiceList(): void {
    this.router.navigate(['/invoices']);
  }

  resetUpload(): void {
    this.extractionMetadata = null;
    this.extractedInvoice = null;
    this.uploadProgressService.reset();
  }
}
