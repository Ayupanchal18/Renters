import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { getToken } from '../../utils/auth';
import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  FolderTree,
  FileText,
  Bell,
  Star,
  Settings,
  FileBarChart,
  ClipboardList,
  X,
  Home,
  Quote,
  Megaphone,
  Activity,
  MessageSquare,
  Shield,
  Images,
  TrendingUp,
  ShieldAlert,
  Scale,
  Mail,
  FileCode,
  Send
} from 'lucide-react';


/**
 * Admin Sidebar Navigation Component
 * 
 * Provides navigation links to all admin sections with:
 * - Collapsible sidebar for mobile
 * - Active state highlighting
 * - Grouped navigation items
 */

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    ]
  },
  {
    title: 'Administration',
    items: [
      { name: 'Legal & DPDP Inbox', href: '/admin/legal-requests', icon: Scale },
      { name: 'Newsletter Leads', href: '/admin/subscribers', icon: Mail },
      { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
      { name: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
    ]
  },
  {
    title: 'Directory & Listings',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Vault Review', href: '/admin/vault', icon: ShieldAlert },
      { name: 'Properties', href: '/admin/properties', icon: Building2 },
      { name: 'Locations', href: '/admin/locations', icon: MapPin },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    ]
  },
  {
    title: 'Content & Moderation',
    items: [
      { name: 'CMS', href: '/admin/content', icon: FileText },
      { name: 'Media Library', href: '/admin/media', icon: Images },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
      { name: 'Testimonials', href: '/admin/testimonials', icon: Quote },
      { name: 'Conversations', href: '/admin/conversations', icon: MessageSquare },
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Email Templates', href: '/admin/email-templates', icon: FileCode },
      { name: 'HTML Broadcaster', href: '/admin/email-broadcaster', icon: Send },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
      { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
    ]
  },
  {
    title: 'System Settings',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'OTP Monitoring', href: '/admin/monitoring', icon: Activity },
    ]
  }
];

const AdminSidebar = ({ onClose }) => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const navRef = useRef(null);

  // Restore scroll position on route change
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem("admin_sidebar_scroll");
    if (navRef.current && savedScroll !== null) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, [location.pathname]);

  const handleNavScroll = (e) => {
    if (e.target) {
      sessionStorage.setItem("admin_sidebar_scroll", e.target.scrollTop.toString());
    }
  };

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("/api/admin/vault/pending", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPendingCount(json.data.length);
        }
      } catch (err) {
        console.error("Failed to fetch pending vault count:", err);
      }
    };

    fetchPendingCount();
    // Poll every 30 seconds to keep badge current
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <img 
            src="/Logo2.png" 
            alt="Renters Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </Link>
        
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      {/* Navigation */}
      <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto py-4 px-3">
        {/* Back to main site link */}
        <div className="mb-4">
          <Link to="/">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Back to Site
            </Button>
          </Link>
        </div>

        {/* Navigation groups */}
        {navigationItems.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.name}</span>
                      {item.name === 'Vault Review' && pendingCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <img 
            src="/Logo2.png" 
            alt="Renters Logo" 
            className="h-8 w-8 object-contain"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Renters</p>
            <p className="text-xs text-muted-foreground">Admin v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
