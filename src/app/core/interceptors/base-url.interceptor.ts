import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only prepend base URL if the request doesn't start with http/https
  if (!req.url.startsWith('http')) {
    const fullUrl = `${environment.apiUrl}${req.url}`;
    console.log('[BaseUrlInterceptor] Original URL:', req.url);
    console.log('[BaseUrlInterceptor] Full URL:', fullUrl);

    const apiReq = req.clone({
      url: fullUrl
    });
    return next(apiReq);
  }

  console.log('[BaseUrlInterceptor] Skipping (already full URL):', req.url);
  return next(req);
};
