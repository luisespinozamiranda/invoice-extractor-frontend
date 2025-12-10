import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FileDropZone } from '../file-drop-zone/file-drop-zone';
import { ExtractionProgress } from '../extraction-progress/extraction-progress';
import { ExtractionService } from '../../../../core/services/api/extraction.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { UploadProgressService } from '../../../../core/services/state/upload-progress.service';
import { ExtractionResponse } from '../../../../core/models';

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
  private notificationService = inject(NotificationService);
  private uploadProgressService = inject(UploadProgressService);
  private router = inject(Router);

  isExtracting = false;
  extractedInvoice: ExtractionResponse | null = null;

  onFileSelected(file: File): void {
    this.isExtracting = true;
    this.extractedInvoice = null;

    this.extractionService.extractInvoice(file).subscribe({
      next: (response) => {
        this.isExtracting = false;
        this.extractedInvoice = response;
        this.notificationService.success('Invoice extracted successfully!');
      },
      error: (error) => {
        this.isExtracting = false;
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
    this.extractedInvoice = null;
    this.uploadProgressService.reset();
  }
}
