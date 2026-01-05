import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UploadProgressService } from './upload-progress.service';
import { UploadPhase, PHASE_MESSAGES } from '../../models/upload-progress.model';
import { WebSocketService } from '../websocket/websocket.service';
import { Subject } from 'rxjs';

describe('UploadProgressService', () => {
  let service: UploadProgressService;
  let websocketServiceSpy: jasmine.SpyObj<WebSocketService>;
  let eventsSubject: Subject<any>;

  beforeEach(() => {
    eventsSubject = new Subject();
    const wsSpy = jasmine.createSpyObj('WebSocketService', ['subscribeToExtraction'], {
      events$: eventsSubject.asObservable()
    });

    TestBed.configureTestingModule({
      providers: [
        UploadProgressService,
        { provide: WebSocketService, useValue: wsSpy }
      ]
    });

    service = TestBed.inject(UploadProgressService);
    websocketServiceSpy = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
  });

  afterEach(() => {
    eventsSubject.complete();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should start with IDLE state', (done) => {
      service.progress$.subscribe(progress => {
        expect(progress.phase).toBe(UploadPhase.IDLE);
        expect(progress.percentage).toBe(0);
        expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.IDLE]);
        done();
      });
    });
  });

  describe('getCurrentProgress', () => {
    it('should return current progress value', () => {
      const progress = service.getCurrentProgress();
      expect(progress.phase).toBe(UploadPhase.IDLE);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('startUpload', () => {
    it('should set phase to UPLOADING with 0% progress', (done) => {
      service.startUpload();

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.UPLOADING) {
          expect(progress.percentage).toBe(0);
          expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.UPLOADING]);
          expect(progress.estimatedTimeRemaining).toBeGreaterThan(0);
          done();
        }
      });
    });
  });

  describe('updateProgress', () => {
    it('should update phase and percentage', (done) => {
      service.updateProgress(UploadPhase.OCR_PROCESSING, 50);

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.OCR_PROCESSING) {
          expect(progress.percentage).toBe(50);
          expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.OCR_PROCESSING]);
          done();
        }
      });
    });

    it('should clamp percentage between 0 and 100', (done) => {
      let callCount = 0;

      service.progress$.subscribe(progress => {
        callCount++;
        if (callCount === 1) {
          // Initial IDLE state
          return;
        }
        if (callCount === 2) {
          // First update: -10 should become 0
          expect(progress.percentage).toBe(0);
        }
        if (callCount === 3) {
          // Second update: 150 should become 100
          expect(progress.percentage).toBe(100);
          done();
        }
      });

      service.updateProgress(UploadPhase.UPLOADING, -10);
      service.updateProgress(UploadPhase.UPLOADING, 150);
    });

    it('should round percentage to nearest integer', (done) => {
      service.updateProgress(UploadPhase.LLM_PROCESSING, 75.7);

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.LLM_PROCESSING) {
          expect(progress.percentage).toBe(76);
          done();
        }
      });
    });
  });

  describe('simulateProgress', () => {
    it('should start from UPLOADING phase', fakeAsync(() => {
      let capturedPhase: UploadPhase | undefined;

      service.progress$.subscribe(progress => {
        if (progress.phase !== UploadPhase.IDLE) {
          capturedPhase = progress.phase;
        }
      });

      service.simulateProgress();
      tick(100);

      expect(capturedPhase).toBe(UploadPhase.UPLOADING);
    }));
  });

  describe('finishProgress', () => {
    it('should complete progress from current state to 100%', fakeAsync(() => {
      service.updateProgress(UploadPhase.LLM_PROCESSING, 90);
      tick(100);

      service.finishProgress();
      tick(300);

      const current = service.getCurrentProgress();
      expect(current.percentage).toBe(100);
      expect(current.phase).toBe(UploadPhase.COMPLETE);
    }));

    it('should do nothing if already complete', () => {
      service.updateProgress(UploadPhase.COMPLETE, 100);
      const beforeFinish = service.getCurrentProgress();

      service.finishProgress();
      const afterFinish = service.getCurrentProgress();

      expect(beforeFinish.phase).toBe(afterFinish.phase);
      expect(beforeFinish.percentage).toBe(afterFinish.percentage);
    });
  });

  describe('complete', () => {
    it('should set phase to COMPLETE with 100% progress', (done) => {
      service.complete();

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.COMPLETE) {
          expect(progress.percentage).toBe(100);
          expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.COMPLETE]);
          expect(progress.estimatedTimeRemaining).toBe(0);
          done();
        }
      });
    });
  });

  describe('setError', () => {
    it('should set phase to ERROR with custom message', (done) => {
      const errorMessage = 'Upload failed';

      service.setError(errorMessage);

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.ERROR) {
          expect(progress.message).toBe(errorMessage);
          done();
        }
      });
    });

    it('should use default error message if none provided', (done) => {
      service.setError('');

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.ERROR) {
          expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.ERROR]);
          done();
        }
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial IDLE state', (done) => {
      service.updateProgress(UploadPhase.LLM_PROCESSING, 75);
      service.reset();

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.IDLE) {
          expect(progress.percentage).toBe(0);
          expect(progress.message).toBe(PHASE_MESSAGES[UploadPhase.IDLE]);
          done();
        }
      });
    });
  });

  describe('startWebSocketProgress', () => {
    it('should initialize progress and subscribe to extraction', (done) => {
      const extractionKey = 'test-extraction-key';

      service.startWebSocketProgress(extractionKey);

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.UPLOADING) {
          expect(websocketServiceSpy.subscribeToExtraction).toHaveBeenCalledWith(extractionKey);
          done();
        }
      });
    });

    it('should update progress based on WebSocket events', (done) => {
      const extractionKey = 'test-extraction-key';

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.OCR_PROCESSING) {
          expect(progress.percentage).toBe(30);
          expect(progress.message).toBe('Processing OCR');
          done();
        }
      });

      service.startWebSocketProgress(extractionKey);

      // Simulate WebSocket event
      eventsSubject.next({
        type: 'OCR_STARTED',
        extraction_key: extractionKey,
        progress: 30,
        message: 'Processing OCR',
        timestamp: new Date().toISOString()
      });
    });

    it('should handle EXTRACTION_COMPLETED event', (done) => {
      const extractionKey = 'test-extraction-key';

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.COMPLETE) {
          expect(progress.percentage).toBe(100);
          done();
        }
      });

      service.startWebSocketProgress(extractionKey);

      eventsSubject.next({
        type: 'EXTRACTION_COMPLETED',
        extraction_key: extractionKey,
        progress: 100,
        message: 'Extraction completed',
        timestamp: new Date().toISOString()
      });
    });

    it('should handle EXTRACTION_FAILED event', (done) => {
      const extractionKey = 'test-extraction-key';

      service.progress$.subscribe(progress => {
        if (progress.phase === UploadPhase.ERROR) {
          expect(progress.message).toBe('Extraction failed');
          done();
        }
      });

      service.startWebSocketProgress(extractionKey);

      eventsSubject.next({
        type: 'EXTRACTION_FAILED',
        extraction_key: extractionKey,
        progress: 50,
        message: 'Extraction failed',
        timestamp: new Date().toISOString()
      });
    });
  });
});
