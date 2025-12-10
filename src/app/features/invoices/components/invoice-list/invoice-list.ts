import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceList implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  invoices: Invoice[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;

    console.log('Starting to load invoices...');

    this.invoiceService.getAllInvoices().subscribe({
      next: (invoices) => {
        console.log('Invoices loaded successfully:', invoices);
        this.invoices = invoices;
        this.loading = false;
        console.log('State after loading:', {
          loading: this.loading,
          error: this.error,
          invoiceCount: this.invoices.length
        });
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.error = 'Failed to load invoices. Please try again.';
        this.loading = false;
      },
      complete: () => {
        console.log('Observable completed');
      }
    });
  }

  goToUpload(): void {
    this.router.navigate(['/upload']);
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}
