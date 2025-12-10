import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../../core/services/api/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceList implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Data
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  paginatedInvoices: Invoice[] = [];

  // State
  loading = true;
  error: string | null = null;

  // Filters
  searchTerm = '';
  selectedStatus = 'all';

  // Pagination
  pageSize = 9;
  pageIndex = 0;
  totalItems = 0;
  pageSizeOptions = [9, 18, 27, 50];

  // View mode
  viewMode: 'grid' | 'table' = 'grid';

  // Sort
  sortField: 'invoice_number' | 'client_name' | 'invoice_amount' | 'created_at' = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;

    console.log('[InvoiceList] Starting to load invoices...');

    this.invoiceService.getAllInvoices().subscribe({
      next: (invoices) => {
        console.log('[InvoiceList] Invoices received:', invoices.length, 'items');
        this.invoices = invoices;
        this.applyFilters();
        this.loading = false;
        console.log('[InvoiceList] After applyFilters:', {
          loading: this.loading,
          totalInvoices: this.invoices.length,
          filteredInvoices: this.filteredInvoices.length,
          paginatedInvoices: this.paginatedInvoices.length,
          pageSize: this.pageSize,
          pageIndex: this.pageIndex
        });
      },
      error: (error) => {
        console.error('[InvoiceList] Error loading invoices:', error);
        this.error = 'Failed to load invoices. Please try again.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.invoices];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.client_name.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === this.selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField];
      let bValue: any = b[this.sortField];

      // Handle null/undefined values
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredInvoices = filtered;
    this.totalItems = filtered.length;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.pageIndex = 0; // Reset to first page
    this.applyFilters();
  }

  onStatusChange(): void {
    this.pageIndex = 0; // Reset to first page
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
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

  viewInvoice(invoiceKey: string): void {
    // TODO: Navigate to invoice detail page
    this.router.navigate(['/invoices', invoiceKey]);
  }

  editInvoice(invoiceKey: string): void {
    // TODO: Navigate to invoice edit page
    this.router.navigate(['/invoices', invoiceKey, 'edit']);
  }

  deleteInvoice(invoice: Invoice): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: { invoiceNumber: invoice.invoice_number }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && invoice.invoice_key) {
        this.invoiceService.deleteInvoice(invoice.invoice_key).subscribe({
          next: () => {
            this.snackBar.open(`Invoice ${invoice.invoice_number} deleted successfully`, 'Close', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
            this.loadInvoices();
          },
          error: (error) => {
            console.error('Error deleting invoice:', error);
            this.snackBar.open('Failed to delete invoice. Please try again.', 'Close', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }

  get statusOptions() {
    return [
      { value: 'all', label: 'All Statuses' },
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'PAID', label: 'Paid' },
      { value: 'OVERDUE', label: 'Overdue' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: 'EXTRACTED', label: 'Extracted' }
    ];
  }
}

// Confirmation Dialog Component
@Component({
  selector: 'confirm-delete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm Delete</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete invoice <strong>{{ data.invoiceNumber }}</strong>?</p>
      <p>This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialog {
  data = inject<{ invoiceNumber: string }>(MAT_DIALOG_DATA);
}
