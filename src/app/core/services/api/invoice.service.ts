import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { map, timeout, catchError } from 'rxjs/operators';
import { Invoice } from '../../models/invoice.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);

  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<any[]>(API_ENDPOINTS.INVOICES).pipe(
      timeout(30000), // 30 seconds timeout
      map((arr: any[]) => arr.map((raw: any) => ({
        invoice_key: raw.invoice_key ?? raw.invoiceKey,
        invoice_number: raw.invoice_number ?? raw.invoiceNumber,
        invoice_amount: raw.invoice_amount ?? raw.invoiceAmount,
        client_name: raw.client_name ?? raw.clientName,
        client_address: raw.client_address ?? raw.clientAddress,
        issue_date: raw.issue_date ?? raw.issueDate,
        due_date: raw.due_date ?? raw.dueDate,
        currency: raw.currency,
        status: raw.status,
        notes: raw.notes,
        created_at: raw.created_at ?? raw.createdAt,
        updated_at: raw.updated_at ?? raw.updatedAt,
        is_deleted: raw.is_deleted ?? raw.isDeleted
      }))),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          console.error('[InvoiceService] Request timeout after 30 seconds');
          return throwError(() => new Error('Request timed out. The server might be sleeping (Render free tier). Please wait a moment and try again.'));
        }
        console.error('[InvoiceService] Error fetching invoices:', error);
        return throwError(() => error);
      })
    );
  }

  getInvoiceByKey(key: string): Observable<Invoice> {
    console.log('[InvoiceService] Fetching invoice by key:', key);
    return this.http.get<Invoice>(API_ENDPOINTS.INVOICE_BY_KEY(key)).pipe(
      map((invoice) => {
        console.log('[InvoiceService] Invoice fetched successfully:', invoice);
        return invoice;
      }),
      catchError((error) => {
        console.error('[InvoiceService] Error fetching invoice by key:', key, error);
        return throwError(() => error);
      })
    );
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(API_ENDPOINTS.INVOICES, invoice);
  }

  updateInvoice(key: string, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(API_ENDPOINTS.INVOICE_BY_KEY(key), invoice);
  }

  deleteInvoice(key: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.INVOICE_BY_KEY(key));
  }

  searchByClientName(clientName: string): Observable<Invoice[]> {
    const params = new HttpParams().set('clientName', clientName);
    return this.http.get<Invoice[]>(API_ENDPOINTS.INVOICE_SEARCH, { params });
  }
}
