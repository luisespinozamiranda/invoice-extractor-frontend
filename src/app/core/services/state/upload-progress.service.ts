import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, interval, takeWhile, Subscription } from 'rxjs';
import { UploadProgress, UploadPhase, PHASE_MESSAGES, PHASE_DURATIONS } from '../../models/upload-progress.model';
import { WebSocketService, ExtractionEvent } from '../websocket/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class UploadProgressService {
  private websocketService = inject(WebSocketService);
  private progressSubject = new BehaviorSubject<UploadProgress>(this.getInitialProgress());
  public progress$: Observable<UploadProgress> = this.progressSubject.asObservable();
  private websocketSubscription: Subscription | null = null;

  /**
   * Get current progress value (for debugging)
   */
  getCurrentProgress(): UploadProgress {
    return this.progressSubject.value;
  }

  private getInitialProgress(): UploadProgress {
    return {
      phase: UploadPhase.IDLE,
      percentage: 0,
      message: PHASE_MESSAGES[UploadPhase.IDLE],
      startTime: new Date(),
      currentPhaseStartTime: new Date()
    };
  }

  startUpload(): void {
    const now = new Date();
    this.progressSubject.next({
      phase: UploadPhase.UPLOADING,
      percentage: 0,
      message: PHASE_MESSAGES[UploadPhase.UPLOADING],
      estimatedTimeRemaining: this.getTotalEstimatedTime(),
      startTime: now,
      currentPhaseStartTime: now
    });
  }

  updateProgress(phase: UploadPhase, percentage: number): void {
    const current = this.progressSubject.value;
    const now = new Date();

    this.progressSubject.next({
      phase,
      percentage: Math.round(Math.min(100, Math.max(0, percentage))),
      message: PHASE_MESSAGES[phase],
      estimatedTimeRemaining: this.calculateTimeRemaining(percentage, current.startTime),
      startTime: current.startTime,
      currentPhaseStartTime: phase !== current.phase ? now : current.currentPhaseStartTime
    });
  }

  simulateProgress(): void {
    this.startUpload();

    // Phase 1: Upload (0-20%) - 1 second
    this.simulatePhase(UploadPhase.UPLOADING, 0, 20, 1000, () => {
      // Phase 2: OCR Processing (20-70%) - 2 seconds
      this.simulatePhase(UploadPhase.OCR_PROCESSING, 20, 70, 2000, () => {
        // Phase 3: LLM Processing (70-90%) - 1 second
        this.simulatePhase(UploadPhase.LLM_PROCESSING, 70, 90, 1000, () => {
          // Phase 4: Saving (90-100%) - 1 second
          this.simulatePhase(UploadPhase.SAVING, 90, 100, 1000, () => {
            this.complete();
          });
        });
      });
    });
  }

  private simulatePhase(
    phase: UploadPhase,
    startPercent: number,
    endPercent: number,
    durationMs: number,
    onComplete: () => void
  ): void {
    const steps = 50; // Number of updates
    const stepDuration = durationMs / steps;
    const percentPerStep = (endPercent - startPercent) / steps;
    let currentStep = 0;

    interval(stepDuration)
      .pipe(takeWhile(() => currentStep < steps))
      .subscribe({
        next: () => {
          currentStep++;
          const percentage = startPercent + (percentPerStep * currentStep);
          this.updateProgress(phase, percentage);
        },
        complete: () => {
          this.updateProgress(phase, endPercent);
          onComplete();
        }
      });
  }

  complete(): void {
    this.progressSubject.next({
      phase: UploadPhase.COMPLETE,
      percentage: 100,
      message: PHASE_MESSAGES[UploadPhase.COMPLETE],
      estimatedTimeRemaining: 0,
      startTime: this.progressSubject.value.startTime,
      currentPhaseStartTime: new Date()
    });
  }

  setError(message: string): void {
    this.progressSubject.next({
      phase: UploadPhase.ERROR,
      percentage: this.progressSubject.value.percentage,
      message: message || PHASE_MESSAGES[UploadPhase.ERROR],
      startTime: this.progressSubject.value.startTime,
      currentPhaseStartTime: new Date()
    });
  }

  reset(): void {
    this.progressSubject.next(this.getInitialProgress());

    // Unsubscribe from websocket events
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
      this.websocketSubscription = null;
    }
  }

  /**
   * Start listening to WebSocket events for real-time progress updates
   */
  startWebSocketProgress(extractionKey: string): void {
    const now = new Date();

    // Initialize progress
    this.progressSubject.next({
      phase: UploadPhase.UPLOADING,
      percentage: 0,
      message: 'Starting extraction...',
      estimatedTimeRemaining: this.getTotalEstimatedTime(),
      startTime: now,
      currentPhaseStartTime: now
    });

    // Subscribe to extraction topic
    this.websocketService.subscribeToExtraction(extractionKey);

    // Listen to websocket events
    this.websocketSubscription = this.websocketService.events$.subscribe(event => {
      if (event && event.extraction_key === extractionKey) {
        this.processWebSocketEvent(event);
      }
    });
  }

  /**
   * Process WebSocket extraction events and update progress
   */
  private processWebSocketEvent(event: ExtractionEvent): void {
    const current = this.progressSubject.value;
    const now = new Date();

    // Map event types to phases and update progress
    let phase: UploadPhase;
    let message = event.message;

    switch (event.type) {
      case 'EXTRACTION_STARTED':
        phase = UploadPhase.UPLOADING;
        break;
      case 'OCR_COMPLETED':
        phase = UploadPhase.OCR_PROCESSING;
        break;
      case 'LLM_EXTRACTION_COMPLETED':
        phase = UploadPhase.LLM_PROCESSING;
        break;
      case 'INVOICE_SAVED':
        phase = UploadPhase.SAVING;
        break;
      case 'EXTRACTION_COMPLETED':
        phase = UploadPhase.COMPLETE;
        break;
      case 'EXTRACTION_FAILED':
        phase = UploadPhase.ERROR;
        break;
      default:
        return; // Unknown event type, ignore
    }

    this.progressSubject.next({
      phase,
      percentage: event.progress,
      message,
      estimatedTimeRemaining: this.calculateTimeRemaining(event.progress, current.startTime),
      startTime: current.startTime,
      currentPhaseStartTime: phase !== current.phase ? now : current.currentPhaseStartTime
    });

    // If extraction completed or failed, unsubscribe
    if (event.type === 'EXTRACTION_COMPLETED' || event.type === 'EXTRACTION_FAILED') {
      if (this.websocketSubscription) {
        this.websocketSubscription.unsubscribe();
        this.websocketSubscription = null;
      }
    }
  }

  private getTotalEstimatedTime(): number {
    return Object.values(PHASE_DURATIONS).reduce((sum, duration) => sum + duration, 0);
  }

  private calculateTimeRemaining(currentPercentage: number, startTime: Date): number {
    if (currentPercentage === 0) return this.getTotalEstimatedTime();
    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    const estimatedTotal = (elapsed / currentPercentage) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    return Math.round(remaining);
  }
}
