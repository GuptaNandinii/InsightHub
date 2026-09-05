import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Upload,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { CSVUploader } from '../components/datasets/CSVUploader';
import { Dataset } from '../types';
import { datasetApi } from '../api/endpoints';
import { formatFileSize } from '../utils/colors';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const res = await datasetApi.getAll();
      setDatasets(res);
    } catch (err) {
      console.error('Failed to load datasets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this dataset? Dashboards using it will no longer display its data.')) return;

    try {
      await datasetApi.delete(id);
      setDatasets((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Failed to delete dataset', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dataset Repository
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload CSV files to parse schemas, compute descriptive statistics, and power visualizations.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          leftIcon={<Upload className="h-4 w-4" />}
        >
          Upload CSV
        </Button>
      </div>

      {/* Dataset Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8 text-indigo-500" />}
          title="No datasets available"
          description="Upload your first CSV file or load demo datasets to start exploring your data."
          action={
            <Button
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Upload Your First CSV
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((ds) => (
            <Card
              key={ds._id}
              hoverEffect
              onClick={() => navigate(`/datasets/${ds._id}`)}
              className="p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(ds._id, e)}
                    title="Delete dataset"
                    className="p-1 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {ds.name}
                </h3>

                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                  {ds.originalFilename}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="indigo" size="sm">
                    {ds.rowCount.toLocaleString()} rows
                  </Badge>
                  <Badge variant="slate" size="sm">
                    {ds.columnCount} columns
                  </Badge>
                  <Badge variant="slate" size="sm">
                    {formatFileSize(ds.fileSize)}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(ds.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Explore <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload CSV File"
        description="Upload a CSV file to automatically infer schema types, compute statistics, and prepare for charting."
        maxWidth="lg"
      >
        <CSVUploader
          onUploadSuccess={(created) => {
            setIsUploadOpen(false);
            fetchDatasets();
            navigate(`/datasets/${created.id}`);
          }}
        />
      </Modal>
    </div>
  );
};
