import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Modal } from '../common/Modal';
import { CSVUploader } from '../datasets/CSVUploader';
import { Button } from '../common/Button';
import { dashboardApi } from '../../api/endpoints';

export const AppLayout: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewDashboardOpen, setIsNewDashboardOpen] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [dashboardDesc, setDashboardDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardTitle.trim()) return;

    try {
      setIsCreating(true);
      const newDash = await dashboardApi.create({
        title: dashboardTitle.trim(),
        description: dashboardDesc.trim(),
        tags: ['Custom'],
        widgets: [],
      });
      setIsNewDashboardOpen(false);
      setDashboardTitle('');
      setDashboardDesc('');
      navigate(`/dashboards/${newDash._id}`);
    } catch (err) {
      console.error('Failed to create dashboard', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenNewDashboardModal={() => setIsNewDashboardOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload CSV Dataset"
        description="Upload a CSV file to automatically infer schema types, compute statistics, and prepare for charting."
        maxWidth="lg"
      >
        <CSVUploader
          onUploadSuccess={(dataset) => {
            setIsUploadModalOpen(false);
            navigate(`/datasets/${dataset.id}`);
          }}
        />
      </Modal>

      {/* Global New Dashboard Modal */}
      <Modal
        isOpen={isNewDashboardOpen}
        onClose={() => setIsNewDashboardOpen(false)}
        title="Create New Dashboard"
        description="Set a title and description for your interactive analytics dashboard."
        maxWidth="md"
      >
        <form onSubmit={handleCreateDashboard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Dashboard Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Q1 Revenue Performance"
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of what this dashboard tracks..."
              value={dashboardDesc}
              onChange={(e) => setDashboardDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewDashboardOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create & Open Editor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
