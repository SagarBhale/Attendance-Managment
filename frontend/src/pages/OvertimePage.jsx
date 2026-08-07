import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, Timer, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetOvertimeRequestsQuery, useReviewOvertimeRequestMutation } from '../features/overtime/overtimeApi';
import StatusBadge from '../components/StatusBadge';

const OvertimePage = () => {
  const user = useSelector(selectCurrentUser);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { id, status }
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading, refetch } = useGetOvertimeRequestsQuery({ status: statusFilter || undefined });
  const [reviewRequest, { isLoading: reviewing }] = useReviewOvertimeRequestMutation();

  const requests = data?.data || [];

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await reviewRequest({ id: reviewModal.id, status: reviewModal.status, reviewNote }).unwrap();
      toast.success(`Request ${reviewModal.status}!`);
      setReviewModal(null);
      setReviewNote('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Overtime Requests</h1>
          <p className="text-sm text-muted">
            {user?.role === 'employee' ? 'Your overtime history' : 'Review team overtime requests'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refetch} id="refresh-ot-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {user?.role !== 'employee' && <th>Employee</th>}
                <th>Date</th>
                <th>Hours Worked</th>
                <th>OT Requested</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Review Note</th>
                {(user?.role === 'manager' || user?.role === 'admin') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <Timer size={48} className="empty-icon" />
                    <div className="empty-title">No overtime requests</div>
                  </div>
                </td></tr>
              ) : requests.map((r) => (
                <tr key={r._id}>
                  {user?.role !== 'employee' && (
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.employeeId?.name}</div>
                      <div className="text-xs text-muted">{r.employeeId?.department}</div>
                    </td>
                  )}
                  <td style={{ fontWeight: 600 }}>{r.attendanceId?.date}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: (r.attendanceId?.totalHours || 0) >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                      {Math.floor(r.attendanceId?.totalHours || 0)}h {Math.round(((r.attendanceId?.totalHours || 0) % 1) * 60)}m
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{r.requestedHours}h</td>
                  <td style={{ maxWidth: 200, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.reason}</td>
                  <td><StatusBadge type="overtime" value={r.status} /></td>
                  <td className="text-xs text-muted">{r.reviewNote || '—'}</td>
                  {(user?.role === 'manager' || user?.role === 'admin') && (
                    <td>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => { setReviewModal({ id: r._id, status: 'approved' }); setReviewNote(''); }}
                            id={`approve-ot-${r._id}`}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => { setReviewModal({ id: r._id, status: 'rejected' }); setReviewNote(''); }}
                            id={`reject-ot-${r._id}`}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {r.status !== 'pending' && (
                        <span className="text-xs text-muted">Reviewed by {r.reviewedBy?.name}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {reviewModal.status === 'approved' ? '✅ Approve' : '❌ Reject'} Overtime Request
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setReviewModal(null)}>×</button>
            </div>
            <form onSubmit={handleReview}>
              <div className="form-group">
                <label className="form-label">Review Note (optional)</label>
                <textarea
                  className="form-textarea"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note for the employee..."
                  style={{ minHeight: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                <button
                  type="submit"
                  className={`btn ${reviewModal.status === 'approved' ? 'btn-success' : 'btn-danger'}`}
                  disabled={reviewing}
                  id="confirm-review-btn"
                >
                  {reviewing ? 'Processing...' : `Confirm ${reviewModal.status}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimePage;
