import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Clock, FileText, Users, LogOut,
  CheckSquare, Timer, Settings, ChevronRight
} from 'lucide-react';
import { logout, selectCurrentUser } from '../features/auth/authSlice';

const Sidebar = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const employeeLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: Clock, label: 'My Attendance' },
    { to: '/overtime', icon: Timer, label: 'Overtime' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  const managerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/team-attendance', icon: Clock, label: 'Team Attendance' },
    { to: '/validate', icon: CheckSquare, label: 'Validate' },
    { to: '/overtime', icon: Timer, label: 'Overtime Requests' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'All Users' },
    { to: '/team-attendance', icon: Clock, label: 'All Attendance' },
    { to: '/validate', icon: CheckSquare, label: 'Validate' },
    { to: '/overtime', icon: Timer, label: 'Overtime' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'manager' ? managerLinks : employeeLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⏱</div>
        <span className="sidebar-logo-text">AttendIQ</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">Navigation</p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-item-icon" size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={14} style={{ opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="nav-item" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
          <LogOut size={18} className="nav-item-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
