const getBadgeClass = (type, value) => {
  if (!value) return 'badge badge-muted';
  
  switch (type) {
    case 'status':
      return value === 'completed' ? 'badge badge-success' :
             value === 'incomplete' ? 'badge badge-warning' : 'badge badge-muted';
    case 'validation':
      return value === 'valid' ? 'badge badge-success' :
             value === 'invalid' ? 'badge badge-danger' : 'badge badge-warning';
    case 'overtime':
      return value === 'approved' ? 'badge badge-success' :
             value === 'rejected' ? 'badge badge-danger' : 'badge badge-warning';
    case 'role':
      return value === 'admin' ? 'badge badge-primary' :
             value === 'manager' ? 'badge badge-info' : 'badge badge-muted';
    default:
      return 'badge badge-muted';
  }
};

const StatusBadge = ({ type, value }) => {
  return <span className={getBadgeClass(type, value)}>{value || 'N/A'}</span>;
};

export default StatusBadge;
