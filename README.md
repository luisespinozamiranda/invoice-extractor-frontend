# Invoice Extractor Frontend

Angular application for uploading and extracting invoice data using OCR and AI technology.

## Features

- **Drag & Drop File Upload**: Intuitive file upload zone with drag and drop support
- **Multi-Phase Progress Bar** ⭐: Real-time visual progress tracking through 4 extraction phases:
  - Upload (0-20%): ~3 seconds
  - OCR Processing (20-70%): ~22 seconds
  - AI Analysis (70-90%): ~3 seconds
  - Save (90-100%): ~1 second
- **File Validation**: Client-side validation for file type (PDF, PNG, JPG, JPEG) and size (max 10 MB)
- **Responsive Design**: Mobile-first design that works on all devices
- **Error Handling**: User-friendly error messages with detailed error code mapping
- **Material Design**: Professional UI using Angular Material components

## Tech Stack

- **Angular**: 21.0.2 (standalone components)
- **Angular Material**: 21.0.2
- **RxJS**: 7.8
- **TypeScript**: Strict mode enabled
- **SCSS**: For styling

## Backend Integration

This frontend consumes REST API endpoints from the [invoice-extractor-service](../invoice-extractor-service):

- **Development**: `http://localhost:8080/invoice-extractor-service`
- **Production**: `https://invoice-extractor-service.onrender.com/invoice-extractor-service`

### API Endpoints Used

- `POST /api/v1.0/extractions` - Upload file for extraction
- `GET /api/v1.0/invoices` - List all invoices
- `GET /api/v1.0/invoices/{invoice_key}` - Get specific invoice
- `PUT /api/v1.0/invoices/{invoice_key}` - Update invoice
- `DELETE /api/v1.0/invoices/{invoice_key}` - Delete invoice

## Project Structure

```
src/app/
├── core/                      # Singleton services, models, interceptors
│   ├── constants/            # Error codes, API endpoints
│   ├── interceptors/         # HTTP interceptors (base URL, error handling)
│   ├── models/               # TypeScript interfaces and enums
│   └── services/             # Core services (API, state, notification)
├── features/                 # Feature modules (lazy-loaded)
│   └── upload/              # Upload feature
│       └── components/      # Upload page, file drop zone, progress bar
├── shared/                   # Shared components and utilities
└── environments/            # Environment configurations
```

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
