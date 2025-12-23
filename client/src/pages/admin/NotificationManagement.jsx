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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  FileText,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

/**
 * Notification Management Page
 * 
 * Admin page for managing notifications with:
 * - Send notification form
 * - Notification templates management
 * - Delivery logs view
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

const API_BASE = '/api/admin/notifications';

const CHANNEL_ICONS = {
  'in-app': Bell,
  'email': Mail,
  'sms': Smartphone,
  'push': MessageSquare
};

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
};

const TYPE_COLORS = {
  individual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  broadcast: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  targeted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
};

// Send Notification Modal Component
const SendNotificationModal = ({ open, onOpenChange, onSent }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'individual',
    userIds: [],
    targetRoles: [],
    subject: '',
    message: '',
    channel: 'in-app'
  });

  // Fetch users for individual notifications
  useEffect(() => {
    if (open && formData.type === 'individual') {
      fetchUsers();
    }
  }, [open, formData.type, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({ limit: '50' });
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await authenticatedFetch(`/api/admin/users?${params}`, {
        headers: getHeaders()
      }, navigate);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = formData.type === 'broadcast' ? `${API_BASE}/broadcast` : `${API_BASE}/send`;
      const body = formData.type === 'broadcast' 
        ? {
            subject: formData.subject,
            message: formData.message,
            channel: formData.channel,
            targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined
          }
        : {
            userIds: formData.userIds,
            subject: formData.subject,
            message: formData.message,
            channel: formData.channel
          };

      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSent();
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'individual',
      userIds: [],
      targetRoles: [],
      subject: '',
      message: '',
      channel: 'in-app'
    });
    setError(null);
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  const toggleRoleSelection = (role) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to users via your preferred channel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notification Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'individual' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'individual', targetRoles: [] }))}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Individual
              </Button>
              <Button
                type="button"
                variant={formData.type === 'broadcast' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, type: 'broadcast', userIds: [] }))}
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                Broadcast
              </Button>
            </div>
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel</label>
            <Select value={formData.channel} onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-app">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> In-App
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> SMS
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Selection for Individual */}
          {formData.type === 'individual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Recipients</label>
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {loadingUsers ? (
                  <div className="p-4 text-center text-muted-foreground">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No users found</div>
                ) : (
                  users.map(user => (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className={cn(
                        'flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 border-b last:border-b-0',
                        formData.userIds.includes(user._id) && 'bg-primary/10'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center',
                        formData.userIds.includes(user._id) ? 'bg-primary border-primary' : 'border-input'
                      )}>
                        {formData.userIds.includes(user._id) && (
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {formData.userIds.length > 0 && (
                <p className="text-sm text-muted-foreground">{formData.userIds.length} user(s) selected</p>
              )}
            </div>
          )}

          {/* Role Selection for Broadcast */}
          {formData.type === 'broadcast' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Roles (optional)</label>
              <p className="text-xs text-muted-foreground">Leave empty to send to all users</p>
              <div className="flex flex-wrap gap-2">
                {['user', 'owner', 'agent', 'seller', 'admin'].map(role => (
                  <Button
                    key={role}
                    type="button"
                    variant={formData.targetRoles.includes(role) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRoleSelection(role)}
                    className="capitalize"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Notification subject"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your message..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (formData.type === 'individual' && formData.userIds.length === 0)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Template Modal Component
const TemplateModal = ({ open, onOpenChange, template, onSaved }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subject: '',
    body: '',
    category: 'custom',
    isActive: true
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        slug: template.slug || '',
        subject: template.subject || '',
        body: template.body || '',
        category: template.category || 'custom',
        isActive: template.isActive !== false
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        subject: '',
        body: '',
        category: 'custom',
        isActive: true
      });
    }
  }, [template, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = template ? `${API_BASE}/templates/${template._id}` : `${API_BASE}/templates`;
      const method = template ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSaved();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to save template');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {template ? 'Update the notification template' : 'Create a new notification template'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  name,
                  slug: !template ? generateSlug(name) : prev.slug
                }));
              }}
              placeholder="Template name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="template-slug"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Notification subject"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Body</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Template body content..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {template ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Log Detail Modal Component
const LogDetailModal = ({ open, onOpenChange, logId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState(null);

  useEffect(() => {
    if (open && logId) {
      fetchLogDetail();
    }
  }, [open, logId]);

  const fetchLogDetail = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE}/logs/${logId}`, {
        headers: getHeaders()
      }, navigate);
      const data = await response.json();
      
      if (data.success) {
        setLog(data.data);
      }
    } catch (err) {
      console.error('Error fetching log detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Notification Log Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : log ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge className={cn('capitalize', TYPE_COLORS[log.type])}>{log.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Channel</p>
                <Badge variant="outline" className="capitalize">{log.channel}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={cn('capitalize', STATUS_COLORS[log.status])}>{log.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent By</p>
                <p className="text-sm font-medium">{log.sentBy?.name || 'Unknown'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium">{log.subject}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Message</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{log.message}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-2xl font-bold">{log.totalRecipients || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{log.sentCount || 0}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{log.failedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Timeline</p>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Created:</span> {formatDate(log.createdAt)}</p>
                {log.completedAt && <p><span className="text-muted-foreground">Completed:</span> {formatDate(log.completedAt)}</p>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Log not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Pagination Component
const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} items
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">{page}</span>
          <span className="text-sm text-muted-foreground">of</span>
          <span className="text-sm font-medium">{totalPages || 1}</span>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Main Component
const NotificationManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('logs');
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(null);
  const [logsFilters, setLogsFilters] = useState({ type: 'all', channel: 'all', status: 'all' });
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState(null);
  
  // Modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [logDetailModalOpen, setLogDetailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: logsPagination.limit.toString()
      });
      
      if (logsFilters.type !== 'all') params.append('type', logsFilters.type);
      if (logsFilters.channel !== 'all') params.append('channel', logsFilters.channel);
      if (logsFilters.status !== 'all') params.append('status', logsFilters.status);
      
      const response = await authenticatedFetch(`${API_BASE}/logs?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs);
        setLogsPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      setLogsError(err.message);
    } finally {
      setLogsLoading(false);
    }
  }, [navigate, logsPagination.limit, logsFilters]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      
      const response = await authenticatedFetch(`${API_BASE}/templates`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data.templates);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (err) {
      setTemplatesError(err.message);
    } finally {
      setTemplatesLoading(false);
    }
  }, [navigate]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/stats`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [navigate]);

  // Initial load
  useEffect(() => {
    fetchLogs(1);
    fetchTemplates();
    fetchStats();
  }, []);

  // Refetch logs when filters change
  useEffect(() => {
    fetchLogs(1);
  }, [logsFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLogs(logsPagination.page), fetchTemplates(), fetchStats()]);
    setRefreshing(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/templates/${templateId}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
      } else {
        throw new Error(data.message || 'Failed to delete template');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Management
          </h1>
          <p className="text-muted-foreground">
            Send notifications and manage templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={() => setSendModalOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalNotifications || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalSent || 0}</p>
                  <p className="text-sm text-muted-foreground">Sent Successfully</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalRecipients || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Recipients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.summary?.totalFailed || 0}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'logs' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Delivery Logs
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'templates' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Templates
        </button>
      </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base">Delivery Logs</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={logsFilters.type} onValueChange={(value) => setLogsFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="broadcast">Broadcast</SelectItem>
                    <SelectItem value="targeted">Targeted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logsFilters.channel} onValueChange={(value) => setLogsFilters(prev => ({ ...prev, channel: value }))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="in-app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logsFilters.status} onValueChange={(value) => setLogsFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logsError ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{logsError}</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards for Logs */}
                <div className="md:hidden space-y-3 p-4">
                  {logsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                      </div>
                    ))
                  ) : logs.length === 0 ? (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      No notification logs found
                    </div>
                  ) : (
                    logs.map((log) => {
                      const ChannelIcon = CHANNEL_ICONS[log.channel] || Bell;
                      return (
                        <div key={log._id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm">{log.subject}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                setSelectedLogId(log._id);
                                setLogDetailModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge className={cn('capitalize', TYPE_COLORS[log.type])}>{log.type}</Badge>
                            <Badge variant="outline" className="capitalize">
                              <ChannelIcon className="h-3 w-3 mr-1" />
                              {log.channel}
                            </Badge>
                            <Badge className={cn('capitalize', STATUS_COLORS[log.status])}>{log.status}</Badge>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Recipients: {log.sentCount || 0}/{log.totalRecipients || 0}
                            </span>
                            <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {!logsLoading && logs.length > 0 && (
                    <Pagination pagination={logsPagination} onPageChange={(page) => fetchLogs(page)} />
                  )}
                </div>

                {/* Desktop Table for Logs */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Subject</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Channel</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Recipients</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                          </tr>
                        ))
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                            No notification logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => {
                          const ChannelIcon = CHANNEL_ICONS[log.channel] || Bell;
                          return (
                            <tr key={log._id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <p className="font-medium truncate max-w-[200px]">{log.subject}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={cn('capitalize', TYPE_COLORS[log.type])}>{log.type}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="capitalize">
                                  <ChannelIcon className="h-3 w-3 mr-1" />
                                  {log.channel}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm">
                                  {log.sentCount || 0}/{log.totalRecipients || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={cn('capitalize', STATUS_COLORS[log.status])}>{log.status}</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedLogId(log._id);
                                    setLogDetailModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {!logsLoading && logs.length > 0 && (
                    <Pagination pagination={logsPagination} onPageChange={(page) => fetchLogs(page)} />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notification Templates</CardTitle>
              <Button size="sm" onClick={() => { setSelectedTemplate(null); setTemplateModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {templatesError ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{templatesError}</p>
              </div>
            ) : templatesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No templates found</p>
                <Button onClick={() => { setSelectedTemplate(null); setTemplateModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <div key={template._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.slug}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.subject}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTemplate(template); setTemplateModalOpen(true); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTemplate(template._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <SendNotificationModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        onSent={() => { fetchLogs(1); fetchStats(); }}
      />
      <TemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        template={selectedTemplate}
        onSaved={fetchTemplates}
      />
      <LogDetailModal
        open={logDetailModalOpen}
        onOpenChange={setLogDetailModalOpen}
        logId={selectedLogId}
      />
    </div>
  );
};

export default NotificationManagement;
