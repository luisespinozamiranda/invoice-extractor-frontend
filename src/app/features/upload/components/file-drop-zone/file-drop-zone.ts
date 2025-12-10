import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-file-drop-zone',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './file-drop-zone.html',
  styleUrl: './file-drop-zone.scss',
})
export class FileDropZone {
  @Output() fileSelected = new EventEmitter<File>();

  isDragging = false;
  selectedFile: File | null = null;
  errorMessage: string | null = null;

  private readonly ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = null;

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage = 'Invalid file type. Please upload PDF, PNG, JPG, or JPEG.';
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.errorMessage = 'File too large. Maximum size is 10 MB.';
      return;
    }

    // File is valid
    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  clearFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}
