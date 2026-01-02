import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Clock,
  FileText,
  Eye
} from 'lucide-react';

/**
 * Audit Logs Page
 * 
 * Admin page for viewing audit logs with:
 * - Paginated log table
 * - Filters by admin, action type, resource type, and date range
 * - Search functionality
 */

const API_BASE = '/api/admin/audit-logs';

// Action type badge colors
const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  BLOCK: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  UNBLOCK: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  ACTIVATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  DEACTIVATE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  ROLE_CHANGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  PASSWORD_RESET: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOGIN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  LOGOUT: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
};

// Resource type icons
const RESOURCE_ICONS = {
  user: User,
  property: FileText,
  location: Activity,
  category: Activity,
  content: FileText,
  review: Activity,
  notification: Activity,
  settings: Activity,
  report: FileText
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Log Details Modal Component
const LogDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-background rounded-t-xl sm:rounded-lg shadow-lg w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            Log Details
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Action</label>
              <div className="mt-1">
                <Badge className={cn(ACTION_COLORS[log.action] || 'bg-gray-100')}>
                  {log.action}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Resource Type</label>
              <p className="mt-1 text-sm sm:text-base capitalize">{log.resourceType}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Admin</label>
              <p className="mt-1 text-sm sm:text-base truncate">{log.adminId?.name || log.adminId?.email || 'Unknown'}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Timestamp</label>
              <p className="mt-1 text-sm sm:text-base">{formatTimestamp(log.timestamp)}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Resource ID</label>
              <p className="mt-1 font-mono text-xs sm:text-sm break-all">{log.resourceId || 'N/A'}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">IP Address</label>
              <p className="mt-1 font-mono text-xs sm:text-sm">{log.ipAddress || 'N/A'}</p>
            </div>
          </div>
          
          {log.changes && Object.keys(log.changes).length > 0 && (
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Changes</label>
              <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          )}
          
          {log.previousValues && Object.keys(log.previousValues).length > 0 && (
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Previous Values</label>
              <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(log.previousValues, null, 2)}
              </pre>
            </div>
          )}
          
          {log.userAgent && (
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">User Agent</label>
              <p className="mt-1 text-xs text-muted-foreground break-all">{log.userAgent}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

// Audit Log Table Row Component (Desktop)
const AuditLogRow = ({ log, onViewDetails }) => {
  const ResourceIcon = RESOURCE_ICONS[log.resourceType] || Activity;
  
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{log.adminId?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground truncate">{log.adminId?.email || ''}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge className={cn('text-xs whitespace-nowrap', ACTION_COLORS[log.action] || 'bg-gray-100')}>
          {log.action}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <ResourceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm capitalize">{log.resourceType}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-mono text-muted-foreground truncate max-w-[120px] block">
          {log.resourceId || 'N/A'}
        </span>
      </td>
      <td className="py-3 px-4">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(log)}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </td>
    </tr>
  );
};

// Audit Log Card Component (Mobile)
const AuditLogCard = ({ log, onViewDetails }) => {
  const ResourceIcon = RESOURCE_ICONS[log.resourceType] || Activity;
  
  return (
    <div className="p-4 border-b last:border-0 space-y-3">
      {/* Header: Action Badge + View Button */}
      <div className="flex items-center justify-between">
        <Badge className={cn('text-xs', ACTION_COLORS[log.action] || 'bg-gray-100')}>
          {log.action}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(log)} className="h-8 px-2">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
      
      {/* Admin Info */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{log.adminId?.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground truncate">{log.adminId?.email || ''}</p>
        </div>
      </div>
      
      {/* Resource Info */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <ResourceIcon className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize text-muted-foreground">{log.resourceType}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground truncate flex-1">
          {log.resourceId ? `ID: ${log.resourceId.slice(0, 12)}...` : ''}
        </span>
      </div>
      
      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatTimestamp(log.timestamp)}</span>
      </div>
    </div>
  );
};

// Main AuditLogs Component
const AuditLogs = () => {
  const navigate = useNavigate();
  
  // Data state
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    resourceTypes: [],
    admins: []
  });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    adminId: 'all',
    action: 'all',
    resourceType: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/filters`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, [navigate]);

  // Fetch audit logs
  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      
      if (filters.adminId && filters.adminId !== 'all') {
        params.append('adminId', filters.adminId);
      }
      if (filters.action && filters.action !== 'all') {
        params.append('action', filters.action);
      }
      if (filters.resourceType && filters.resourceType !== 'all') {
        params.append('resourceType', filters.resourceType);
      }
      if (filters.startDate) {
        params.append('startDate', new Date(filters.startDate).toISOString());
      }
      if (filters.endDate) {
        params.append('endDate', new Date(filters.endDate).toISOString());
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, pagination.limit, filters.adminId, filters.action, filters.resourceType, filters.startDate, filters.endDate, debouncedSearch]);

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs(1);
  }, [filters.adminId, filters.action, filters.resourceType, filters.startDate, filters.endDate, debouncedSearch]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(pagination.page);
    setRefreshing(false);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      adminId: 'all',
      action: 'all',
      resourceType: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const hasActiveFilters = 
    (filters.adminId && filters.adminId !== 'all') ||
    (filters.action && filters.action !== 'all') ||
    (filters.resourceType && filters.resourceType !== 'all') ||
    filters.startDate ||
    filters.endDate ||
    filters.search;

  // Error state
  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load audit logs</h2>
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
            <ClipboardList className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            View and filter admin activity logs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by admin, action, resource type, or date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in logs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9"
            />
          </div>

          {/* Filter Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Admin Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin</label>
              <Select
                value={filters.adminId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, adminId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  {filterOptions.admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {filterOptions.actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource Type</label>
              <Select
                value={filters.resourceType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, resourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions.resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Row 2 - Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="pt-2">
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && logs.length > 0 && (
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

      {/* Audit Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity Logs</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {pagination.total.toLocaleString()} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              {hasActiveFilters && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden">
                {logs.map((log) => (
                  <AuditLogCard
                    key={log._id}
                    log={log}
                    onViewDetails={setSelectedLog}
                  />
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Admin</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Resource</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Resource ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <AuditLogRow
                        key={log._id}
                        log={log}
                        onViewDetails={setSelectedLog}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default AuditLogs;
