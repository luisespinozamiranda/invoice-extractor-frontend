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
import { switchMap, filter, take } from 'rxjs';

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

    console.log('[UploadPage] File selected, starting extraction');

    // Start simulating progress immediately (will show upload animation)
    this.uploadProgressService.simulateProgress();

    this.extractionService.extractInvoice(file).pipe(
      switchMap((extractionResponse) => {
        console.log('[UploadPage] Extraction API response:', extractionResponse);

        // Save extraction metadata
        this.extractionMetadata = extractionResponse;

        // Check if extraction is still processing or already completed
        const extractionKey = extractionResponse.extraction_key;

        // Check if invoice_key exists
        const invoiceKey = extractionResponse.invoice_key || (extractionResponse as any).invoiceKey;
        if (!invoiceKey) {
          throw new Error('Invoice key not found in extraction response');
        }

        // Handle already completed or failed extractions
        if (extractionResponse.extraction_status === ExtractionStatus.COMPLETED ||
            extractionResponse.extraction_status === ExtractionStatus.SUCCESS) {
          console.log('[UploadPage] Extraction already completed - finishing animation and fetching invoice');
          // Backend has responded, finish the animation
          this.uploadProgressService.finishProgress();

          // Wait for animation to complete, then fetch invoice
          return this.uploadProgressService.progress$.pipe(
            filter(progress => progress?.phase === UploadPhase.COMPLETE),
            take(1),
            switchMap(() => {
              console.log('[UploadPage] Animation complete, fetching invoice:', invoiceKey);
              return this.invoiceService.getInvoiceByKey(invoiceKey);
            })
          );
        } else if (extractionResponse.extraction_status === ExtractionStatus.FAILED) {
          console.log('[UploadPage] Extraction already failed');
          // If extraction failed, set error state
          this.uploadProgressService.setError('Extraction failed');
          throw new Error('Extraction failed');
        }

        console.log('[UploadPage] Extraction in progress, waiting for WebSocket COMPLETE event...');

        // Subscribe to WebSocket for real-time progress updates (only for PROCESSING status)
        if (extractionKey) {
          console.log('[UploadPage] Starting WebSocket subscription for key:', extractionKey);
          this.uploadProgressService.startWebSocketProgress(extractionKey);
        }

        // Wait for progress to complete via WebSocket events
        return this.uploadProgressService.progress$.pipe(
          filter(progress => progress?.phase === UploadPhase.COMPLETE),
          take(1),
          switchMap(() => {
            console.log('[UploadPage] Progress complete, fetching invoice:', invoiceKey);
            return this.invoiceService.getInvoiceByKey(invoiceKey);
          })
        );
      })
    ).subscribe({
      next: (invoice) => {
        console.log('[UploadPage] Invoice fetched successfully:', invoice);
        this.isExtracting = false;
        this.extractedInvoice = invoice;
        this.cdr.detectChanges();
        this.notificationService.success('Invoice extracted successfully!');
      },
      error: (error) => {
        console.error('[UploadPage] Extraction error:', error);
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
