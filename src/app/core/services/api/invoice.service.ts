import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../../models/invoice.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);

  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(API_ENDPOINTS.INVOICES);
  }

  getInvoiceByKey(key: string): Observable<Invoice> {
    return this.http.get<Invoice>(API_ENDPOINTS.INVOICE_BY_KEY(key));
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
