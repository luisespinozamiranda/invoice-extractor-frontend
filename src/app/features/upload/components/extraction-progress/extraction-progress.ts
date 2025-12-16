import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { UploadProgressService } from '../../../../core/services/state/upload-progress.service';
import { UploadProgress, UploadPhase } from '../../../../core/models/upload-progress.model';

@Component({
  selector: 'app-extraction-progress',
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './extraction-progress.html',
  styleUrl: './extraction-progress.scss',
})
export class ExtractionProgress implements OnInit, OnDestroy {
  private uploadProgressService = inject(UploadProgressService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  progress: UploadProgress | null = null;
  UploadPhase = UploadPhase; // Expose enum to template

  ngOnInit(): void {
    this.uploadProgressService.progress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.progress = progress;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPhaseIcon(phase: UploadPhase): string {
    switch (phase) {
      case UploadPhase.UPLOADING:
        return 'cloud_upload';
      case UploadPhase.OCR_PROCESSING:
        return 'document_scanner';
      case UploadPhase.LLM_PROCESSING:
        return 'psychology';
      case UploadPhase.SAVING:
        return 'save';
      case UploadPhase.COMPLETE:
        return 'check_circle';
      case UploadPhase.ERROR:
        return 'error';
      default:
        return 'pending';
    }
  }

  getPhaseClass(phase: UploadPhase, currentPhase: UploadPhase): string {
    if (phase === currentPhase) {
      return 'active';
    }

    const phaseOrder = [
      UploadPhase.UPLOADING,
      UploadPhase.OCR_PROCESSING,
      UploadPhase.LLM_PROCESSING,
      UploadPhase.SAVING
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    const phaseIndex = phaseOrder.indexOf(phase);

    if (phaseIndex < currentIndex) {
      return 'completed';
    }

    return 'pending';
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}
