import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Clock, LayoutDashboard, Users, Building2,
  ClipboardList, Settings, Moon, Sun, Zap, MessageSquare, Shield,
  FileBarChart, SlidersHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { authenticatedFetch, getHeaders } from '../../lib/api';

/**
 * Command Palette — opens on Ctrl+K / Cmd+K.
 *
 * Icon references (React components) cannot survive JSON serialization.
 * We store `iconKey` strings in localStorage and resolve them via ICON_MAP.
 * Stale entries (missing `iconKey`) are auto-cleaned on load.
 */

const ICON_MAP = {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Settings,
  Moon,
  Sun,
  Zap,
  MessageSquare,
  Shield,
  FileBarChart,
  SlidersHorizontal,
  ArrowRight,
  Clock,
};

const QUICK_ACTIONS = [
  { id: 'goto-dashboard',     label: 'Go to Dashboard',          iconKey: 'LayoutDashboard',    path: '/admin',               group: 'Navigation' },
  { id: 'goto-users',         label: 'User Management',          iconKey: 'Users',              path: '/admin/users',          group: 'Navigation' },
  { id: 'goto-properties',    label: 'Property Management',      iconKey: 'Building2',          path: '/admin/properties',     group: 'Navigation' },
  { id: 'goto-audit',         label: 'View Audit Logs',          iconKey: 'ClipboardList',      path: '/admin/audit-logs',     group: 'Navigation' },
  { id: 'goto-settings',      label: 'System Settings',          iconKey: 'Settings',           path: '/admin/settings',       group: 'Navigation' },
  { id: 'goto-conversations', label: 'Conversation Moderation',  iconKey: 'MessageSquare',      path: '/admin/conversations',  group: 'Navigation' },
  { id: 'goto-roles',         label: 'Roles & Permissions',      iconKey: 'Shield',             path: '/admin/roles',          group: 'Navigation' },
  { id: 'goto-reports',       label: 'Reports',                  iconKey: 'FileBarChart',       path: '/admin/reports',        group: 'Navigation' },
  { id: 'toggle-theme',       label: 'Toggle Dark / Light Mode', iconKey: 'SlidersHorizontal',  action: 'toggle-theme',        group: 'Actions'    },
];

const RECENT_KEY = 'adminCommandPalette_recent_v2'; // v2 = iconKey format
const MAX_RECENT = 6;

function serializeItem(item) {
  return {
    id:      item.id,
    label:   item.label,
    sub:     item.sub,
    iconKey: item.iconKey || 'ArrowRight',
    path:    item.path,
    action:  item.action,
    group:   item.group,
  };
}

function saveRecent(item) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const filtered = prev.filter(r => r.id !== item.id);
    const next = [serializeItem(item), ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch (_) {}
}

function loadRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    // Only keep entries that have a valid iconKey (v2 format)
    return raw.filter(r => r && r.id && r.iconKey && ICON_MAP[r.iconKey]);
  } catch (_) {
    return [];
  }
}

function resolveIcon(item) {
  const key = item.iconKey || 'ArrowRight';
  return ICON_MAP[key] || ArrowRight;
}

