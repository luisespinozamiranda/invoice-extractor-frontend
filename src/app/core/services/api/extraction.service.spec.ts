import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExtractionService } from './extraction.service';
import { ExtractionResponse, ExtractionMetadata, ExtractionStatus } from '../../models';
import { API_ENDPOINTS } from '../../constants/api-endpoints';
import { UploadProgressService } from '../state/upload-progress.service';

describe('ExtractionService', () => {
  let service: ExtractionService;
  let httpMock: HttpTestingController;
  let uploadProgressService: jasmine.SpyObj<UploadProgressService>;

  beforeEach(() => {
    const uploadProgressSpy = jasmine.createSpyObj('UploadProgressService', ['setError']);

    TestBed.configureTestingModule({
      providers: [
        ExtractionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UploadProgressService, useValue: uploadProgressSpy }
      ]
    });

    service = TestBed.inject(ExtractionService);
    httpMock = TestBed.inject(HttpTestingController);
    uploadProgressService = TestBed.inject(UploadProgressService) as jasmine.SpyObj<UploadProgressService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractInvoice', () => {
    it('should send a POST request with FormData containing the file', (done) => {
      const mockFile = new File(['test content'], 'test-invoice.pdf', { type: 'application/pdf' });
      const mockResponse: ExtractionResponse = {
        extraction_key: 'extraction-key-456',
        invoice_key: 'test-key-123',
        source_file_name: 'test-invoice.pdf',
        extraction_timestamp: '2024-01-01T00:00:00Z',
        extraction_status: ExtractionStatus.PROCESSING,
        confidence_score: 0.0,
        ocr_engine: 'Tesseract',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_deleted: false
      };

      service.extractInvoice(mockFile).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.EXTRACTIONS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      req.flush(mockResponse);
    });

    it('should handle extraction errors and call uploadProgressService.setError', (done) => {
      const mockFile = new File(['test content'], 'test-invoice.pdf', { type: 'application/pdf' });
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: {
          userMessage: 'Extraction failed'
        }
      };

      service.extractInvoice(mockFile).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          // In tests, interceptors don't run, so the service uses its fallback message
          expect(uploadProgressService.setError).toHaveBeenCalledWith('Failed to extract invoice. Please try again.');
          done();
        }
      });

      const req = httpMock.expectOne(API_ENDPOINTS.EXTRACTIONS);
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });
    });

    it('should use default error message when userMessage is not provided', (done) => {
      const mockFile = new File(['test content'], 'test-invoice.pdf', { type: 'application/pdf' });
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error'
      };

      service.extractInvoice(mockFile).subscribe({
        next: () => done.fail('should have failed'),
        error: () => {
          expect(uploadProgressService.setError).toHaveBeenCalledWith(
            'Failed to extract invoice. Please try again.'
          );
          done();
        }
      });

      const req = httpMock.expectOne(API_ENDPOINTS.EXTRACTIONS);
      req.flush({}, { status: mockError.status, statusText: mockError.statusText });
    });
  });

  describe('getExtractionMetadataByInvoiceKey', () => {
    it('should send a GET request and return extraction metadata', (done) => {
      const invoiceKey = 'test-invoice-key';
      const mockMetadata: ExtractionMetadata = {
        extraction_key: 'extraction-123',
        invoice_key: invoiceKey,
        source_file_name: 'test.pdf',
        extraction_timestamp: '2024-01-01T00:00:00Z',
        extraction_status: ExtractionStatus.COMPLETED,
        confidence_score: 0.95,
        ocr_engine: 'Tesseract',
        extraction_data: '{"field": "value"}',
        error_message: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_deleted: false
      };

      service.getExtractionMetadataByInvoiceKey(invoiceKey).subscribe({
        next: (metadata) => {
          expect(metadata).toEqual(mockMetadata);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
      expect(req.request.method).toBe('GET');
      req.flush(mockMetadata);
    });
  });

  describe('pollExtractionStatus', () => {
    it('should poll until status is not PROCESSING', fakeAsync(() => {
      const invoiceKey = 'test-invoice-key';
      const processingMetadata: ExtractionMetadata = {
        extraction_key: 'extraction-123',
        invoice_key: invoiceKey,
        source_file_name: 'test.pdf',
        extraction_timestamp: '2024-01-01T00:00:00Z',
        extraction_status: ExtractionStatus.PROCESSING,
        confidence_score: 0.5,
        ocr_engine: 'Tesseract',
        extraction_data: undefined,
        error_message: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_deleted: false
      };

      const completedMetadata: ExtractionMetadata = {
        ...processingMetadata,
        extraction_status: ExtractionStatus.COMPLETED,
        confidence_score: 0.95
      };

      let result: ExtractionMetadata | undefined;
      service.pollExtractionStatus(invoiceKey, 100, 5).subscribe({
        next: (metadata) => {
          result = metadata;
        }
      });

      // First interval tick - expect first request
      tick(100);
      let req = httpMock.expectOne(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
      req.flush(processingMetadata);

      // Second interval tick - expect second request
      tick(100);
      req = httpMock.expectOne(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
      req.flush(processingMetadata);

      // Third interval tick - return completed status
      tick(100);
      req = httpMock.expectOne(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
      req.flush(completedMetadata);

      // Verify we got the completed metadata
      expect(result).toBeDefined();
      expect(result?.extraction_status).toBe(ExtractionStatus.COMPLETED);

      flush();
    }));

    it('should filter out PROCESSING status and emit final result', fakeAsync(() => {
      const invoiceKey = 'test-invoice-key';
      const completedMetadata: ExtractionMetadata = {
        extraction_key: 'extraction-123',
        invoice_key: invoiceKey,
        source_file_name: 'test.pdf',
        extraction_timestamp: '2024-01-01T00:00:00Z',
        extraction_status: ExtractionStatus.COMPLETED,
        confidence_score: 0.95,
        ocr_engine: 'Tesseract',
        extraction_data: '{"field": "value"}',
        error_message: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_deleted: false
      };

      let result: ExtractionMetadata | undefined;
      service.pollExtractionStatus(invoiceKey, 100, 5).subscribe({
        next: (metadata) => {
          result = metadata;
        }
      });

      // First poll returns completed immediately
      tick(100);
      const req = httpMock.expectOne(API_ENDPOINTS.EXTRACTION_BY_INVOICE_KEY(invoiceKey));
      req.flush(completedMetadata);

      // Verify result
      expect(result).toBeDefined();
      expect(result?.extraction_status).not.toBe(ExtractionStatus.PROCESSING);
      expect(result).toEqual(completedMetadata);

      flush();
    }));
  });
});
