import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtractionProgress } from './extraction-progress';
import { UploadProgressService } from '../../../../core/services/state/upload-progress.service';
import { UploadPhase } from '../../../../core/models/upload-progress.model';
import { BehaviorSubject } from 'rxjs';

describe('ExtractionProgress', () => {
  let component: ExtractionProgress;
  let fixture: ComponentFixture<ExtractionProgress>;
  let uploadProgressService: jasmine.SpyObj<UploadProgressService>;
  let progressSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    progressSubject = new BehaviorSubject({
      phase: UploadPhase.IDLE,
      percentage: 0,
      message: 'Ready',
      startTime: new Date(),
      currentPhaseStartTime: new Date()
    });

    const spy = jasmine.createSpyObj('UploadProgressService', [], {
      progress$: progressSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ExtractionProgress],
      providers: [
        { provide: UploadProgressService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExtractionProgress);
    component = fixture.componentInstance;
    uploadProgressService = TestBed.inject(UploadProgressService) as jasmine.SpyObj<UploadProgressService>;
  });

  afterEach(() => {
    progressSubject.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to progress updates', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(component.progress).toBeTruthy();
      expect(component.progress?.phase).toBe(UploadPhase.IDLE);
    });

    it('should update progress when service emits new values', () => {
      fixture.detectChanges();

      const newProgress = {
        phase: UploadPhase.UPLOADING,
        percentage: 50,
        message: 'Uploading...',
        startTime: new Date(),
        currentPhaseStartTime: new Date()
      };

      progressSubject.next(newProgress);

      expect(component.progress?.phase).toBe(UploadPhase.UPLOADING);
      expect(component.progress?.percentage).toBe(50);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from progress updates', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('getPhaseIcon', () => {
    it('should return correct icon for UPLOADING phase', () => {
      expect(component.getPhaseIcon(UploadPhase.UPLOADING)).toBe('cloud_upload');
    });

    it('should return correct icon for OCR_PROCESSING phase', () => {
      expect(component.getPhaseIcon(UploadPhase.OCR_PROCESSING)).toBe('document_scanner');
    });

    it('should return correct icon for LLM_PROCESSING phase', () => {
      expect(component.getPhaseIcon(UploadPhase.LLM_PROCESSING)).toBe('psychology');
    });

    it('should return correct icon for SAVING phase', () => {
      expect(component.getPhaseIcon(UploadPhase.SAVING)).toBe('save');
    });

    it('should return correct icon for COMPLETE phase', () => {
      expect(component.getPhaseIcon(UploadPhase.COMPLETE)).toBe('check_circle');
    });

    it('should return correct icon for ERROR phase', () => {
      expect(component.getPhaseIcon(UploadPhase.ERROR)).toBe('error');
    });

    it('should return default icon for unknown phase', () => {
      expect(component.getPhaseIcon(UploadPhase.IDLE)).toBe('pending');
    });
  });

  describe('getPhaseClass', () => {
    it('should return "active" for current phase', () => {
      const result = component.getPhaseClass(UploadPhase.UPLOADING, UploadPhase.UPLOADING);
      expect(result).toBe('active');
    });

    it('should return "completed" for phases before current', () => {
      const result = component.getPhaseClass(UploadPhase.UPLOADING, UploadPhase.LLM_PROCESSING);
      expect(result).toBe('completed');
    });

    it('should return "pending" for phases after current', () => {
      const result = component.getPhaseClass(UploadPhase.LLM_PROCESSING, UploadPhase.UPLOADING);
      expect(result).toBe('pending');
    });

    it('should handle phase progression correctly', () => {
      expect(component.getPhaseClass(UploadPhase.UPLOADING, UploadPhase.OCR_PROCESSING)).toBe('completed');
      expect(component.getPhaseClass(UploadPhase.OCR_PROCESSING, UploadPhase.OCR_PROCESSING)).toBe('active');
      expect(component.getPhaseClass(UploadPhase.LLM_PROCESSING, UploadPhase.OCR_PROCESSING)).toBe('pending');
      expect(component.getPhaseClass(UploadPhase.SAVING, UploadPhase.OCR_PROCESSING)).toBe('pending');
    });
  });

  describe('formatTime', () => {
    it('should format seconds when less than 60', () => {
      expect(component.formatTime(30)).toBe('30s');
      expect(component.formatTime(5)).toBe('5s');
    });

    it('should format minutes and seconds when 60 or more', () => {
      expect(component.formatTime(60)).toBe('1m 0s');
      expect(component.formatTime(90)).toBe('1m 30s');
      expect(component.formatTime(125)).toBe('2m 5s');
    });

    it('should handle edge cases', () => {
      expect(component.formatTime(0)).toBe('0s');
      expect(component.formatTime(59)).toBe('59s');
      expect(component.formatTime(120)).toBe('2m 0s');
    });
  });

  describe('progress display', () => {
    it('should expose UploadPhase enum to template', () => {
      expect(component.UploadPhase).toBe(UploadPhase);
    });

    it('should update view when progress changes', () => {
      fixture.detectChanges();

      progressSubject.next({
        phase: UploadPhase.OCR_PROCESSING,
        percentage: 75,
        message: 'Processing OCR...',
        estimatedTimeRemaining: 10,
        startTime: new Date(),
        currentPhaseStartTime: new Date()
      });

      fixture.detectChanges();

      expect(component.progress?.phase).toBe(UploadPhase.OCR_PROCESSING);
      expect(component.progress?.percentage).toBe(75);
      expect(component.progress?.message).toBe('Processing OCR...');
      expect(component.progress?.estimatedTimeRemaining).toBe(10);
    });
  });
});
