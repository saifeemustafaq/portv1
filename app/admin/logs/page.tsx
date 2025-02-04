'use client';

import { useState, useEffect } from 'react';
import { RiRefreshLine, RiDownloadLine, RiFilterLine, RiCalendarLine } from 'react-icons/ri';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'auth' | 'action' | 'system';
  message: string;
  details: any;
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

export default function LogMonitorPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [category, setCategory] = useState<'all' | 'auth' | 'action' | 'system'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (level !== 'all') params.append('level', level);
      if (category !== 'all') params.append('category', category);
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [level, category, startDate, endDate, pagination.page]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleDownload = () => {
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
          <p className="mt-2 text-[#94a3b8]">
            Monitor and analyze system logs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-[#1a1f2e] text-white hover:bg-[#2a2f3e] transition-colors"
          >
            <RiRefreshLine className="mr-2 h-5 w-5" />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <RiDownloadLine className="mr-2 h-5 w-5" />
            Download Logs
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pb-4">
        <div className="flex items-center space-x-2">
          <RiFilterLine className="h-5 w-5 text-[#94a3b8]" />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => setCategory(e.target.value as any)}
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="End Date"
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            showTimeSelect
            dateFormat="MM/dd/yyyy h:mm aa"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 text-sm text-center py-2 px-4 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="bg-[#1a1f2e] rounded-lg border border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-[#94a3b8]">Loading logs...</div>
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
                      <span className="text-sm text-[#94a3b8]">
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
                      <p className="mt-1 text-sm text-[#94a3b8]">
                        User: {log.username}
                      </p>
                    )}
                    {log.ip && (
                      <p className="text-sm text-[#94a3b8]">
                        IP: {log.ip}
                      </p>
                    )}
                    {Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 p-2 bg-black/20 rounded text-sm text-[#94a3b8] overflow-x-auto">
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
            <div className="text-lg text-[#94a3b8]">No logs found</div>
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
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 