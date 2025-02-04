'use client';

import { useState, useEffect } from 'react';
import { RiRefreshLine, RiDownloadLine, RiFilterLine } from 'react-icons/ri';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

export default function LogMonitorPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  // Fetch logs function - to be implemented with actual API endpoint
  const fetchLogs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleDownload = () => {
    // TODO: Implement log download functionality
    const logText = logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
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

  const filteredLogs = logs.filter(log => 
    filter === 'all' ? true : log.level === filter
  );

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

      <div className="flex items-center space-x-4 pb-4">
        <div className="flex items-center space-x-2">
          <RiFilterLine className="h-5 w-5 text-[#94a3b8]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-[#1a1f2e] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
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
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {filteredLogs.map((log, index) => (
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
                      {log.source && (
                        <span className="text-sm text-[#94a3b8]">
                          {log.source}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-white">{log.message}</p>
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
    </div>
  );
} 