// Group colors for icon backgrounds
const GROUP_ICON_BG = {
  Navigation: 'bg-blue-500/15 text-blue-400',
  Actions:    'bg-violet-500/15 text-violet-400',
  Users:      'bg-emerald-500/15 text-emerald-400',
  Properties: 'bg-amber-500/15 text-amber-400',
  Audit:      'bg-rose-500/15 text-rose-400',
  Recent:     'bg-primary/10 text-primary',
  Other:      'bg-muted text-muted-foreground',
};

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        `/api/admin/search?q=${encodeURIComponent(q)}&limit=5&entities=users,properties,audit`,
        { headers: getHeaders() },
        navigate
      );
      const data = await res.json();
      if (data.success) {
        const items = [];
        (data.data.users     || []).forEach(u => items.push({ id: `user-${u.id}`,  label: u.name,   sub: u.email,          iconKey: 'Users',       path: '/admin/users',       group: 'Users'      }));
        (data.data.properties|| []).forEach(p => items.push({ id: `prop-${p.id}`,  label: p.title,  sub: p.city,           iconKey: 'Building2',   path: '/admin/properties',  group: 'Properties' }));
        (data.data.auditLogs || []).forEach(a => items.push({ id: `audit-${a.id}`, label: a.action, sub: a.resourceType,   iconKey: 'ClipboardList',path: '/admin/audit-logs',  group: 'Audit'      }));
        setResults(items);
      }
    } catch (_) {}
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 150);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const filteredActions = QUICK_ACTIONS.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase())
  );

  const displayItems = query
    ? [...results, ...filteredActions]
    : [...recent.map(r => ({ ...r, group: 'Recent' })), ...filteredActions];

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, displayItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = displayItems[activeIndex];
        if (item) executeItem(item);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, displayItems, activeIndex, onClose]);

  useEffect(() => { setActiveIndex(0); }, [displayItems.length]);

  function executeItem(item) {
    saveRecent(item);
    setRecent(loadRecent());
    if (item.action === 'toggle-theme') {
      toggleTheme();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  }

  if (!open) return null;

  const grouped = displayItems.reduce((acc, item, idx) => {
    const g = item.group || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push({ ...item, _globalIdx: idx });
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[8vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Panel */}
      <div className="relative w-full max-w-[580px] bg-background/95 backdrop-blur border border-border/80 rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search users, properties, actions..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            {loading && (
              <div className="h-3.5 w-3.5 border-2 border-primary/60 border-t-transparent rounded-full animate-spin" />
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md font-mono">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results list */}
        <div ref={listRef} className="overflow-y-auto max-h-[380px] overscroll-contain py-1.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {displayItems.length === 0 && query ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm font-medium text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Try a different search term</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                {/* Group label */}
                <div className="flex items-center gap-2 px-4 py-1 mt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                {/* Group items */}
                {items.map(item => {
                  const Icon = resolveIcon(item);
                  const isActive = item._globalIdx === activeIndex;
                  const iconBg = GROUP_ICON_BG[item.group] || GROUP_ICON_BG.Other;

                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setActiveIndex(item._globalIdx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 mx-1 py-2 rounded-xl text-left transition-all duration-100',
                        'w-[calc(100%-8px)]',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground hover:bg-muted/70'
                      )}
                    >
                      {/* Icon box */}
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        isActive
                          ? 'bg-white/20 text-white'
                          : iconBg
                      )}>
                        {item.action === 'toggle-theme'
                          ? (theme === 'dark'
                            ? <Sun className="h-3.5 w-3.5" />
                            : <Moon className="h-3.5 w-3.5" />)
                          : <Icon className="h-3.5 w-3.5" />
                        }
                      </div>

                      {/* Label + subtitle */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-sm font-medium truncate leading-tight',
                          isActive ? 'text-primary-foreground' : 'text-foreground'
                        )}>
                          {item.label}
                        </div>
                        {item.sub && (
                          <div className={cn(
                            'text-[11px] truncate leading-tight',
                            isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}>
                            {item.sub}
                          </div>
                        )}
                      </div>

                      {/* Right badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.group === 'Recent' && (
                          <Clock className={cn('h-3.5 w-3.5', isActive ? 'text-primary-foreground/60' : 'text-muted-foreground/50')} />
                        )}
                        {isActive && (
                          <kbd className="text-[10px] bg-white/20 text-primary-foreground px-1.5 py-0.5 rounded font-mono">
                            ↵
                          </kbd>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/60 bg-muted/30">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="bg-background border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono">↑</kbd>
              <kbd className="bg-background border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-background border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-background border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd>
              close
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Zap className="h-3 w-3" />
            Admin Panel
          </div>
        </div>
      </div>
    </div>
  );
}
