import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Save,
  Layers,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Dataset, CleanOperation, CleanPreviewResponse } from '../../types';
import { datasetApi } from '../../api/endpoints';

interface DataCleaningStudioProps {
  dataset: Dataset;
  onCleaningComplete?: () => void;
}

export const DataCleaningStudio: React.FC<DataCleaningStudioProps> = ({
  dataset,
  onCleaningComplete,
}) => {
  const navigate = useNavigate();

  // Active operations queue
  const [operations, setOperations] = useState<CleanOperation[]>([]);
  const [saveAsNew, setSaveAsNew] = useState<boolean>(true);
  const [newDatasetName, setNewDatasetName] = useState<string>(
    `${dataset.name} (Cleaned)`
  );

  // New operation builder state
  const [selectedOpType, setSelectedOpType] = useState<string>('imputeMissing');
  const [targetCol, setTargetCol] = useState<string>(
    dataset.columns.length > 0 ? dataset.columns[0].name : ''
  );
  const [imputeStrategy, setImputeStrategy] = useState<'mean' | 'median' | 'mode' | 'constant'>('median');
  const [constantVal, setConstantVal] = useState<string>('0');
  const [textAction, setTextAction] = useState<'trim' | 'lowercase' | 'uppercase' | 'removeSpecial'>('trim');
  const [outlierMethod, setOutlierMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [outlierAction, setOutlierAction] = useState<'drop' | 'cap'>('drop');
  const [renameNewName, setRenameNewName] = useState<string>('');

  // Preview state
  const [preview, setPreview] = useState<CleanPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detected issues
  const columnsWithNulls = dataset.columns.filter((c) => c.nullCount > 0);
  const totalNulls = dataset.columns.reduce((sum, c) => sum + c.nullCount, 0);

  // Auto-fetch preview whenever operations change
  useEffect(() => {
    if (operations.length === 0) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        setIsPreviewLoading(true);
        setErrorMessage(null);
        const res = await datasetApi.previewClean(dataset._id, {
          operations,
        });
        setPreview(res);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to compute cleaning preview');
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [operations, dataset._id]);

  // One-click Smart Auto-Clean
  const handleApplySmartAutoClean = () => {
    const autoOps: CleanOperation[] = [
      { type: 'removeDuplicates' },
    ];

    // String columns: trim whitespace
    const stringCols = dataset.columns.filter((c) => c.dataType === 'string');
    stringCols.forEach((c) => {
      autoOps.push({ type: 'formatText', column: c.name, action: 'trim' });
    });

    // Columns with nulls: impute median for numbers, mode for strings
    columnsWithNulls.forEach((c) => {
      if (c.dataType === 'number') {
        autoOps.push({
          type: 'imputeMissing',
          column: c.name,
          strategy: 'median',
        });
      } else {
        autoOps.push({
          type: 'imputeMissing',
          column: c.name,
          strategy: 'mode',
        });
      }
    });

    setOperations(autoOps);
  };

  // Add custom operation to queue
  const handleAddOperation = () => {
    let newOp: CleanOperation | null = null;

    if (selectedOpType === 'removeDuplicates') {
      newOp = { type: 'removeDuplicates' };
    } else if (selectedOpType === 'dropNulls') {
      newOp = { type: 'dropNulls', columns: targetCol ? [targetCol] : undefined };
    } else if (selectedOpType === 'imputeMissing') {
      newOp = {
        type: 'imputeMissing',
        column: targetCol,
        strategy: imputeStrategy,
        constantValue: imputeStrategy === 'constant' ? constantVal : undefined,
      };
    } else if (selectedOpType === 'formatText') {
      newOp = {
        type: 'formatText',
        column: targetCol,
        action: textAction,
      };
    } else if (selectedOpType === 'filterOutliers') {
      newOp = {
        type: 'filterOutliers',
        column: targetCol,
        method: outlierMethod,
        action: outlierAction,
      };
    } else if (selectedOpType === 'dropColumn') {
      newOp = {
        type: 'dropColumn',
        column: targetCol,
      };
    } else if (selectedOpType === 'renameColumn') {
      if (!renameNewName.trim()) return;
      newOp = {
        type: 'renameColumn',
        oldName: targetCol,
        newName: renameNewName.trim(),
      };
    }

    if (newOp) {
      setOperations((prev) => [...prev, newOp!]);
      setRenameNewName('');
    }
  };

  const handleRemoveOperation = (index: number) => {
    setOperations((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Execute and persist cleaning
  const handleSaveCleanedDataset = async () => {
    if (operations.length === 0) return;

    try {
      setIsApplying(true);
      setErrorMessage(null);
      const res = await datasetApi.clean(dataset._id, {
        operations,
        saveAsNew,
        newDatasetName: newDatasetName.trim(),
      });

      setSuccessMessage(res.message);

      setTimeout(() => {
        if (saveAsNew && res.data?.id) {
          navigate(`/datasets/${res.data.id}`);
        } else {
          if (onCleaningComplete) onCleaningComplete();
          window.location.reload();
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to apply cleaning operations');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quality Issues Alert Banner */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Data Quality Audit
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {totalNulls > 0 ? (
                <>Found <span className="font-bold">{totalNulls} missing cells</span> across {columnsWithNulls.length} columns ({columnsWithNulls.map((c) => c.name).join(', ')}).</>
              ) : (
                'No missing values detected. You can format text, detect outliers, or remove duplicates.'
              )}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleApplySmartAutoClean}
          leftIcon={<Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" />}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-none whitespace-nowrap"
        >
          1-Click Smart Auto-Clean
        </Button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operations Queue & Recipe Builder */}
        <div className="lg:col-span-5 space-y-5">
          {/* Operation Builder Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Plus className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Cleaning Step
              </h3>
            </div>

            {/* Operation Type Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Transformation Type
              </label>
              <select
                value={selectedOpType}
                onChange={(e) => setSelectedOpType(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="imputeMissing">Impute Missing Values (Mean / Median / Mode / Constant)</option>
                <option value="dropNulls">Drop Rows with Missing Values</option>
                <option value="removeDuplicates">Remove Duplicate Rows</option>
                <option value="formatText">Format Text (Trim, Lowercase, Uppercase, Clean)</option>
                <option value="filterOutliers">Filter Outliers (IQR / Z-Score)</option>
                <option value="dropColumn">Drop Column</option>
                <option value="renameColumn">Rename Column</option>
              </select>
            </div>

            {/* Target Column (if applicable) */}
            {selectedOpType !== 'removeDuplicates' && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Target Column
                </label>
                <select
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  {dataset.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.dataType}) {c.nullCount > 0 ? `• ${c.nullCount} nulls` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Options based on selected type */}
            {selectedOpType === 'imputeMissing' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Imputation Strategy
                  </label>
                  <select
                    value={imputeStrategy}
                    onChange={(e) => setImputeStrategy(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
                  >
                    <option value="median">Median (Recommended for numeric)</option>
                    <option value="mean">Mean (Average)</option>
                    <option value="mode">Mode (Most frequent - best for categories)</option>
                    <option value="constant">Custom Constant Value</option>
                  </select>
                </div>

                {imputeStrategy === 'constant' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Constant Value
                    </label>
                    <input
                      type="text"
                      value={constantVal}
                      onChange={(e) => setConstantVal(e.target.value)}
                      placeholder="e.g. 0 or N/A"
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                    />
                  </div>
                )}
              </div>
            )}

            {selectedOpType === 'formatText' && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Text Action
                </label>
                <select
                  value={textAction}
                  onChange={(e) => setTextAction(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
                >
                  <option value="trim">Trim Leading & Trailing Whitespace</option>
                  <option value="lowercase">Convert to lowercase</option>
                  <option value="uppercase">Convert to UPPERCASE</option>
                  <option value="removeSpecial">Remove Special Characters (Symbols)</option>
                </select>
              </div>
            )}

            {selectedOpType === 'filterOutliers' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Method
                  </label>
                  <select
                    value={outlierMethod}
                    onChange={(e) => setOutlierMethod(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                  >
                    <option value="iqr">IQR (1.5x)</option>
                    <option value="zscore">Z-Score (3.0x)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Action
                  </label>
                  <select
                    value={outlierAction}
                    onChange={(e) => setOutlierAction(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                  >
                    <option value="drop">Drop Outlier Rows</option>
                    <option value="cap">Cap / Clamp to Boundary</option>
                  </select>
                </div>
              </div>
            )}

            {selectedOpType === 'renameColumn' && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  New Column Name *
                </label>
                <input
                  type="text"
                  value={renameNewName}
                  onChange={(e) => setRenameNewName(e.target.value)}
                  placeholder="e.g. Clean_Revenue"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                />
              </div>
            )}

            <Button
              onClick={handleAddOperation}
              size="sm"
              className="w-full"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Step to Pipeline
            </Button>
          </Card>

          {/* Active Operations Queue Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Pipeline ({operations.length})
                </h3>
              </div>
              {operations.length > 0 && (
                <button
                  onClick={() => setOperations([])}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {operations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">
                No cleaning steps queued. Add a step above or click "1-Click Smart Auto-Clean".
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {operations.map((op, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {op.type === 'removeDuplicates' && 'Remove Duplicates'}
                        {op.type === 'dropNulls' && `Drop Nulls in "${op.columns?.[0] || 'all'}"`}
                        {op.type === 'imputeMissing' && `Impute "${op.column}" (${op.strategy})`}
                        {op.type === 'formatText' && `Format "${op.column}" (${op.action})`}
                        {op.type === 'filterOutliers' && `Outliers in "${op.column}" (${op.action})`}
                        {op.type === 'dropColumn' && `Drop "${op.column}"`}
                        {op.type === 'renameColumn' && `Rename "${op.oldName}" ➜ "${op.newName}"`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveOperation(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Live Impact Audit & Preview */}
        <div className="lg:col-span-7 space-y-5">
          {/* Impact Stats Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-time Transformation Preview
                </h3>
              </div>
              {isPreviewLoading && (
                <span className="flex items-center gap-1 text-xs text-indigo-500 animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Recalculating...
                </span>
              )}
            </div>

            {preview ? (
              <>
                {/* Before / After Rows Comparison */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Rows Before
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {preview.rowsBefore}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Rows After
                    </span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {preview.rowsAfter}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Net Row Delta
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        preview.rowsAfter < preview.rowsBefore
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {preview.rowsAfter - preview.rowsBefore}
                    </span>
                  </div>
                </div>

                {/* Audit Report List */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Applied Changes Audit:
                  </span>
                  {preview.changesReport.map((msg, i) => (
                    <p key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{msg}</span>
                    </p>
                  ))}
                </div>

                {/* Cleaned Data Rows Table Sample */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cleaned Data Preview (Top Rows):
                  </span>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                          {preview.columns.map((c) => (
                            <th key={c.name} className="py-2 px-3 whitespace-nowrap font-medium">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {preview.previewRows.map((r, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            {preview.columns.map((c) => (
                              <td key={c.name} className="py-1.5 px-3 whitespace-nowrap truncate max-w-xs">
                                {r[c.name] === null || r[c.name] === undefined ? (
                                  <span className="italic text-slate-400">null</span>
                                ) : (
                                  String(r[c.name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                Add one or more cleaning operations to see the live impact report and table preview.
              </div>
            )}
          </Card>

          {/* Persistence Options & Commit Button Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Save Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveAsNew}
                  onChange={() => setSaveAsNew(true)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Save as New Dataset (Recommended — preserves raw source CSV)
                </span>
              </label>

              {saveAsNew && (
                <div className="pl-6">
                  <input
                    type="text"
                    value={newDatasetName}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                    placeholder="Cleaned Dataset Name"
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                  />
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="saveMode"
                  checked={!saveAsNew}
                  onChange={() => setSaveAsNew(false)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Overwrite Current Dataset (In-place update)
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            )}

            <Button
              onClick={handleSaveCleanedDataset}
              disabled={operations.length === 0}
              isLoading={isApplying}
              className="w-full"
              leftIcon={<Save className="h-4 w-4" />}
            >
              {saveAsNew ? 'Create Cleaned Dataset' : 'Apply & Overwrite Dataset'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
