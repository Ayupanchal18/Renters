import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
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
  Quote
} from 'lucide-react';

/**
 * Admin Sidebar Navigation Component
 * 
 * Provides navigation links to all admin sections with:
 * - Collapsible sidebar for mobile
 * - Active state highlighting
 * - Grouped navigation items
 * 
 * Requirements: 12.1 - Responsive layout with collapsible sidebar for mobile
 */

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Properties', href: '/admin/properties', icon: Building2 },
      { name: 'Locations', href: '/admin/locations', icon: MapPin },
      { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    ]
  },
  {
    title: 'Content',
    items: [
      { name: 'CMS', href: '/admin/content', icon: FileText },
      { name: 'Reviews', href: '/admin/reviews', icon: Star },
      { name: 'Testimonials', href: '/admin/testimonials', icon: Quote },
    ]
  },
  {
    title: 'Communication',
    items: [
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
    ]
  }
];

const AdminSidebar = ({ onClose }) => {
  const location = useLocation();

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
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
      <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                      {item.name}
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
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
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
