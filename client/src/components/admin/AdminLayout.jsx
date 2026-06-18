import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu, User, LogOut, ChevronDown, Search, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import AdminSidebar from './AdminSidebar';
import CommandPalette from './CommandPalette';
import UndoSnackbar from './UndoSnackbar';
import NotificationBell from './NotificationBell';
import { AdminNotificationProvider } from '../../context/AdminNotificationContext';
import { logout, getUser } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog.jsx';

/**
 * Admin Layout Component
 *
 * Provides the main layout structure for the admin dashboard with:
 * - Responsive sidebar navigation (collapsible on mobile)
 * - Header with user info, theme toggle, and Ctrl+K command palette
 * - Undo Snackbar (global, rendered once here)
 * - Main content area
 */
const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const { theme, toggleTheme } = useTheme();

  // Register Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('#admin-profile-menu')) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
    setProfileMenuOpen(false);
  };

  const handleLogoutConfirm = () => {
    logout(navigate);
    setShowLogoutDialog(false);
  };

  return (
    <AdminNotificationProvider>
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Command palette trigger */}
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border',
              'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground',
              'text-sm transition-colors flex-1 max-w-xs'
            )}
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search or jump to...</span>
            <kbd className="bg-background border border-border text-xs px-1.5 py-0.5 rounded shrink-0">⌘K</kbd>
          </button>

          <div className="flex-1 sm:flex-none" />

          {/* Header actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </Button>

            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setCommandOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications bell */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative" id="admin-profile-menu">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                  {user?.name || 'Admin'}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    profileMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-popover rounded-xl shadow-lg border border-border py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@example.com'}</p>
                    {user?.role && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary capitalize">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2.5 text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Undo Snackbar */}
      <UndoSnackbar />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out from the admin panel? You'll need to log in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminNotificationProvider>
  );
};

export default AdminLayout;
