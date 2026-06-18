import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import {
  X, User, Building2, Activity, Monitor,
  Shield, CheckCircle, XCircle, Clock,
  MapPin, Mail, Phone, ExternalLink
} from 'lucide-react';

const TABS = ['Overview', 'Properties', 'Activity', 'Sessions'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_MAP = {
  active: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  inactive: { label: 'Inactive', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  blocked: { label: 'Blocked', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const ROLE_MAP = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  seller: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function TabPanel({ active, children }) {
  return active ? <div className="flex-1 overflow-y-auto p-4">{children}</div> : null;
}

export default function UserProfileDrawer({ userId, open, onClose }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [detailRes, sessionsRes, timelineRes] = await Promise.all([
        authenticatedFetch(`/api/admin/users/${userId}/detail`, { headers: getHeaders() }, navigate),
        authenticatedFetch(`/api/admin/users/${userId}/sessions`, { headers: getHeaders() }, navigate),
        authenticatedFetch(`/api/admin/users/${userId}/timeline`, { headers: getHeaders() }, navigate),
      ]);

      const [detailData, sessionsData, timelineData] = await Promise.all([
        detailRes.json(), sessionsRes.json(), timelineRes.json()
      ]);

      if (detailData.success) {
        setProfile(detailData.data);
        setProperties(detailData.data.properties || []);
      }
      if (sessionsData.success) setSessions(sessionsData.data?.sessions || []);
      if (timelineData.success) setTimeline(timelineData.data?.timeline || []);
    } catch (e) {
      console.error('UserProfileDrawer fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (open && userId) { fetchProfile(); setTab('Overview'); }
  }, [open, userId, fetchProfile]);

  const revokeSession = async (jti) => {
    try {
      await authenticatedFetch(
        `/api/admin/users/${userId}/sessions/${jti}`,
        { method: 'DELETE', headers: getHeaders() },
        navigate
      );
      setSessions(s => s.filter(x => x.jti !== jti));
    } catch (e) { console.error(e); }
  };

  const revokeAll = async () => {
    try {
      await authenticatedFetch(
        `/api/admin/users/${userId}/sessions`,
        { method: 'DELETE', headers: getHeaders() },
        navigate
      );
      setSessions([]);
    } catch (e) { console.error(e); }
  };

  if (!open) return null;

  const user = profile?.user;
  const stats = profile?.stats || {};
  const status = user?.isBlocked ? 'blocked' : user?.isActive === false ? 'inactive' : 'active';
  const sm = STATUS_MAP[status] || STATUS_MAP.active;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed right-0 top-0 h-full z-50 w-[480px] bg-background border-l border-border',
        'flex flex-col shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{user?.name || 'Loading...'}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {user?.role && (
                <Badge className={cn('capitalize text-xs', ROLE_MAP[user.role] || ROLE_MAP.user)}>
                  {user.role}
                </Badge>
              )}
              <Badge className={cn('capitalize text-xs', sm.cls)}>{sm.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors',
                tab === t
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={`h-${i === 0 ? 16 : 10} w-full rounded-xl`} />
            ))}
          </div>
        ) : (
          <>
            {/* Overview */}
            <TabPanel active={tab === 'Overview'}>
              <div className="space-y-4">
                {/* Contact */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {user?.email || '—'}
                    {user?.isEmailVerified && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {user?.phone || 'Not provided'}
                    {user?.isPhoneVerified && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                </div>

                {/* Dates */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Joined</p>
                      <p className="font-medium">{formatDate(user?.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Last login</p>
                      <p className="font-medium">{formatRelative(user?.lastLogin || user?.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Properties', value: stats.totalProperties ?? '—' },
                    { label: 'Reviews', value: stats.totalReviews ?? '—' },
                    { label: 'Messages', value: stats.totalMessages ?? '—' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>

            {/* Properties */}
            <TabPanel active={tab === 'Properties'}>
              {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No properties listed</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {properties.map(p => (
                    <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title || 'Untitled'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{p.city || '—'}
                          <span className="capitalize">{p.status}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/admin/properties?highlight=${p._id}`)}>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>

            {/* Activity */}
            <TabPanel active={tab === 'Activity'}>
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No activity recorded</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.description || item.action}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>

            {/* Sessions */}
            <TabPanel active={tab === 'Sessions'}>
              <div className="space-y-3">
                {sessions.length > 0 && (
                  <Button variant="outline" size="sm" onClick={revokeAll} className="text-destructive border-destructive hover:bg-destructive/10 w-full">
                    Revoke All Sessions
                  </Button>
                )}
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Monitor className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No active sessions</p>
                  </div>
                ) : (
                  sessions.map(s => (
                    <div key={s.jti || s._id} className="p-3 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 text-xs space-y-0.5">
                        <p className="font-medium">{s.browser || 'Unknown browser'} on {s.os || 'Unknown OS'}</p>
                        <p className="text-muted-foreground">{s.ipAddress} · {s.city || '—'}</p>
                        <p className="text-muted-foreground">Login: {formatDate(s.loginAt)}</p>
                      </div>
                      <button
                        onClick={() => revokeSession(s.jti)}
                        className="text-xs text-destructive hover:text-destructive/70 transition-colors px-2 py-1 rounded border border-destructive/30 hover:border-destructive/60"
                      >
                        Revoke
                      </button>
                    </div>
                  ))
                )}
              </div>
            </TabPanel>
          </>
        )}
      </div>
    </>
  );
}
