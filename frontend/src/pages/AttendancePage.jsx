import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Filter, RefreshCw } from 'lucide-react';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetAttendanceQuery } from '../features/attendance/attendanceApi';
import StatusBadge from '../components/StatusBadge';
import SelfieThumb from '../components/SelfieThumb';

const formatTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatHours = (h) => {
  if (!h) return '0h 0m';
  return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
};

const AttendancePage = () => {
  const user = useSelector(selectCurrentUser);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', page: 1 });

  const { data, isLoading, refetch } = useGetAttendanceQuery({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page: filters.page,
    limit: 15,
  });

  const records = data?.data || [];
  const pagination = data?.pagination;

  const title = user?.role === 'employee' ? 'My Attendance' : 'Team Attendance';

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{title}</h1>
          <p className="text-sm text-muted">Track daily punch records</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refetch} id="refresh-attendance-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="form-label"><Filter size={12} style={{ display: 'inline' }} /> From Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))}
            />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ startDate: '', endDate: '', page: 1 })}>
            Clear
          </button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {user?.role !== 'employee' && <th>Employee</th>}
                <th>Date</th>
                <th>Punch In</th>
                <th>In Selfie</th>
                <th>Punch Out</th>
                <th>Out Selfie</th>
                <th>Location</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10}><div className="empty-state"><Clock size={48} className="empty-icon" /><div className="empty-title">No records found</div></div></td></tr>
              ) : records.map((r) => (
                <tr key={r._id}>
                  {user?.role !== 'employee' && (
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.userId?.name}</div>
                      <div className="text-xs text-muted">{r.userId?.department}</div>
                    </td>
                  )}
                  <td style={{ fontWeight: 600 }}>{r.date}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatTime(r.punchIn?.time)}</td>
                  <td><SelfieThumb src={r.punchIn?.selfie} label="Punch In Selfie" /></td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatTime(r.punchOut?.time)}</td>
                  <td><SelfieThumb src={r.punchOut?.selfie} label="Punch Out Selfie" /></td>
                  <td>
                    {r.punchIn?.location?.latitude ? (
                      <span className="text-xs text-muted">
                        {r.punchIn.location.latitude.toFixed(3)}, {r.punchIn.location.longitude.toFixed(3)}
                        {r.punchIn.withinGeofence === false && <span style={{ color: 'var(--danger)' }}> ⚠</span>}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: r.totalHours >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                      {formatHours(r.totalHours)}
                    </span>
                  </td>
                  <td><StatusBadge type="status" value={r.status} /></td>
                  <td><StatusBadge type="validation" value={r.validationStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '1rem' }}>
            <button
              className="page-btn"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >‹</button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${filters.page === p ? 'active' : ''}`}
                onClick={() => setFilters((f) => ({ ...f, page: p }))}
              >{p}</button>
            ))}
            <button
              className="page-btn"
              disabled={filters.page === pagination.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >›</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
