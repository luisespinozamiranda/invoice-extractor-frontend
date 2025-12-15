import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetail implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  invoice: Invoice | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const invoiceKey = this.route.snapshot.paramMap.get('key');
    if (invoiceKey) {
      this.loadInvoice(invoiceKey);
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

  goBack(): void {
    this.router.navigate(['/invoices']);
  }

  editInvoice(): void {
    if (this.invoice?.invoice_key) {
      this.router.navigate(['/invoices', this.invoice.invoice_key, 'edit']);
    }
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
