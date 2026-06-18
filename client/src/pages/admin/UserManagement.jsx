import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import UserTable from '../../components/admin/UserTable';
import UserFormModal from '../../components/admin/UserFormModal';
import RoleChangeModal from '../../components/admin/RoleChangeModal';
import BulkActionToolbar from '../../components/admin/BulkActionToolbar';
import UserProfileDrawer from '../../components/admin/UserProfileDrawer';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import FrictionConfirmModal from '../../components/admin/FrictionConfirmModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  CheckCircle
} from 'lucide-react';

/**
 * User Management Page
 * 
 * Admin page for managing users with:
 * - Paginated user table
 * - Search and filter capabilities
 * - Create/Edit/Delete user actions
 * - Role and status management
 */

const API_BASE = '/api/admin/users';

const UserManagement = () => {
  const navigate = useNavigate();
  
  // Data state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Profile drawer state
  const [drawerUserId, setDrawerUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleViewProfile = (user) => {
    setDrawerUserId(user._id);
    setDrawerOpen(true);
  };

  // Action modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [userForAction, setUserForAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (roleFilter && roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, pagination.limit, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

  // Initial load and filter changes
  useEffect(() => {
    fetchUsers(1);
  }, [debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(pagination.page);
    setRefreshing(false);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSelectedIds([]);
  };

  const hasActiveFilters = search || roleFilter !== 'all' || statusFilter !== 'all';

  // User actions
  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormMode('edit');
    setUserFormOpen(true);
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleUserSaved = () => {
    setUserFormOpen(false);
    setSelectedUser(null);
    fetchUsers(pagination.page);
  };

  const handleRoleChanged = () => {
    setRoleModalOpen(false);
    setSelectedUser(null);
    fetchUsers(pagination.page);
  };

  const handleStatusChange = async (user, action, reason) => {
    const targetUser = typeof user === 'string' ? users.find(u => u._id === user) : user;
    if (!targetUser) return;

    if (action === 'block') {
      setUserForAction(targetUser);
      setBlockModalOpen(true);
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE}/${targetUser._id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ action, reason })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchUsers(pagination.page);
        setSelectedIds([]); // Clear selection after status change
      } else {
        throw new Error(data.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err.message);
    }
  };

  const executeBlockUser = async (reasonText) => {
    setActionLoading(true);
    try {
      const response = await authenticatedFetch(`${API_BASE}/${userForAction._id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'block', reason: reasonText })
      }, navigate);
      
      const data = await response.json();
      if (data.success) {
        setBlockModalOpen(false);
        fetchUsers(pagination.page);
        setSelectedIds([]);
      } else {
        throw new Error(data.message || 'Failed to block user');
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUserForAction(user);
    setDeleteModalOpen(true);
  };

  const executeDeleteUser = async () => {
    setActionLoading(true);
    try {
      const response = await authenticatedFetch(`${API_BASE}/${userForAction._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteModalOpen(false);
        fetchUsers(pagination.page);
        setSelectedIds([]);
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = (user) => {
    setUserForAction(user);
    setResetPwdModalOpen(true);
  };

  const executeResetPassword = async () => {
    setActionLoading(true);
    try {
      const response = await authenticatedFetch(`${API_BASE}/${userForAction._id}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sendEmail: true })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setResetPwdModalOpen(false);
        setTempPassword(data.data.temporaryPassword);
        setSuccessModalOpen(true);
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk action handler
  const handleBulkAction = async (actionKey, ids, reason) => {
    try {
      let url = `${API_BASE}/bulk`;
      let method = 'PATCH';
      let body = {};

      switch (actionKey) {
        case 'block':
        case 'unblock':
        case 'deactivate':
          url = `${API_BASE}/bulk/status`;
          body = { ids, action: actionKey };
          break;
        case 'delete':
          method = 'DELETE';
          url = `${API_BASE}/bulk`;
          body = { ids };
          break;
        case 'export':
          method = 'POST';
          url = `${API_BASE}/bulk/export`;
          body = { ids, format: 'csv' };
          // Handle file download
          const res = await authenticatedFetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) }, navigate);
          const blob = await res.blob();
          const dlUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = 'users-export.csv';
          a.click();
          window.URL.revokeObjectURL(dlUrl);
          setSelectedIds([]);
          return;
        default:
          return;
      }

      const response = await authenticatedFetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      }, navigate);

      const data = await response.json();
      if (data.success) {
        fetchUsers(pagination.page);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Bulk action error:', err);
    }
  };

  // Error state
  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load users</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && users.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <UserTable
            users={users}
            loading={loading}
            pagination={pagination}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onEdit={handleEditUser}
            onChangeRole={handleChangeRole}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteUser}
            onResetPassword={handleResetPassword}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        entityType="users"
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
      />

      {/* User Form Modal */}
      <UserFormModal
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={selectedUser}
        mode={formMode}
        onSaved={handleUserSaved}
      />

      {/* Role Change Modal */}
      <RoleChangeModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        user={selectedUser}
        onRoleChanged={handleRoleChanged}
      />

      {/* Custom Block Modal */}
      <FrictionConfirmModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        title="Block User Account"
        description={`Are you sure you want to block ${userForAction?.name || 'this user'} (${userForAction?.email || ''})? They will be immediately signed out and restricted from logging in or using platform services.`}
        confirmText="Block User"
        variant="destructive"
        requiresReason={true}
        reasonPlaceholder="e.g. Terms violation, spam listings, multiple reports..."
        onConfirm={executeBlockUser}
        loading={actionLoading}
      />

      {/* Custom Delete Modal */}
      <FrictionConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete User Account"
        description={`Are you sure you want to delete ${userForAction?.name || 'this user'} (${userForAction?.email || ''})? This will anonymize their personal data and soft-delete the account. This action cannot be undone.`}
        confirmText="Delete Account"
        actionText="DELETE"
        variant="destructive"
        onConfirm={executeDeleteUser}
        loading={actionLoading}
      />

      {/* Custom Reset Password Modal */}
      <FrictionConfirmModal
        open={resetPwdModalOpen}
        onOpenChange={setResetPwdModalOpen}
        title="Reset User Password"
        description={`Are you sure you want to reset the password for ${userForAction?.name || 'this user'} (${userForAction?.email || ''})? A temporary password will be generated for them.`}
        confirmText="Reset Password"
        variant="warning"
        onConfirm={executeResetPassword}
        loading={actionLoading}
      />

      {/* Temporary Password Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-green-600 dark:text-green-400 flex items-center gap-2 font-bold">
              <CheckCircle className="h-5 w-5" />
              Password Reset Successful
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              A temporary password has been successfully generated for {userForAction?.name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted p-3 rounded-lg border border-border flex items-center justify-between">
              <span className="font-mono font-bold text-lg tracking-wider text-foreground select-all">
                {tempPassword}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Please share this temporary password securely with the user. They will be prompted to change it upon their next login.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Drawer */}
      <UserProfileDrawer
        userId={drawerUserId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default UserManagement;
