import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'invoice-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="invoice-detail-dialog">
      <div mat-dialog-title class="dialog-header">
        <h2>Invoice Details</h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container" mat-dialog-content>
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading invoice details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container" mat-dialog-content>
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p class="error-message">{{ error }}</p>
      </div>

      <!-- Invoice Details -->
      <div *ngIf="!loading && !error && invoice" mat-dialog-content class="dialog-content">
        <!-- Invoice Header -->
        <div class="invoice-header">
          <h3 class="invoice-number">{{ invoice.invoice_number }}</h3>
          <mat-chip [class]="'status-chip status-' + invoice.status.toLowerCase()">
            {{ invoice.status }}
          </mat-chip>
        </div>

        <!-- Details Grid -->
        <div class="details-grid">
          <!-- Client Information -->
          <div class="detail-section">
            <h4>Client Information</h4>
            <div class="detail-row">
              <span class="label">Client Name:</span>
              <span class="value">{{ invoice.client_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Address:</span>
              <span class="value">{{ invoice.client_address || 'N/A' }}</span>
            </div>
          </div>

          <!-- Invoice Information -->
          <div class="detail-section">
            <h4>Invoice Information</h4>
            <div class="detail-row">
              <span class="label">Invoice Number:</span>
              <span class="value">{{ invoice.invoice_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value amount">{{ invoice.currency }} {{ invoice.invoice_amount | number:'1.2-2' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Currency:</span>
              <span class="value">{{ invoice.currency }}</span>
            </div>
          </div>

          <!-- Dates -->
          <div class="detail-section">
            <h4>Dates</h4>
            <div class="detail-row">
              <span class="label">Created At:</span>
              <span class="value">{{ formatDate(invoice.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Updated At:</span>
              <span class="value">{{ formatDate(invoice.updated_at) }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="detail-section full-width" *ngIf="invoice.notes">
            <h4>Notes</h4>
            <p class="notes-content">{{ invoice.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div mat-dialog-actions align="end" *ngIf="!loading && !error" class="dialog-actions">
        <button mat-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
          Close
        </button>
        <button mat-raised-button color="primary" (click)="editInvoice()" class="edit-btn">
          <mat-icon>edit</mat-icon>
          Edit
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      overflow: hidden;
    }

    .invoice-detail-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;

      .dialog-header {
        display: grid;
        grid-template-columns: 48px 1fr 48px;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 24px;
        margin: -24px -24px 0 -24px;
        flex-shrink: 0;
        gap: 8px;

        h2 {
          grid-column: 2;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
        }

        .close-button {
          grid-column: 3;
          justify-self: end;
          color: white;
          background: rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
          width: 40px;
          height: 40px;

          &:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
          }

          mat-icon {
            font-size: 22px;
          }
        }
      }

      .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        min-height: 300px;
        flex: 1;
        overflow: hidden;

        p {
          margin-top: 16px;
          color: #666;
        }
      }

      .error-container {
        .error-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #f44336;
        }

        .error-message {
          color: #c62828;
          font-size: 16px;
        }
      }

      .dialog-content {
        padding: 24px !important;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;

          .invoice-number {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #333;
          }

          .status-chip {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;

            &.status-processing { background-color: #fff9c4; color: #f57f17; }
            &.status-extracted { background-color: #c8e6c9; color: #2e7d32; }
            &.status-extraction_failed { background-color: #ffcdd2; color: #c62828; }
            &.status-pending { background-color: #ffe0b2; color: #e65100; }
          }
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;

          .detail-section {
            h4 {
              font-size: 16px;
              font-weight: 600;
              color: #667eea;
              margin: 0 0 12px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #f0f0f0;
            }

            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f8f9fa;

              &:last-child {
                border-bottom: none;
              }

              .label {
                font-weight: 600;
                color: #666;
                flex: 0 0 45%;
              }

              .value {
                color: #333;
                text-align: right;
                flex: 1;

                &.amount {
                  font-size: 18px;
                  font-weight: 700;
                  color: #4caf50;
                }
              }
            }

            &.full-width {
              .notes-content {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 8px;
                color: #333;
                line-height: 1.6;
                margin: 0;
              }
            }
          }
        }
      }

      .dialog-actions {
        padding: 20px 24px;
        margin: 0 -24px -24px -24px;
        border-top: 1px solid #e0e0e0;
        background: #f8f9fa;
        gap: 12px;
        flex-shrink: 0;

        .close-btn {
          font-size: 15px;
          font-weight: 500;
          padding: 8px 24px;
          border-radius: 8px;
          transition: all 0.3s ease;

          mat-icon {
            margin-right: 8px;
            font-size: 20px;
          }

          &:hover {
            background: #e0e0e0;
          }
        }

        .edit-btn {
          font-size: 15px;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;

          mat-icon {
            margin-right: 8px;
            font-size: 20px;
          }

          &:hover {
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
          }
        }
      }
    }
  `]
})
export class InvoiceDetailDialog implements OnInit {
  private invoiceService = inject(InvoiceService);
  private dialogRef = inject(MatDialogRef<InvoiceDetailDialog>);
  private cdr = inject(ChangeDetectorRef);
  data = inject<{ invoiceKey: string }>(MAT_DIALOG_DATA);

  invoice: Invoice | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadInvoice(this.data.invoiceKey);
  }

  loadInvoice(key: string): void {
    this.loading = true;
    this.error = null;

    this.invoiceService.getInvoiceByKey(key).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.error = 'Failed to load invoice details. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editInvoice(): void {
    this.dialogRef.close({ action: 'edit', invoice: this.invoice });
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}
