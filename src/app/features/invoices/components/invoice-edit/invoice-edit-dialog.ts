import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice, InvoiceStatus } from '../../../../core/models/invoice.model';

@Component({
  selector: 'invoice-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
  ],
  template: `
    <div class="invoice-edit-dialog">
      <div mat-dialog-title class="dialog-header">
        <h2>Edit Invoice</h2>
        <button mat-icon-button mat-dialog-close [disabled]="saving" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container" mat-dialog-content>
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading invoice...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-container" mat-dialog-content>
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p class="error-message">{{ error }}</p>
      </div>

      <!-- Edit Form -->
      <div *ngIf="!loading && !error && invoice" mat-dialog-content class="dialog-content">
        <form #invoiceForm="ngForm">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Invoice Number</mat-label>
              <input matInput [(ngModel)]="invoice.invoice_number" name="invoice_number" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Client Name</mat-label>
              <input matInput [(ngModel)]="invoice.client_name" name="client_name" required>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Client Address</mat-label>
            <input matInput [(ngModel)]="invoice.client_address" name="client_address">
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Currency</mat-label>
              <input matInput [(ngModel)]="invoice.currency" name="currency" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount</mat-label>
              <input matInput type="number" [(ngModel)]="invoice.invoice_amount" name="invoice_amount" required step="0.01">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Issue Date</mat-label>
              <input matInput [matDatepicker]="issueDatePicker" [(ngModel)]="invoice.issue_date" name="issue_date" required>
              <mat-datepicker-toggle matIconSuffix [for]="issueDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #issueDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Due Date</mat-label>
              <input matInput [matDatepicker]="dueDatePicker" [(ngModel)]="invoice.due_date" name="due_date" required>
              <mat-datepicker-toggle matIconSuffix [for]="dueDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #dueDatePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="invoice.status" name="status" required>
              <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                {{ status.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notes</mat-label>
            <textarea matInput [(ngModel)]="invoice.notes" name="notes" rows="3"></textarea>
          </mat-form-field>
        </form>
      </div>

      <!-- Dialog Actions -->
      <div mat-dialog-actions align="end" *ngIf="!loading && !error" class="dialog-actions">
        <button mat-button mat-dialog-close [disabled]="saving" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="saveInvoice()" [disabled]="saving" class="save-btn">
          <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
          <mat-icon *ngIf="!saving">save</mat-icon>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      overflow: hidden;
    }

    .invoice-edit-dialog {
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

          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;

            @media (max-width: 600px) {
              grid-template-columns: 1fr;
            }
          }

          mat-form-field {
            width: 100%;

            &.full-width {
              width: 100%;
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

        .cancel-btn {
          font-size: 15px;
          font-weight: 500;
          padding: 8px 24px;
          border-radius: 8px;
          transition: all 0.3s ease;

          mat-icon {
            margin-right: 8px;
            font-size: 20px;
          }

          &:hover:not(:disabled) {
            background: #e0e0e0;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .save-btn {
          font-size: 15px;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;

          mat-icon, mat-spinner {
            margin-right: 8px;
            font-size: 20px;
          }

          &:hover:not(:disabled) {
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transform: translateY(-2px);
          }

          &:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        }
      }
    }
  `]
})
export class InvoiceEditDialog implements OnInit {
  private invoiceService = inject(InvoiceService);
  private dialogRef = inject(MatDialogRef<InvoiceEditDialog>);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  data = inject<{ invoiceKey: string }>(MAT_DIALOG_DATA);

  invoice: Invoice | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  statusOptions = [
    { value: InvoiceStatus.PROCESSING, label: 'Processing' },
    { value: InvoiceStatus.EXTRACTED, label: 'Extracted' },
    { value: InvoiceStatus.EXTRACTION_FAILED, label: 'Extraction Failed' },
    { value: InvoiceStatus.PENDING, label: 'Pending' }
  ];

  ngOnInit(): void {
    this.loadInvoice(this.data.invoiceKey);
  }

  loadInvoice(key: string): void {
    this.loading = true;
    this.error = null;

    this.invoiceService.getInvoiceByKey(key).subscribe({
      next: (invoice) => {
        // Convert date strings to Date objects for datepicker
        this.invoice = {
          ...invoice,
          issue_date: invoice.issue_date ? new Date(invoice.issue_date) as any : invoice.issue_date,
          due_date: invoice.due_date ? new Date(invoice.due_date) as any : invoice.due_date
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.error = 'Failed to load invoice. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveInvoice(): void {
    if (!this.invoice) return;

    this.saving = true;

    // Convert Date objects back to ISO strings for API
    const issueDate = this.invoice.issue_date as any;
    const dueDate = this.invoice.due_date as any;

    const invoiceToSave = {
      ...this.invoice,
      issue_date: issueDate instanceof Date
        ? issueDate.toISOString().split('T')[0]
        : issueDate,
      due_date: dueDate instanceof Date
        ? dueDate.toISOString().split('T')[0]
        : dueDate
    };

    this.invoiceService.updateInvoice(this.data.invoiceKey, invoiceToSave).subscribe({
      next: (updatedInvoice) => {
        this.snackBar.open('Invoice updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.saving = false;
        this.cdr.detectChanges();
        this.dialogRef.close({ action: 'saved', invoice: updatedInvoice });
      },
      error: (error) => {
        console.error('Error updating invoice:', error);
        this.snackBar.open('Failed to update invoice. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
