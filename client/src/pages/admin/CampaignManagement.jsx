import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Megaphone, Send, Users, Mail, Bell, Smartphone, Plus, Search, RefreshCw,
  AlertCircle, Filter, X, ChevronLeft, ChevronRight, Eye, Clock, CheckCircle,
  XCircle, Loader2, Zap, Target, BarChart3, Calendar,
} from 'lucide-react';

const API_BASE = '/api/admin/notifications';

/* ─── Constants ────────────────────────────────────────────── */

const CHANNELS = [
  { value: 'in-app', label: 'In-App', icon: Bell, color: 'text-blue-500' },
  { value: 'push', label: 'Push', icon: Smartphone, color: 'text-purple-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-amber-500' },
];

const AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'role', label: 'By Role' },
  { value: 'city', label: 'By City' },
  { value: 'active', label: 'Active (30d)' },
  { value: 'inactive', label: 'Inactive (30d+)' },
  { value: 'new', label: 'New Users (7d)' },
  { value: 'property_owners', label: 'Property Owners' },
];

const ROLES = ['user', 'owner', 'agent', 'seller', 'admin'];

const STATUS_STYLES = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  sending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

/* ─── Stats Cards ──────────────────────────────────────────── */

const StatsCards = ({ stats, loading }) => {
  const cards = [
    { label: 'Total Sent', value: stats?.totalSent ?? 0, icon: Send, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Delivered', value: stats?.delivered ?? 0, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Failed', value: stats?.failed ?? 0, icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { label: 'This Month', value: stats?.thisMonth ?? 0, icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.color)}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-6 w-12 mb-1" /> : (
                <p className="text-xl font-bold text-foreground">{c.value.toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ─── Create Campaign Modal ────────────────────────────────── */

const CreateCampaignModal = ({ open, onOpenChange, onSent }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    channels: ['in-app'],
    audience: 'all',
    roles: [],
    city: '',
    subject: '',
    message: '',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleChannel = (ch) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role],
    }));
  };

  const reset = () => {
    setForm({ channels: ['in-app'], audience: 'all', roles: [], city: '', subject: '', message: '' });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.channels.length === 0) { setError('Select at least one channel'); return; }
    if (!form.subject.trim() || !form.message.trim()) { setError('Subject and message are required'); return; }

    setLoading(true);
    setError(null);

    try {
      const body = {
        subject: form.subject,
        message: form.message,
        channel: form.channels.join(','),
        campaignType: 'campaign',
        audience: form.audience,
      };
      if (form.audience === 'role' && form.roles.length > 0) body.targetRoles = form.roles;
      if (form.audience === 'city' && form.city) body.targetCity = form.city;

      const res = await authenticatedFetch(`${API_BASE}/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      }, navigate);
      const data = await res.json();

      if (data.success) {
        onSent();
        onOpenChange(false);
        reset();
      } else {
        throw new Error(data.message || 'Failed to send campaign');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> New Campaign
          </DialogTitle>
          <DialogDescription>Send a campaign via multiple channels at once</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Channels */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Channels</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(ch => {
                const active = form.channels.includes(ch.value);
                return (
                  <button key={ch.value} type="button" onClick={() => toggleChannel(ch.value)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all',
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    )}>
                    <ch.icon className="h-4 w-4" /> {ch.label}
                    {active && <CheckCircle className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audience</label>
            <Select value={form.audience} onValueChange={(v) => update('audience', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Role filter */}
          {form.audience === 'role' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Roles</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <Button key={role} type="button" size="sm" variant={form.roles.includes(role) ? 'default' : 'outline'}
                    onClick={() => toggleRole(role)} className="capitalize">{role}</Button>
                ))}
              </div>
            </div>
          )}

          {/* City filter */}
          {form.audience === 'city' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input placeholder="e.g. Mumbai" value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject / Title</label>
            <Input value={form.subject} onChange={(e) => update('subject', e.target.value)}
              placeholder="Campaign subject" required />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea value={form.message} onChange={(e) => update('message', e.target.value)}
              placeholder="Write your campaign message..."
              className="w-full min-h-[120px] px-3 py-2 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              required />
            <p className="text-xs text-muted-foreground">{form.message.length} characters</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {loading ? 'Sending...' : 'Send Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Campaign History Table ───────────────────────────────── */

const CampaignTable = ({ logs, loading, onView, pagination, onPageChange, filters, setFilters }) => {
  const channelIcon = (ch) => {
    const found = CHANNELS.find(c => c.value === ch);
    const Icon = found?.icon || Bell;
    return <Icon className={cn('h-4 w-4', found?.color || 'text-muted-foreground')} />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" /> Campaign History
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filters.channel} onValueChange={(v) => setFilters(p => ({ ...p, channel: v }))}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">Create your first campaign above</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Channel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Audience</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sent</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate">{log.subject}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">{channelIcon(log.channel)}<span className="capitalize">{log.channel}</span></div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize text-xs">{log.type || 'broadcast'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs capitalize', STATUS_STYLES[log.status] || STATUS_STYLES.draft)}>{log.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.sentCount ?? 0}/{log.totalRecipients ?? 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => onView(log._id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {logs.map((log) => (
                <div key={log._id} className="p-4 space-y-2" onClick={() => onView(log._id)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate flex-1">{log.subject}</p>
                    <Badge className={cn('text-[10px] capitalize shrink-0', STATUS_STYLES[log.status])}>{log.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">{channelIcon(log.channel)} {log.channel}</span>
                    <span>{log.sentCount ?? 0} sent</span>
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */

export default function CampaignManagement() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ channel: 'all', status: 'all' });

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLog, setDetailLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/stats`, { headers: getHeaders() }, navigate);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [navigate]);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
      if (filters.channel !== 'all') params.append('channel', filters.channel);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('type', 'broadcast'); // campaigns are broadcast type

      const res = await authenticatedFetch(`${API_BASE}/logs?${params}`, { headers: getHeaders() }, navigate);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error('Logs fetch error:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [navigate, pagination.limit, filters]);

  const viewDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/logs/${id}`, { headers: getHeaders() }, navigate);
      const data = await res.json();
      if (data.success) setDetailLog(data.data);
    } catch (err) {
      console.error('Detail fetch error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchLogs(1)]);
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send targeted notifications via in-app, push, and email
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Campaign History */}
      <CampaignTable
        logs={logs}
        loading={logsLoading}
        onView={viewDetail}
        pagination={pagination}
        onPageChange={(p) => fetchLogs(p)}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal open={createOpen} onOpenChange={setCreateOpen} onSent={refreshAll} />

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Campaign Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-20 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : detailLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Channel</p>
                  <Badge variant="outline" className="capitalize">{detailLog.channel}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={cn('capitalize', STATUS_STYLES[detailLog.status])}>{detailLog.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <Badge variant="outline" className="capitalize">{detailLog.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sent By</p>
                  <p className="text-sm font-medium">{detailLog.sentBy?.name || 'System'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{detailLog.subject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{detailLog.message}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-lg font-bold">{detailLog.totalRecipients ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <p className="text-lg font-bold text-emerald-600">{detailLog.sentCount ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Delivered</p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{detailLog.failedCount ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Failed</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Created: {formatDate(detailLog.createdAt)}</p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Campaign not found</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
