import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { baseUrlInterceptor } from './base-url.interceptor';
import { environment } from '../../../environments/environment';

describe('baseUrlInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([baseUrlInterceptor])
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

  it('should prepend base URL to relative URLs', () => {
    const relativeUrl = '/invoices';

    httpClient.get(relativeUrl).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.url).toBe(`${environment.apiUrl}${relativeUrl}`);
    req.flush({});
  });

  it('should not modify URLs that already start with http', () => {
    const absoluteUrl = 'http://example.com/api/data';

    httpClient.get(absoluteUrl).subscribe();

    const req = httpMock.expectOne(absoluteUrl);
    expect(req.request.url).toBe(absoluteUrl);
    req.flush({});
  });

  it('should not modify URLs that already start with https', () => {
    const absoluteUrl = 'https://example.com/api/data';

    httpClient.get(absoluteUrl).subscribe();

    const req = httpMock.expectOne(absoluteUrl);
    expect(req.request.url).toBe(absoluteUrl);
    req.flush({});
  });

  it('should handle multiple relative URLs correctly', () => {
    const urls = ['/invoices', '/extractions', '/users'];

    urls.forEach(url => {
      httpClient.get(url).subscribe();
    });

    urls.forEach(url => {
      const req = httpMock.expectOne(`${environment.apiUrl}${url}`);
      expect(req.request.url).toBe(`${environment.apiUrl}${url}`);
      req.flush({});
    });
  });

  it('should preserve query parameters in relative URLs', () => {
    const relativeUrl = '/invoices?status=active';

    httpClient.get(relativeUrl).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.url).toBe(`${environment.apiUrl}${relativeUrl}`);
    req.flush({});
  });

  it('should handle POST requests with relative URLs', () => {
    const relativeUrl = '/invoices';
    const body = { data: 'test' };

    httpClient.post(relativeUrl, body).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.url).toBe(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('should handle PUT requests with relative URLs', () => {
    const relativeUrl = '/invoices/123';
    const body = { data: 'updated' };

    httpClient.put(relativeUrl, body).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.url).toBe(`${environment.apiUrl}${relativeUrl}`);
    req.flush({});
  });

  it('should handle DELETE requests with relative URLs', () => {
    const relativeUrl = '/invoices/123';

    httpClient.delete(relativeUrl).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}${relativeUrl}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.url).toBe(`${environment.apiUrl}${relativeUrl}`);
    req.flush({});
  });
});
