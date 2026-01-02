import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Ban,
  Key,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

/**
 * User Table Component
 * 
 * Displays users in a sortable, paginated table with action buttons
 */

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  seller: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const SortableHeader = ({ column, label, sortBy, sortOrder, onSort }) => {
  const isActive = sortBy === column;
  
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp 
          className={cn(
            'h-3 w-3 -mb-1',
            isActive && sortOrder === 'asc' ? 'text-primary' : 'text-muted-foreground/40'
          )} 
        />
        <ChevronDown 
          className={cn(
            'h-3 w-3',
            isActive && sortOrder === 'desc' ? 'text-primary' : 'text-muted-foreground/40'
          )} 
        />
      </span>
    </button>
  );
};

// Mobile Card Component for Users
const UserCard = ({ 
  user, 
  onEdit, 
  onChangeRole, 
  onStatusChange, 
  onDelete, 
  onResetPassword 
}) => {
  const getStatus = () => {
    if (user.isBlocked) return 'blocked';
    if (user.isActive === false) return 'inactive';
    return 'active';
  };
  
  const status = getStatus();
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-medium text-primary">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{user.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              <Shield className="h-4 w-4 mr-2" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'deactivate')}>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
            )}
            {status === 'inactive' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'activate')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            {status !== 'blocked' && (
              <DropdownMenuItem 
                onClick={() => {
                  const reason = window.prompt('Enter reason for blocking (optional):');
                  onStatusChange(user._id, 'block', reason);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
            {status === 'blocked' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'unblock')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Unblock User
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onResetPassword(user._id)}>
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(user._id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge className={cn('capitalize', ROLE_COLORS[user.role] || ROLE_COLORS.user)}>
          {user.role || 'user'}
        </Badge>
        <Badge className={cn('capitalize', STATUS_COLORS[status])}>
          {status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Phone:</span>
          <p className="font-medium">{user.phone || '-'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Joined:</span>
          <p className="font-medium">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

const UserTableRow = ({ 
  user, 
  onEdit, 
  onChangeRole, 
  onStatusChange, 
  onDelete, 
  onResetPassword 
}) => {
  const getStatus = () => {
    if (user.isBlocked) return 'blocked';
    if (user.isActive === false) return 'inactive';
    return 'active';
  };
  
  const status = getStatus();
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{user.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{user.phone || '-'}</span>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', ROLE_COLORS[user.role] || ROLE_COLORS.user)}>
          {user.role || 'user'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', STATUS_COLORS[status])}>
          {status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              <Shield className="h-4 w-4 mr-2" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'deactivate')}>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </DropdownMenuItem>
            )}
            {status === 'inactive' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'activate')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
            )}
            {status !== 'blocked' && (
              <DropdownMenuItem 
                onClick={() => {
                  const reason = window.prompt('Enter reason for blocking (optional):');
                  onStatusChange(user._id, 'block', reason);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
            {status === 'blocked' && (
              <DropdownMenuItem onClick={() => onStatusChange(user._id, 'unblock')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Unblock User
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onResetPassword(user._id)}>
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(user._id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-border">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded" /></td>
      </tr>
    ))}
  </>
);

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} users
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">{page}</span>
          <span className="text-sm text-muted-foreground">of</span>
          <span className="text-sm font-medium">{totalPages || 1}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
};

// Mobile Card Skeleton for loading state
const CardSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    ))}
  </div>
);

const UserTable = ({
  users,
  loading,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onEdit,
  onChangeRole,
  onStatusChange,
  onDelete,
  onResetPassword
}) => {
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <CardSkeleton />
        ) : users.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onEdit={onEdit}
              onChangeRole={onChangeRole}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onResetPassword={onResetPassword}
            />
          ))
        )}
        
        {!loading && users.length > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="name"
                  label="User"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="role"
                  label="Role"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="createdAt"
                  label="Joined"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserTableRow
                  key={user._id}
                  user={user}
                  onEdit={onEdit}
                  onChangeRole={onChangeRole}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onResetPassword={onResetPassword}
                />
              ))
            )}
          </tbody>
        </table>
        
        {!loading && users.length > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>
    </>
  );
};

export default UserTable;
