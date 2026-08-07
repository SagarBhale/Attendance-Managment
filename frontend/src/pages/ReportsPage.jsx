import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Download, FileText, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetDailyReportQuery } from '../features/reports/reportsApi';
import StatusBadge from '../components/StatusBadge';
import SelfieThumb from '../components/SelfieThumb';

const formatTime = (dt) => (dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const formatHrs = (h) => `${Math.floor(h || 0)}h ${Math.round(((h || 0) % 1) * 60)}m`;

const ReportsPage = () => {
  const user = useSelector(selectCurrentUser);
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ startDate: today, endDate: today, page: 1, limit: 50 });

  const { data, isLoading, refetch } = useGetDailyReportQuery({
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: filters.page,
    limit: filters.limit,
  });

  const report = data?.data || [];
  const pagination = data?.pagination;

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('Attendance Report', 14, 16);
      doc.setFontSize(10);
      doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 24);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      let y = 40;
      const headers = ['Employee', 'Date', 'Punch In', 'Punch Out', 'Hours', 'Status', 'Validation'];
      const colWidths = [40, 25, 25, 25, 20, 25, 25];

      // Header row
      headers.forEach((h, i) => {
        const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.setFont(undefined, 'bold');
        doc.text(h, x, y);
      });
      y += 6;
      doc.line(14, y - 2, 280, y - 2);

      report.forEach((r) => {
        if (y > 190) { doc.addPage(); y = 20; }
        const row = [
          r.employee,
          r.date,
          formatTime(r.punchIn),
          formatTime(r.punchOut),
          formatHrs(r.totalHours),
          r.status,
          r.validationStatus,
        ];
        row.forEach((cell, i) => {
          const x = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.setFont(undefined, 'normal');
          doc.text(String(cell || '—'), x, y);
        });
        y += 7;
      });

      doc.save(`attendance_report_${filters.startDate}_${filters.endDate}.pdf`);
      toast.success('PDF exported!');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  const exportExcel = () => {
    try {
      const wsData = [
        ['Employee', 'Email', 'Department', 'Date', 'Punch In', 'Punch Out', 'Hours', 'Status', 'Validation', 'Remarks', 'OT Status'],
        ...report.map((r) => [
          r.employee,
          r.email,
          r.department,
          r.date,
          formatTime(r.punchIn),
          formatTime(r.punchOut),
          formatHrs(r.totalHours),
          r.status,
          r.validationStatus,
          r.remarks || '',
          r.overtime?.status || '',
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance_${filters.startDate}_${filters.endDate}.xlsx`);
      toast.success('Excel exported!');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Attendance Reports</h1>
          <p className="text-sm text-muted">
            {user?.role === 'employee' ? 'Your personal attendance records' : user?.role === 'manager' ? 'Team attendance report' : 'System-wide attendance report'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={refetch} id="refresh-report-btn">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportExcel} id="export-excel-btn">
            <Download size={14} /> Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF} id="export-pdf-btn">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))} />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ startDate: today, endDate: today, page: 1, limit: 50 })}>
            Today
          </button>
        </div>
      </div>

      {/* Summary */}
      {report.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Records', value: report.length, cls: 'primary' },
            { label: 'Completed', value: report.filter((r) => r.status === 'completed').length, cls: 'success' },
            { label: 'Incomplete', value: report.filter((r) => r.status === 'incomplete').length, cls: 'warning' },
            { label: 'Avg Hours', value: (report.reduce((a, r) => a + (r.totalHours || 0), 0) / report.length).toFixed(1) + 'h', cls: 'primary' },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>In Selfie</th>
                <th>Punch Out</th>
                <th>Out Selfie</th>
                <th>Location</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Validation</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : report.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="empty-state">
                    <FileText size={48} className="empty-icon" />
                    <div className="empty-title">No report data</div>
                    <div className="empty-desc">Select a date range and refresh</div>
                  </div>
                </td></tr>
              ) : report.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.employee}</div>
                    <div className="text-xs text-muted">{r.department}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.date}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatTime(r.punchIn)}</td>
                  <td><SelfieThumb src={r.punchInSelfie} label="Punch In" /></td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatTime(r.punchOut)}</td>
                  <td><SelfieThumb src={r.punchOutSelfie} label="Punch Out" /></td>
                  <td>
                    {r.punchInLocation?.latitude ? (
                      <span className="text-xs text-muted">
                        {r.punchInLocation.latitude.toFixed(3)}, {r.punchInLocation.longitude.toFixed(3)}
                        {r.withinGeofence === false && <span style={{ color: 'var(--danger)' }}> ⚠</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: (r.totalHours || 0) >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                    {formatHrs(r.totalHours)}
                  </td>
                  <td><StatusBadge type="status" value={r.status} /></td>
                  <td>
                    <div><StatusBadge type="validation" value={r.validationStatus} /></div>
                    {r.remarks && <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{r.remarks}</div>}
                  </td>
                  <td>
                    {r.overtime ? (
                      <div>
                        <StatusBadge type="overtime" value={r.overtime.status} />
                        <div className="text-xs text-muted">{r.overtime.requestedHours}h</div>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
