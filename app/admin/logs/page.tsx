'use client';

import { useState, useEffect, useCallback } from 'react';
import { RiRefreshLine, RiDownloadLine, RiFilterLine, RiCalendarLine } from 'react-icons/ri';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { logClientError, logClientAction } from '@/app/utils/clientLogger';

interface LogDetails {
  [key: string]: string | number | boolean | null | undefined;
  error?: string;
  stack?: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'auth' | 'action' | 'system';
  message: string;
  details: LogDetails;
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function LogMonitorContent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [category, setCategory] = useState<'all' | 'auth' | 'action' | 'system'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (level !== 'all') params.append('level', level);
      if (category !== 'all') params.append('category', category);
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/logs?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch logs: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      });
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Log successful action
      await logClientAction('Logs fetched successfully', {
        filters: { level, category, startDate, endDate },
        resultsCount: data.logs?.length || 0
      });
    } catch (err) {
      const error = err as Error;
      setError('Failed to fetch logs. Please try again later.');
      
      // Log the error
      await logClientError('system', 'Failed to fetch logs', error);
      
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [level, category, startDate, endDate, pagination.page, pagination.limit]);

  const retryFetchLogs = useCallback(async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      await fetchLogs();
    }
  }, [fetchLogs, retryCount]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchLogs();
      } catch (err) {
        const error = err as Error;
        console.error('Error in useEffect:', error);
        await logClientError('system', 'Error in logs page useEffect', error);
      }
    };
    
    void fetchData();
  }, [level, category, startDate, endDate, pagination.page, fetchLogs]);

  const handleRefresh = async () => {
    try {
      await logClientAction('Logs refresh requested');
      await fetchLogs();
    } catch (err) {
      const error = err as Error;
      await logClientError('system', 'Error refreshing logs', error);
      setError('Failed to refresh logs. Please try again.');
    }
  };

  const handleDownload = async () => {
    try {
      const logText = logs
        .map(log => {
          const details = JSON.stringify(log.details, null, 2);
          return `[${new Date(log.timestamp).toLocaleString()}] ${log.level.toUpperCase()} [${log.category}]: ${log.message}
User: ${log.username || 'N/A'}
IP: ${log.ip || 'N/A'}
Path: ${log.path || 'N/A'}
Details: ${details}
-------------------`;
        })
        .join('\n');
      
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      await logClientAction('Logs downloaded', { 
        count: logs.length,
        filters: { level, category, startDate, endDate }
      });
    } catch (err) {
      const error = err as Error;
      await logClientError('system', 'Error downloading logs', error);
      setError('Failed to download logs. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white serif">
            Log Monitor
          </h1>
          <p className="mt-2 text-gray-300">
            Monitor and analyze system logs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-[#1a1f2e] text-white hover:bg-[#2a2f3e] transition-colors"
            disabled={loading}
          >
            <RiRefreshLine className="mr-2 h-5 w-5" />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            disabled={loading || logs.length === 0}
          >
            <RiDownloadLine className="mr-2 h-5 w-5" />
            Download Logs
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pb-4">
        <div className="flex items-center space-x-2">
          <RiFilterLine className="h-5 w-5 text-gray-300" />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as 'all' | 'info' | 'warn' | 'error')}
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | 'auth' | 'action' | 'system')}
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="all">All Categories</option>
            <option value="auth">Authentication</option>
            <option value="action">User Actions</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <RiCalendarLine className="h-5 w-5 text-[#94a3b8]" />
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Start Date"
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            showTimeSelect
            dateFormat="MM/dd/yyyy h:mm aa"
            disabled={loading}
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="End Date"
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            showTimeSelect
            dateFormat="MM/dd/yyyy h:mm aa"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm py-2 px-4 rounded-lg border border-red-500/20 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={retryFetchLogs}
            disabled={retryCount >= 3 || loading}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded transition-colors"
          >
            Retry {retryCount > 0 ? `(${retryCount}/3)` : ''}
          </button>
        </div>
      )}

      <div className="bg-[#1a1f2e] rounded-lg border border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-300">Loading logs...</div>
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {logs.map((log, index) => (
              <div
                key={index}
                className="p-4 hover:bg-[#2a2f3e] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.level === 'error'
                            ? 'bg-red-500/10 text-red-400'
                            : log.level === 'warn'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400"
                      >
                        {log.category}
                      </span>
                    </div>
                    <p className="mt-1 text-white">{log.message}</p>
                    {log.username && (
                      <p className="mt-1 text-sm text-gray-300">
                        User: {log.username}
                      </p>
                    )}
                    {log.ip && (
                      <p className="text-sm text-gray-300">
                        IP: {log.ip}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 p-2 bg-black/20 rounded text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-300">No logs found</div>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                pagination.page === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1f2e] text-[#94a3b8] hover:bg-[#2a2f3e]'
              }`}
              disabled={loading}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogMonitorPage() {
  return (
    <ErrorBoundary name="LogMonitorPage">
      <LogMonitorContent />
    </ErrorBoundary>
  );
} 