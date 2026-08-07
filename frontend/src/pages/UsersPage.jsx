import { useState } from 'react';
import { Users, UserPlus, Edit, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { useGetAllUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '../features/users/usersApi';
import StatusBadge from '../components/StatusBadge';

const UsersPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data, isLoading, refetch } = useGetAllUsersQuery({ search: search || undefined, role: roleFilter || undefined, page, limit: 15 });
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.data || [];
  const pagination = data?.pagination;

  const openEdit = (user) => {
    setEditModal(user._id);
    setEditForm({ name: user.name, email: user.email, role: user.role, department: user.department, isActive: user.isActive });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ id: editModal, ...editForm }).unwrap();
      toast.success('User updated!');
      setEditModal(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success(`${name} deactivated`);
      refetch();
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="page-container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Management</h1>
          <p className="text-sm text-muted">All registered users in the system</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refetch} id="refresh-users-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <label className="form-label">Search</label>
            <input type="text" className="form-input" placeholder="Name or email..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
            <label className="form-label">Role</label>
            <select className="form-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: 'auto' }} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <Users size={48} className="empty-icon" />
                    <div className="empty-title">No users found</div>
                  </div>
                </td></tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{getInitials(u.name)}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-secondary">{u.email}</td>
                  <td><StatusBadge type="role" value={u.role} /></td>
                  <td className="text-sm">{u.department}</td>
                  <td className="text-sm text-muted">{u.managerId?.name || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} id={`edit-user-${u._id}`}>
                        <Edit size={12} /> Edit
                      </button>
                      {u.isActive && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id, u.name)} id={`deactivate-user-${u._id}`}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '1rem' }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit User</div>
              <button className="btn btn-secondary btn-icon" onClick={() => setEditModal(null)}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editForm.isActive ? 'active' : 'inactive'} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.value === 'active' }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating} id="save-user-btn">
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
