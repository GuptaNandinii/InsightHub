import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '../common/Button';
import { datasetApi } from '../../api/endpoints';
import { formatFileSize } from '../../utils/colors';

interface CSVUploaderProps {
  onUploadSuccess: (dataset: any) => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid CSV (.csv) file.');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB limit.');
      return;
    }
    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please choose a CSV file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      if (datasetName.trim()) {
        formData.append('name', datasetName.trim());
      }

      const created = await datasetApi.upload(formData);
      onUploadSuccess(created);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to parse and upload CSV. Ensure it has valid header rows.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drag & Drop Area */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mb-3">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop CSV
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            CSV files up to 50MB. Headers are auto-detected.
          </p>
        </div>
      ) : (
        /* Selected File Card */
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFile(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dataset Name Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Dataset Display Name
        </label>
        <input
          type="text"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          placeholder="e.g., Regional Sales 2024"
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={!file}
          isLoading={isUploading}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          Parse & Ingest Dataset
        </Button>
      </div>
    </form>
  );
};
