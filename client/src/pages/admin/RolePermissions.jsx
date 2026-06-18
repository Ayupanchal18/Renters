import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Shield, Plus, Check, X, Lock, Pencil, Trash2, RefreshCw } from 'lucide-react';

const MODULES = [
  { key: 'users', label: 'Users', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { key: 'properties', label: 'Properties', actions: ['view', 'create', 'edit', 'delete', 'export', 'approve'] },
  { key: 'content', label: 'Content', actions: ['view', 'create', 'edit', 'delete', 'publish'] },
  { key: 'reviews', label: 'Reviews', actions: ['view', 'approve', 'reject', 'delete'] },
  { key: 'settings', label: 'Settings', actions: ['view', 'edit', 'apiKeys'] },
  { key: 'reports', label: 'Reports', actions: ['view', 'export'] },
  { key: 'audit', label: 'Audit Logs', actions: ['view', 'export'] },
  { key: 'conversations', label: 'Conversations', actions: ['view', 'flag', 'escalate'] },
  { key: 'notifications', label: 'Notifications', actions: ['view', 'send', 'broadcast'] },
  { key: 'roles', label: 'Roles', actions: ['view', 'edit'] },
];

// Static system role permission display (read-only)
const SYSTEM_ROLES = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  seller: { label: 'Seller', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  user: { label: 'User', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const ADMIN_ALL_PERMS = MODULES.reduce((acc, m) => {
  acc[m.key] = m.actions.reduce((a, action) => { a[action] = true; return a; }, {});
  return acc;
}, {});

const EMPTY_PERMS = MODULES.reduce((acc, m) => {
  acc[m.key] = m.actions.reduce((a, action) => { a[action] = false; return a; }, {});
  return acc;
}, {});

function PermCell({ checked, locked, onChange }) {
  return (
    <td className="px-2 py-2 text-center">
      {locked ? (
        <div className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded',
          checked ? 'bg-red-100 text-red-500 dark:bg-red-900/20' : 'bg-muted text-muted-foreground/30'
        )}>
          {checked ? <Lock className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </div>
      ) : (
        <button
          onClick={onChange}
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded transition-all',
            checked
              ? 'bg-primary text-primary-foreground hover:bg-primary/80'
              : 'border border-border hover:border-primary hover:bg-primary/5'
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </button>
      )}
    </td>
  );
}

export default function RolePermissions() {
  const navigate = useNavigate();
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/admin/roles', { headers: getHeaders() }, navigate);
      const data = await res.json();
      if (data.success) setCustomRoles(data.data.roles || []);
    } catch (e) {
      console.error('Fetch roles error:', e);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const togglePerm = async (roleId, module, action, current) => {
    setCustomRoles(prev => prev.map(r => {
      if (r._id !== roleId) return r;
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [module]: { ...r.permissions?.[module], [action]: !current }
        }
      };
    }));

    setSaving(roleId);
    try {
      const role = customRoles.find(r => r._id === roleId);
      const updatedPerms = {
        ...role.permissions,
        [module]: { ...role.permissions?.[module], [action]: !current }
      };
      await authenticatedFetch(
        `/api/admin/roles/${roleId}`,
        { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ permissions: updatedPerms }) },
        navigate
      );
    } catch (e) {
      console.error('Toggle perm error:', e);
    } finally {
      setSaving(null);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    setCreating(false);
    try {
      const res = await authenticatedFetch(
        '/api/admin/roles',
        { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: newRoleName.trim(), permissions: EMPTY_PERMS }) },
        navigate
      );
      const data = await res.json();
      if (data.success) {
        setCustomRoles(prev => [...prev, data.data.role]);
        setNewRoleName('');
      }
    } catch (e) { console.error('Create role error:', e); }
  };

  const deleteRole = async (roleId) => {
    if (!confirm('Delete this custom role?')) return;
    try {
      await authenticatedFetch(`/api/admin/roles/${roleId}`, { method: 'DELETE', headers: getHeaders() }, navigate);
      setCustomRoles(prev => prev.filter(r => r._id !== roleId));
    } catch (e) { console.error('Delete role error:', e); }
  };

  const allRoles = [
    { id: 'admin', label: 'Admin', isSystem: true, permissions: ADMIN_ALL_PERMS },
    ...customRoles
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role & Permission Matrix
          </h1>
          <p className="text-sm text-muted-foreground">Manage fine-grained permissions for each role</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoles}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Role
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-primary flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
          <span>Granted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded border border-border" />
          <span>Denied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Lock className="h-2.5 w-2.5 text-red-500" />
          </div>
          <span>System (read-only)</span>
        </div>
      </div>

      {/* New role form */}
      {creating && (
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardContent className="pt-4 flex items-center gap-3">
            <input
              autoFocus
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createRole(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Role name (e.g. 'content-editor')"
              className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="sm" onClick={createRole} disabled={!newRoleName.trim()}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {/* Permission matrix */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                {/* Role headers row */}
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-40 sticky left-0 bg-muted/30">
                    Module / Action
                  </th>
                  {allRoles.map(role => (
                    <th key={role.id || role._id} className="px-3 py-3 text-center min-w-[90px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold capitalize',
                          role.isSystem
                            ? (SYSTEM_ROLES[role.id]?.color || 'bg-gray-100 text-gray-600')
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        )}>
                          {role.label || role.name}
                        </span>
                        {role.isSystem && (
                          <span className="text-[9px] text-muted-foreground">System</span>
                        )}
                        {!role.isSystem && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => deleteRole(role._id)}
                              className="text-destructive/50 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map(module => (
                  <React.Fragment key={module.key}>
                    {/* Module group header */}
                    <tr className="bg-muted/20 border-t border-border">
                      <td
                        colSpan={allRoles.length + 1}
                        className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {module.label}
                      </td>
                    </tr>
                    {/* Action rows */}
                    {module.actions.map(action => (
                      <tr key={`${module.key}-${action}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 text-xs text-muted-foreground capitalize pl-8 sticky left-0 bg-background">
                          {action}
                        </td>
                        {allRoles.map(role => {
                          const checked = !!role.permissions?.[module.key]?.[action];
                          const locked = role.isSystem;
                          return (
                            <PermCell
                              key={role.id || role._id}
                              checked={checked}
                              locked={locked}
                              onChange={() => !locked && togglePerm(role._id, module.key, action, checked)}
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm shadow-lg animate-in slide-in-from-bottom-2">
          Saving permissions...
        </div>
      )}
    </div>
  );
}
