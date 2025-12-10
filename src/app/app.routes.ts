import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/upload',
    pathMatch: 'full'
  },
  {
    path: 'upload',
    loadComponent: () => import('./features/upload/components/upload-page/upload-page').then(m => m.UploadPage),
    title: 'Upload Invoice'
  },
  {
    path: 'invoices',
    loadComponent: () => import('./features/invoices/components/invoice-list/invoice-list').then(m => m.InvoiceList),
    title: 'Invoices'
  },
  {
    path: '**',
    redirectTo: '/upload'
  }
];
