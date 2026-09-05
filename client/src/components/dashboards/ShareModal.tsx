import React, { useState } from 'react';
import { Copy, Check, Globe, Lock, ExternalLink, Code } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Dashboard } from '../../types';
import { dashboardApi } from '../../api/endpoints';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: Dashboard;
  onUpdate: (updated: Dashboard) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  dashboard,
  onUpdate,
}) => {
  const [isPublic, setIsPublic] = useState<boolean>(dashboard.isPublic);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isCopiedEmbed, setIsCopiedEmbed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const publicUrl = `${window.location.origin}/share/${dashboard.shareToken}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>`;

  const handleTogglePublic = async (newVal: boolean) => {
    try {
      setIsSaving(true);
      setIsPublic(newVal);
      const updated = await dashboardApi.update(dashboard._id, { isPublic: newVal });
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update share setting', err);
      setIsPublic(!newVal);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setIsCopiedEmbed(true);
      setTimeout(() => setIsCopiedEmbed(false), 2000);
    } else {
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Analytics Dashboard"
      description="Manage public sharing permissions and generate embeddable links."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Privacy Toggle Card */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                isPublic
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isPublic ? 'Public Share Enabled' : 'Private Dashboard'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isPublic
                  ? 'Anyone with the unique link can view this dashboard in read-only mode.'
                  : 'Only you can view and edit this dashboard.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={isSaving}
              onChange={(e) => handleTogglePublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Share Link Card */}
        {isPublic && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Public Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-slate-600 dark:text-slate-300 select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(publicUrl)}
                  leftIcon={
                    isCopiedLink ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {isCopiedLink ? 'Copied!' : 'Copy'}
                </Button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Open live link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Embed Snippet */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                <Code className="h-3.5 w-3.5" />
                Embed Code (Iframe)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedCode}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-slate-500 dark:text-slate-400 select-all truncate"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode, true)}
                  leftIcon={
                    isCopiedEmbed ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {isCopiedEmbed ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};
