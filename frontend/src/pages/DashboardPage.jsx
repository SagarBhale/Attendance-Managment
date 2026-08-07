import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Clock, MapPin, Camera, CheckCircle, XCircle, Timer, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import { selectCurrentUser } from '../features/auth/authSlice';
import {
  useGetTodayAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetStatsQuery,
} from '../features/attendance/attendanceApi';
import { useCreateOvertimeRequestMutation } from '../features/overtime/overtimeApi';
import useGeolocation from '../hooks/useGeolocation';
import CameraCapture from '../components/CameraCapture';
import StatusBadge from '../components/StatusBadge';

const formatTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatHours = (h) => {
  if (!h) return '0h 0m';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const { data: todayData, refetch } = useGetTodayAttendanceQuery();
  const { data: statsData } = useGetStatsQuery();
  const [punchIn] = usePunchInMutation();
  const [punchOut] = usePunchOutMutation();
  const [createOT] = useCreateOvertimeRequestMutation();
  const { getLocation, loading: locLoading } = useGeolocation();

  const [showCamera, setShowCamera] = useState(false);
  const [punchType, setPunchType] = useState(null); // 'in' | 'out'
  const [showOTModal, setShowOTModal] = useState(false);
  const [otForm, setOtForm] = useState({ requestedHours: 1, reason: '' });
  const [processing, setProcessing] = useState(false);

  const attendance = todayData?.data;
  const stats = statsData?.data;

  const isPunchedIn = !!attendance?.punchIn?.time;
  const isPunchedOut = !!attendance?.punchOut?.time;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const handlePunchClick = (type) => {
    setPunchType(type);
    setShowCamera(true);
  };

  const handleSelfieCapture = async (selfie) => {
    setShowCamera(false);
    setProcessing(true);
    try {
      const loc = await getLocation();
      const payload = {
        selfie,
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
      };

      if (punchType === 'in') {
        await punchIn(payload).unwrap();
        toast.success('✅ Punched in successfully!');
      } else {
        await punchOut(payload).unwrap();
        toast.success('✅ Punched out successfully!');
      }
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err || 'Failed to punch');
    } finally {
      setProcessing(false);
    }
  };

  const handleOTSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOT({ attendanceId: attendance._id, ...otForm }).unwrap();
      toast.success('Overtime request submitted!');
      setShowOTModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit');
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted text-sm">{today}</p>
      </div>

      {/* Stats Grid */}
      {user?.role === 'employee' && (
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon primary"><Calendar size={20} /></div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Total Days This Month</div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon success"><CheckCircle size={20} /></div>
            <div className="stat-value">{stats?.completed || 0}</div>
            <div className="stat-label">Completed Shifts</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon warning"><Clock size={20} /></div>
            <div className="stat-value">{stats?.incomplete || 0}</div>
            <div className="stat-label">Incomplete Shifts</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon danger"><XCircle size={20} /></div>
            <div className="stat-value">{stats?.pendingValidation || 0}</div>
            <div className="stat-label">Pending Validation</div>
          </div>
        </div>
      )}

      {/* Manager/Admin Summary Stats */}
      {(user?.role === 'manager' || user?.role === 'admin') && (
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon primary"><Calendar size={20} /></div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">{user?.role === 'admin' ? 'Total Records' : 'Team Records'}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon success"><CheckCircle size={20} /></div>
            <div className="stat-value">{stats?.completed || 0}</div>
            <div className="stat-label">Completed Shifts</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon warning"><Clock size={20} /></div>
            <div className="stat-value">{stats?.pendingValidation || 0}</div>
            <div className="stat-label">Pending Validation</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon danger"><XCircle size={20} /></div>
            <div className="stat-value">{stats?.incomplete || 0}</div>
            <div className="stat-label">Incomplete Shifts</div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Punch Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Attendance</div>
              <div className="card-subtitle">{new Date().toLocaleDateString()}</div>
            </div>
            {attendance && <StatusBadge type="status" value={attendance.status} />}
          </div>

          <div className="punch-container">
            {/* Punch In Button */}
            {!isPunchedIn ? (
              <button
                className="punch-btn punch-btn-in"
                onClick={() => handlePunchClick('in')}
                disabled={processing || locLoading}
                id="punch-in-btn"
              >
                <Clock size={36} />
                <span>{processing ? 'Processing...' : 'Punch In'}</span>
              </button>
            ) : !isPunchedOut ? (
              <button
                className="punch-btn punch-btn-out"
                onClick={() => handlePunchClick('out')}
                disabled={processing || locLoading}
                id="punch-out-btn"
              >
                <Clock size={36} />
                <span>{processing ? 'Processing...' : 'Punch Out'}</span>
              </button>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--bg-secondary)', border: '3px solid var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto' }}>
                  <CheckCircle size={36} color="var(--success)" />
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>Day Complete</span>
                </div>
              </div>
            )}

            {/* Time Info */}
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="text-xs text-muted">Punch In</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>
                  {formatTime(attendance?.punchIn?.time)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="text-xs text-muted">Punch Out</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
                  {formatTime(attendance?.punchOut?.time)}
                </div>
              </div>
            </div>

            {/* Working Hours */}
            {isPunchedIn && (
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1.5rem',
                textAlign: 'center',
                border: '1px solid var(--border)',
                width: '100%',
              }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Working Hours</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: (attendance?.totalHours || 0) >= 8 ? 'var(--success)' : 'var(--warning)' }}>
                  {formatHours(attendance?.totalHours)}
                </div>
                <div className="text-xs text-muted">
                  {(attendance?.totalHours || 0) >= 8 ? '✅ Standard shift completed' : `⏳ ${formatHours(8 - (attendance?.totalHours || 0))} remaining`}
                </div>
              </div>
            )}

            {/* Location Info */}
            {attendance?.punchIn?.location?.latitude && (
              <div className="location-info w-full">
                <MapPin size={14} color="var(--primary-light)" />
                <span>
                  {attendance.punchIn.location.latitude.toFixed(4)}, {attendance.punchIn.location.longitude.toFixed(4)}
                  {attendance.punchIn.withinGeofence !== null && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      {attendance.punchIn.withinGeofence ? '🟢 In zone' : '🔴 Out of zone'}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* OT Request */}
            {isPunchedOut && !attendance?.overtimeRequest && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowOTModal(true)}
                id="request-ot-btn"
              >
                <Timer size={14} /> Request Overtime
              </button>
            )}

            {/* OT Status */}
            {attendance?.overtimeRequest && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <Timer size={14} color="var(--accent)" />
                <span className="text-muted">OT Request:</span>
                <StatusBadge type="overtime" value={attendance.overtimeRequest?.status || 'pending'} />
              </div>
            )}

            {/* Validation */}
            {attendance && (
              <div style={{ display: 'flex', align: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <Camera size={14} color="var(--text-muted)" />
                <span className="text-muted">Selfie Verification:</span>
                <StatusBadge type="validation" value={attendance.validationStatus} />
              </div>
            )}
          </div>
        </div>

        {/* Today Summary Card */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <div className="card-title">Punch Details</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Punch In Time', value: formatTime(attendance?.punchIn?.time), color: 'var(--success)' },
                { label: 'Punch Out Time', value: formatTime(attendance?.punchOut?.time), color: 'var(--danger)' },
                { label: 'Total Hours', value: formatHours(attendance?.totalHours), color: attendance?.totalHours >= 8 ? 'var(--success)' : 'var(--warning)' },
                { label: 'Shift Status', value: attendance?.status || 'No record', color: 'var(--text-primary)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm text-secondary">{label}</span>
                  <span style={{ fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          {attendance?.remarks && (
            <div className="card" style={{ borderColor: attendance.validationStatus === 'invalid' ? 'var(--danger)' : 'var(--border)' }}>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Remarks from Validator</div>
              <p className="text-sm text-secondary">{attendance.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">📸 Take Selfie — {punchType === 'in' ? 'Punch In' : 'Punch Out'}</div>
            </div>
            <p className="text-xs text-muted" style={{ marginBottom: '1rem' }}>
              Live selfie required. File upload is not allowed.
            </p>
            <CameraCapture
              onCapture={handleSelfieCapture}
              onCancel={() => setShowCamera(false)}
            />
          </div>
        </div>
      )}

      {/* OT Modal */}
      {showOTModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Request Overtime</div>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowOTModal(false)}>×</button>
            </div>
            <form onSubmit={handleOTSubmit}>
              <div className="form-group">
                <label className="form-label">Requested Hours</label>
                <input
                  type="number"
                  className="form-input"
                  value={otForm.requestedHours}
                  onChange={(e) => setOtForm((f) => ({ ...f, requestedHours: parseFloat(e.target.value) }))}
                  min="0.5"
                  max="8"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-textarea"
                  value={otForm.reason}
                  onChange={(e) => setOtForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Describe why overtime is needed..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOTModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="submit-ot-btn">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
