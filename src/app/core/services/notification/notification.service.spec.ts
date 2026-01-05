import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: spy }
      ]
    });

    service = TestBed.inject(NotificationService);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should open a success snackbar with correct configuration', () => {
      const message = 'Operation successful';

      service.success(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        })
      );
    });

    it('should accept custom duration', () => {
      const message = 'Success with custom duration';
      const duration = 6000;

      service.success(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 6000
        })
      );
    });
  });

  describe('error', () => {
    it('should open an error snackbar with correct configuration', () => {
      const message = 'An error occurred';

      service.error(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        })
      );
    });

    it('should accept custom duration', () => {
      const message = 'Error with custom duration';
      const duration = 8000;

      service.error(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 8000
        })
      );
    });
  });

  describe('warning', () => {
    it('should open a warning snackbar with correct configuration', () => {
      const message = 'Warning message';

      service.warning(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should accept custom duration', () => {
      const message = 'Warning with custom duration';
      const duration = 5000;

      service.warning(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 5000
        })
      );
    });
  });

  describe('info', () => {
    it('should open an info snackbar with correct configuration', () => {
      const message = 'Information message';

      service.info(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-info']
        })
      );
    });

    it('should accept custom duration', () => {
      const message = 'Info with custom duration';
      const duration = 7000;

      service.info(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 7000
        })
      );
    });
  });

  describe('default behavior', () => {
    it('should use DEFAULT_DURATION when no duration is provided', () => {
      const messages = ['Success', 'Error', 'Warning', 'Info'];

      messages.forEach((message, index) => {
        const methods = [service.success, service.error, service.warning, service.info];
        methods[index].call(service, message);

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          message,
          'Close',
          jasmine.objectContaining({
            duration: 4000
          })
        );

        snackBarSpy.open.calls.reset();
      });
    });
  });
});
