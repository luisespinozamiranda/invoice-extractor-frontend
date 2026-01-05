import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvoiceService } from './invoice.service';
import { Invoice, InvoiceStatus } from '../../models/invoice.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;

  const mockInvoice: Invoice = {
    invoice_key: 'test-key-123',
    invoice_number: 'INV-001',
    invoice_amount: 1000.00,
    client_name: 'Test Client',
    client_address: '123 Test St',
    currency: 'USD',
    status: InvoiceStatus.EXTRACTED,
    original_file_name: 'test.pdf',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_deleted: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvoiceService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllInvoices', () => {
    it('should retrieve all invoices with snake_case fields', (done) => {
      const mockInvoices: Invoice[] = [mockInvoice];

      service.getAllInvoices().subscribe({
        next: (invoices) => {
          expect(invoices.length).toBe(1);
          expect(invoices[0]).toEqual(mockInvoice);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICES);
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoices);
    });

    it('should map camelCase API response to snake_case', (done) => {
      const camelCaseResponse = [{
        invoiceKey: 'test-key-123',
        invoiceNumber: 'INV-001',
        invoiceAmount: 1000.00,
        clientName: 'Test Client',
        clientAddress: '123 Test St',
        currency: 'USD',
        status: 'EXTRACTED',
        originalFileName: 'test.pdf',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isDeleted: false
      }];

      service.getAllInvoices().subscribe({
        next: (invoices) => {
          expect(invoices[0]).toEqual(mockInvoice);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICES);
      req.flush(camelCaseResponse);
    });

    it('should handle timeout errors', (done) => {
      service.getAllInvoices().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('504 Gateway Timeout');
          done();
        }
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICES);
      req.flush(null, { status: 504, statusText: 'Gateway Timeout' });
    });

    it('should handle general errors', (done) => {
      service.getAllInvoices().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICES);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getInvoiceByKey', () => {
    it('should retrieve a single invoice by key', (done) => {
      const invoiceKey = 'test-key-123';

      service.getInvoiceByKey(invoiceKey).subscribe({
        next: (invoice) => {
          expect(invoice).toEqual(mockInvoice);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICE_BY_KEY(invoiceKey));
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoice);
    });

    it('should handle 404 errors when invoice not found', (done) => {
      const invoiceKey = 'non-existent-key';

      service.getInvoiceByKey(invoiceKey).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICE_BY_KEY(invoiceKey));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createInvoice', () => {
    it('should create a new invoice', (done) => {
      service.createInvoice(mockInvoice).subscribe({
        next: (invoice) => {
          expect(invoice).toEqual(mockInvoice);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockInvoice);
      req.flush(mockInvoice);
    });
  });

  describe('updateInvoice', () => {
    it('should update an existing invoice', (done) => {
      const invoiceKey = 'test-key-123';
      const updatedInvoice = { ...mockInvoice, invoice_amount: 2000.00 };

      service.updateInvoice(invoiceKey, updatedInvoice).subscribe({
        next: (invoice) => {
          expect(invoice).toEqual(updatedInvoice);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICE_BY_KEY(invoiceKey));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedInvoice);
      req.flush(updatedInvoice);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete an invoice', (done) => {
      const invoiceKey = 'test-key-123';

      service.deleteInvoice(invoiceKey).subscribe({
        next: () => {
          expect().nothing();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.INVOICE_BY_KEY(invoiceKey));
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('searchByClientName', () => {
    it('should search invoices by client name', (done) => {
      const clientName = 'Test Client';
      const mockInvoices: Invoice[] = [mockInvoice];

      service.searchByClientName(clientName).subscribe({
        next: (invoices) => {
          expect(invoices).toEqual(mockInvoices);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === API_ENDPOINTS.INVOICE_SEARCH &&
        request.params.get('clientName') === clientName
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoices);
    });

    it('should return empty array when no matches found', (done) => {
      const clientName = 'Non-existent Client';

      service.searchByClientName(clientName).subscribe({
        next: (invoices) => {
          expect(invoices).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === API_ENDPOINTS.INVOICE_SEARCH &&
        request.params.get('clientName') === clientName
      );
      req.flush([]);
    });
  });
});
