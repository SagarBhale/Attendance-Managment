import { useState } from 'react';
import { Check, X, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { useGetAttendanceQuery, useValidateAttendanceMutation } from '../features/attendance/attendanceApi';
import StatusBadge from '../components/StatusBadge';
import SelfieThumb from '../components/SelfieThumb';

const formatTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ValidatePage = () => {
  const [filters, setFilters] = useState({ validationStatus: 'pending', startDate: '', endDate: '', page: 1 });
  const [validateModal, setValidateModal] = useState(null);
  const [remarks, setRemarks] = useState('');

  const { data, isLoading, refetch } = useGetAttendanceQuery({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page: filters.page,
    limit: 15,
  });

  const [validate, { isLoading: validating }] = useValidateAttendanceMutation();

  // Filter by validationStatus client-side for convenience (server already filters but we'll show all)
  const allRecords = data?.data || [];
  const records = filters.validationStatus
    ? allRecords.filter((r) => r.validationStatus === filters.validationStatus)
    : allRecords;

  const handleValidate = async (e) => {
    e.preventDefault();
    try {
      await validate({ id: validateModal.id, validationStatus: validateModal.status, remarks }).unwrap();
      toast.success(`Attendance marked as ${validateModal.status}!`);
      setValidateModal(null);
      setRemarks('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Validation failed');
    }
  };

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Attendance Validation</h1>
          <p className="text-sm text-muted">Review selfies and verify attendance authenticity</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refetch} id="refresh-validate-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter row */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.validationStatus} onChange={(e) => setFilters((f) => ({ ...f, validationStatus: e.target.value, page: 1 }))}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="valid">Valid</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))} />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))} />
          </div>
        </div>
      </div>

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
                <th>Hours</th>
                <th>Geofence</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={10}>
                  <div className="empty-state">
                    <ShieldCheck size={48} className="empty-icon" />
                    <div className="empty-title">No records to validate</div>
                  </div>
                </td></tr>
              ) : records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.userId?.name}</div>
                    <div className="text-xs text-muted">{r.userId?.department}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.date}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatTime(r.punchIn?.time)}</td>
                  <td><SelfieThumb src={r.punchIn?.selfie} label="Punch In Selfie" /></td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatTime(r.punchOut?.time)}</td>
                  <td><SelfieThumb src={r.punchOut?.selfie} label="Punch Out Selfie" /></td>
                  <td style={{ fontWeight: 700, color: r.totalHours >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                    {Math.floor(r.totalHours || 0)}h {Math.round(((r.totalHours || 0) % 1) * 60)}m
                  </td>
                  <td>
                    {r.punchIn?.withinGeofence === true && <span className="badge badge-success">In Zone</span>}
                    {r.punchIn?.withinGeofence === false && <span className="badge badge-danger">Out of Zone</span>}
                    {r.punchIn?.withinGeofence === null && <span className="badge badge-muted">N/A</span>}
                  </td>
                  <td><StatusBadge type="validation" value={r.validationStatus} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => { setValidateModal({ id: r._id, status: 'valid', name: r.userId?.name }); setRemarks(''); }}
                        title="Mark Valid"
                        id={`valid-btn-${r._id}`}
                      >
                        <Check size={12} /> Valid
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { setValidateModal({ id: r._id, status: 'invalid', name: r.userId?.name }); setRemarks(''); }}
                        title="Mark Invalid"
                        id={`invalid-btn-${r._id}`}
                      >
                        <X size={12} /> Invalid
                      </button>
                    </div>
                    {r.remarks && <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{r.remarks}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validate Modal */}
      {validateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {validateModal.status === 'valid' ? '✅ Mark as Valid' : '⚠️ Mark as Invalid'} — {validateModal.name}
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setValidateModal(null)}>×</button>
            </div>
            <form onSubmit={handleValidate}>
              <div className="form-group">
                <label className="form-label">Remarks / Notes {validateModal.status === 'invalid' && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                <textarea
                  className="form-textarea"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes about this attendance record..."
                  required={validateModal.status === 'invalid'}
                  style={{ minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setValidateModal(null)}>Cancel</button>
                <button
                  type="submit"
                  className={`btn ${validateModal.status === 'valid' ? 'btn-success' : 'btn-danger'}`}
                  disabled={validating}
                  id="confirm-validate-btn"
                >
                  {validating ? 'Saving...' : `Confirm ${validateModal.status}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatePage;
