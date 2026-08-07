import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: 'General' });
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      dispatch(setCredentials(res.data));
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">⏱</div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #818cf8, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AttendIQ
          </span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join your team's attendance system</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input id="reg-name" name="name" type="text" className="form-input" placeholder="John Doe"
              value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" name="email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Role</label>
              <select id="reg-role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-dept">Department</label>
              <input id="reg-dept" name="department" type="text" className="form-input" placeholder="Engineering"
                value={form.department} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading} id="register-btn">
            {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <UserPlus size={16} />}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-muted text-center" style={{ marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
