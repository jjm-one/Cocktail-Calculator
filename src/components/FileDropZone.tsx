import { useId, useState, type DragEvent } from 'react';

interface FileDropZoneProps {
  label: string;
  hint: string;
  accept: string;
  onFile: (file: File) => void;
}

export function FileDropZone({ label, hint, accept, onFile }: FileDropZoneProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <label
      htmlFor={inputId}
      className={`file-drop${isDragging ? ' is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="file-drop-icon" aria-hidden="true">⇪</span>
      <span className="file-drop-label">{label}</span>
      <span className="file-drop-hint">{hint}</span>
      <input
        id={inputId}
        type="file"
        accept={accept}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </label>
  );
}
