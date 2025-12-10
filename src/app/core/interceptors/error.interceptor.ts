import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { getUserFriendlyMessage } from '../constants/error-codes';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage: string;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client error: ${error.error.message}`;
      } else {
        // Server-side error
        const errorCode = error.error?.errorCode;
        errorMessage = getUserFriendlyMessage(errorCode);
      }

      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        errorCode: error.error?.errorCode,
        message: errorMessage,
        url: error.url
      });

      // Return error with user-friendly message
      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};
