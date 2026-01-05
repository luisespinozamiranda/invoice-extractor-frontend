import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileDropZone } from './file-drop-zone';

describe('FileDropZone', () => {
  let component: FileDropZone;
  let fixture: ComponentFixture<FileDropZone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileDropZone]
    }).compileComponents();

    fixture = TestBed.createComponent(FileDropZone);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('drag and drop', () => {
    it('should set isDragging to true on drag over', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragOver(event);

      expect(component.isDragging).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set isDragging to false on drag leave', () => {
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.isDragging = true;
      component.onDragLeave(event);

      expect(component.isDragging).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should handle file drop with valid file', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      spyOn(component.fileSelected, 'emit');

      component.onDrop(event);

      expect(component.isDragging).toBe(false);
      expect(component.selectedFile).toBe(mockFile);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(mockFile);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('file selection', () => {
    it('should handle file input change with valid file', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      const event = { target: { files: dataTransfer.files } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.selectedFile).toBe(mockFile);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('file validation', () => {
    it('should accept PDF files', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBeNull();
      expect(component.selectedFile).toBe(mockFile);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(mockFile);
    });

    it('should accept PNG files', () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBeNull();
      expect(component.selectedFile).toBe(mockFile);
    });

    it('should accept JPG files', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBeNull();
      expect(component.selectedFile).toBe(mockFile);
    });

    it('should reject invalid file types', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBe('Invalid file type. Please upload PDF, PNG, JPG, or JPEG.');
      expect(component.selectedFile).toBeNull();
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
    });

    it('should reject files larger than 10 MB', () => {
      const largeSize = 11 * 1024 * 1024; // 11 MB
      const mockFile = new File(['x'.repeat(largeSize)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: largeSize });

      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBe('File too large. Maximum size is 10 MB.');
      expect(component.selectedFile).toBeNull();
      expect(component.fileSelected.emit).not.toHaveBeenCalled();
    });

    it('should accept files smaller than 10 MB', () => {
      const validSize = 5 * 1024 * 1024; // 5 MB
      const mockFile = new File(['x'.repeat(validSize)], 'valid.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: validSize });

      const event = { target: { files: [mockFile] } } as any;
      spyOn(component.fileSelected, 'emit');

      component.onFileSelected(event);

      expect(component.errorMessage).toBeNull();
      expect(component.selectedFile).toBe(mockFile);
      expect(component.fileSelected.emit).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('clearFile', () => {
    it('should clear selected file and error message', () => {
      component.selectedFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.errorMessage = 'Some error';

      component.clearFile();

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('getFileSize', () => {
    it('should format bytes correctly', () => {
      expect(component.getFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(component.getFileSize(1024)).toBe('1.00 KB');
      expect(component.getFileSize(1536)).toBe('1.50 KB');
    });

    it('should format megabytes correctly', () => {
      expect(component.getFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(component.getFileSize(5.5 * 1024 * 1024)).toBe('5.50 MB');
    });
  });
});
