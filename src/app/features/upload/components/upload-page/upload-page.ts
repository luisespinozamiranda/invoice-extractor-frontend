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

  onFileSelected(file: File): void {
    this.isExtracting = true;
    this.extractionMetadata = null;
    this.extractedInvoice = null;

    this.extractionService.extractInvoice(file).pipe(
      switchMap((extractionResponse) => {
        console.log('Extraction Response:', extractionResponse);
        // Save extraction metadata
        this.extractionMetadata = extractionResponse;

        // Check if extraction is still processing or already completed
        const extractionKey = extractionResponse.extraction_key;

        // If extraction is still PROCESSING, use WebSocket for real-time updates
        if (extractionResponse.extraction_status === ExtractionStatus.PROCESSING && extractionKey) {
          console.log('Extraction is PROCESSING, using WebSocket for real-time progress:', extractionKey);
          this.uploadProgressService.startWebSocketProgress(extractionKey);
        } else if (extractionResponse.extraction_status === ExtractionStatus.COMPLETED ||
                   extractionResponse.extraction_status === ExtractionStatus.SUCCESS) {
          // If extraction already COMPLETED, show simulated progress for better UX
          // The extraction.service already started the simulation when upload completed
          console.log('Extraction already completed successfully, showing simulated progress');
          // Don't call complete() here - let the simulation in extraction.service finish
        } else if (extractionResponse.extraction_status === ExtractionStatus.FAILED) {
          // If extraction failed, set error state
          console.log('Extraction failed');
          this.uploadProgressService.setError('Extraction failed');
        }

        // Check if invoice_key exists
        const invoiceKey = extractionResponse.invoice_key || (extractionResponse as any).invoiceKey;
        if (!invoiceKey) {
          console.error('No invoice_key found in response:', extractionResponse);
          throw new Error('Invoice key not found in extraction response');
        }

        // If status is PROCESSING, start polling for status updates
        if (extractionResponse.extraction_status === ExtractionStatus.PROCESSING) {
          console.log('Extraction is still processing, starting polling...');
          return this.extractionService.pollExtractionStatus(invoiceKey).pipe(
            switchMap((finalMetadata) => {
              console.log('Final extraction status:', finalMetadata.extraction_status);
              this.extractionMetadata = finalMetadata;

              // Check if extraction was successful
              if (finalMetadata.extraction_status === ExtractionStatus.FAILED) {
                this.uploadProgressService.setError(finalMetadata.error_message || 'Extraction failed');
                throw new Error(finalMetadata.error_message || 'Extraction failed');
              }

              // Fetch invoice data after successful extraction
              console.log('Fetching invoice with key:', invoiceKey);
              return this.invoiceService.getInvoiceByKey(invoiceKey);
            })
          );
        }

        // If already SUCCESS, wait for simulated progress to complete, then fetch invoice
        console.log('Waiting for progress animation to complete before fetching invoice...');

        // Wait for progress to reach 100% (COMPLETE phase)
        return this.uploadProgressService.progress$.pipe(
          filter(progress => progress?.phase === UploadPhase.COMPLETE),
          take(1),
          switchMap(() => {
            console.log('Progress animation complete, fetching invoice with key:', invoiceKey);
            return this.invoiceService.getInvoiceByKey(invoiceKey);
          })
        );
      })
    ).subscribe({
      next: (invoice) => {
        console.log('Invoice fetched successfully:', invoice);
        this.isExtracting = false;
        this.extractedInvoice = invoice;
        this.cdr.detectChanges();
        this.notificationService.success('Invoice extracted successfully!');
      },
      error: (error) => {
        console.error('Error during extraction:', error);
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
