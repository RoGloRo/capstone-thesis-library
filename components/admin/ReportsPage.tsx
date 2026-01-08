'use client';

import React, { useEffect, useState } from 'react';

type ReportType = 'borrowing' | 'overdue' | 'inventory' | 'user_activity';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('borrowing');
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

  const fetchPreview = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          reportType,
          page: p,
          pageSize,
          filters: { startDate, endDate, status, userId },
        }),
      });

      const data = await res.json();
      setRows(data.rows || []);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const downloadCsv = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'csv', reportType, filters: { startDate, endDate, status, userId } }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV download failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full rounded-2xl bg-white dark:bg-gray-800 p-7">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Reports</h2>
        <div className="flex items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="px-3 py-2 rounded border">
            <option value="borrowing">Borrowing Report</option>
            <option value="overdue">Overdue & Penalty Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="user_activity">User Activity Report</option>
          </select>
          <button onClick={downloadCsv} disabled={loading} className="ml-2 bg-primary-admin text-white px-3 py-2 rounded">Download CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-sm text-muted-foreground">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 rounded border" />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 rounded border" />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-1 rounded border">
            <option value="">Any</option>
            <option value="BORROWED">BORROWED</option>
            <option value="RETURNED">RETURNED</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">User ID</label>
          <input placeholder="user id" value={userId} onChange={(e) => setUserId(e.target.value)} className="px-2 py-1 rounded border" />
        </div>
        <div>
          <button onClick={() => fetchPreview(1)} className="bg-gray-200 px-3 py-2 rounded">Apply</button>
        </div>
      </div>

      {/* Table preview */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="text-left">
              {reportType === 'borrowing' && (
                <>
                  <th className="py-2">Book</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Borrowed</th>
                  <th className="py-2">Due</th>
                  <th className="py-2">Returned</th>
                  <th className="py-2">Status</th>
                </>
              )}
              {reportType === 'overdue' && (
                <>
                  <th className="py-2">Book</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Borrowed</th>
                  <th className="py-2">Due</th>
                  <th className="py-2">Status</th>
                </>
              )}
              {reportType === 'inventory' && (
                <>
                  <th className="py-2">Control Number</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Available</th>
                </>
              )}
              {reportType === 'user_activity' && (
                <>
                  <th className="py-2">User</th>
                  <th className="py-2">Borrowed Count</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-6">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-6">No data found</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  {reportType === 'borrowing' && (
                    <>
                      <td className="py-2">{r.bookTitle}</td>
                      <td className="py-2">{r.userName}</td>
                      <td className="py-2">{r.borrowDate ? new Date(r.borrowDate).toLocaleString() : '—'}</td>
                      <td className="py-2">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="py-2">{r.returnDate ? new Date(r.returnDate).toLocaleDateString() : '—'}</td>
                      <td className="py-2">{r.status}</td>
                    </>
                  )}

                  {reportType === 'overdue' && (
                    <>
                      <td className="py-2">{r.bookTitle}</td>
                      <td className="py-2">{r.userName}</td>
                      <td className="py-2">{r.borrowDate ? new Date(r.borrowDate).toLocaleString() : '—'}</td>
                      <td className="py-2">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="py-2">{r.status}</td>
                    </>
                  )}

                  {reportType === 'inventory' && (
                    <>
                      <td className="py-2 font-mono">{r.controlNumber || '—'}</td>
                      <td className="py-2">{r.title}</td>
                      <td className="py-2">{r.totalCopies}</td>
                      <td className="py-2">{r.availableCopies}</td>
                    </>
                  )}

                  {reportType === 'user_activity' && (
                    <>
                      <td className="py-2">{r.userName}</td>
                      <td className="py-2">{r.borrowedCount}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls (simple) */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">Showing page {page}</div>
        <div className="space-x-2">
          <button onClick={() => fetchPreview(Math.max(1, page - 1))} className="px-3 py-1 rounded border">Previous</button>
          <button onClick={() => fetchPreview(page + 1)} className="px-3 py-1 rounded border">Next</button>
        </div>
      </div>
    </section>
  );
}
