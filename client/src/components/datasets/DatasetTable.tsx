import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { datasetApi } from '../../api/endpoints';
import { Skeleton } from '../common/Skeleton';

interface DatasetTableProps {
  datasetId: string;
}

export const DatasetTable: React.FC<DatasetTableProps> = ({ datasetId }) => {
  const [data, setData] = useState<{
    totalRows: number;
    page: number;
    limit: number;
    totalPages: number;
    columns: Array<{ name: string; dataType: string }>;
    rows: Record<string, any>[];
  } | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRows = async () => {
    try {
      setIsLoading(true);
      const res = await datasetApi.getPreview(datasetId, {
        page,
        limit,
        search: search.trim() || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dataset rows', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [datasetId, page, limit, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRows();
  };

  const handleHeaderClick = (colName: string) => {
    if (sortBy === colName) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colName);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Limit */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within dataset..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No rows match your current search query.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="py-3 px-4 text-slate-400 font-semibold w-12 text-center">#</th>
                {data.columns.map((col) => {
                  const isSorted = sortBy === col.name;
                  return (
                    <th
                      key={col.name}
                      onClick={() => handleHeaderClick(col.name)}
                      className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                          {col.dataType}
                        </span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-4 text-slate-400 text-center font-mono">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  {data.columns.map((col) => {
                    const val = row[col.name];
                    return (
                      <td
                        key={col.name}
                        className="py-2.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-xs truncate"
                      >
                        {val === null || val === undefined ? (
                          <span className="italic text-slate-400 dark:text-slate-500">
                            null
                          </span>
                        ) : typeof val === 'boolean' ? (
                          <span
                            className={`font-semibold ${
                              val ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {String(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {data && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(page * limit, data.totalRows)}
            </span>{' '}
            of <span className="font-semibold text-slate-700 dark:text-slate-200">{data.totalRows}</span> rows
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="px-2 font-medium">
              Page {page} of {data.totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
