import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice, InvoiceStatus } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './invoice-edit.html',
  styleUrl: './invoice-edit.scss',
})
export class InvoiceEdit implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  invoice: Invoice | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  invoiceKey: string | null = null;

  // Status options
  statusOptions = [
    { value: InvoiceStatus.PROCESSING, label: 'Processing' },
    { value: InvoiceStatus.EXTRACTED, label: 'Extracted' },
    { value: InvoiceStatus.EXTRACTION_FAILED, label: 'Extraction Failed' },
    { value: InvoiceStatus.PENDING, label: 'Pending' }
  ];

  ngOnInit(): void {
    this.invoiceKey = this.route.snapshot.paramMap.get('key');
    if (this.invoiceKey) {
      this.loadInvoice(this.invoiceKey);
    } else {
      this.error = 'No invoice key provided';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadInvoice(key: string): void {
    this.loading = true;
    this.error = null;

    this.invoiceService.getInvoiceByKey(key).subscribe({
      next: (invoice) => {
        this.invoice = { ...invoice };
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
    if (!this.invoice || !this.invoiceKey) return;

    this.saving = true;
    this.error = null;

    this.invoiceService.updateInvoice(this.invoiceKey, this.invoice).subscribe({
      next: () => {
        this.snackBar.open('Invoice updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.saving = false;
        this.cdr.detectChanges();
        this.router.navigate(['/invoices', this.invoiceKey]);
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

  cancel(): void {
    if (this.invoiceKey) {
      this.router.navigate(['/invoices', this.invoiceKey]);
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  goBack(): void {
    this.router.navigate(['/invoices']);
  }
}
