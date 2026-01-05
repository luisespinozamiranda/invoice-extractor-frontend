import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([errorInterceptor])
        ),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through successful requests', (done) => {
    const testData = { message: 'success' };

    httpClient.get('/test').subscribe({
      next: (data) => {
        expect(data).toEqual(testData);
        done();
      },
      error: () => done.fail('should not error')
    });

    const req = httpMock.expectOne('/test');
    req.flush(testData);
  });

  it('should handle server errors with error code', (done) => {
    const errorCode = 'INV-001';
    const errorResponse = {
      errorCode: errorCode,
      message: 'Server error'
    };

    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.userMessage).toBeTruthy();
        expect(error.status).toBe(400);
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle server errors without error code', (done) => {
    const errorResponse = {
      message: 'Generic server error'
    };

    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.userMessage).toBeTruthy();
        expect(error.status).toBe(500);
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle client-side errors', (done) => {
    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.userMessage).toContain('Client error');
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(new ErrorEvent('Network error', { message: 'Connection failed' }));
  });

  it('should handle 404 errors', (done) => {
    httpClient.get('/test/non-existent').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test/non-existent');
    req.flush({ errorCode: 'INV-007' }, { status: 404, statusText: 'Not Found' });
  });

  it('should handle 401 unauthorized errors', (done) => {
    httpClient.get('/test/secure').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(401);
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test/secure');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle network errors', (done) => {
    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.error(new ProgressEvent('network error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should preserve original error properties', (done) => {
    const errorCode = 'INV-005';
    const errorResponse = {
      errorCode: errorCode,
      message: 'Extraction failed'
    };

    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
        expect(error.error).toEqual(errorResponse);
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle POST request errors', (done) => {
    const body = { data: 'test' };

    httpClient.post('/test', body).subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush({ errorCode: 'INV-012' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should handle errors with multiple fields', (done) => {
    const complexError = {
      errorCode: 'INV-001',
      message: 'Validation failed',
      details: {
        field1: 'error1',
        field2: 'error2'
      }
    };

    httpClient.get('/test').subscribe({
      next: () => done.fail('should have failed'),
      error: (error) => {
        expect(error.error).toEqual(complexError);
        expect(error.userMessage).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(complexError, { status: 400, statusText: 'Bad Request' });
  });
});
