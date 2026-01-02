import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Loader2, AlertCircle, Shield, ArrowRight } from 'lucide-react';

/**
 * Role Change Modal Component
 * 
 * Modal for changing user roles with confirmation
 */

const API_BASE = '/api/admin/users';

const ROLES = [
  { value: 'user', label: 'User', description: 'Standard user with basic access' },
  { value: 'owner', label: 'Owner', description: 'Property owner who can manage their listings' },
  { value: 'agent', label: 'Agent', description: 'Property agent with listing capabilities' },
  { value: 'seller', label: 'Seller', description: 'Seller with property management access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' }
];

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  seller: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
};

const RoleChangeModal = ({ open, onOpenChange, user, onRoleChanged }) => {
  const navigate = useNavigate();
  
  // Form state
  const [selectedRole, setSelectedRole] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      setSelectedRole(user.role || 'user');
      setError(null);
    }
  }, [open, user]);

  // Check if role has changed
  const hasChanged = user && selectedRole !== user.role;

  // Handle role change submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanged) {
      onOpenChange(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${user._id}/role`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role: selectedRole })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        onRoleChanged();
      } else {
        throw new Error(data.message || 'Failed to change user role');
      }
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentRoleInfo = ROLES.find(r => r.value === user?.role);
  const newRoleInfo = ROLES.find(r => r.value === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Update the role for {user?.name || 'this user'}. This will immediately change their permissions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* User Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('capitalize text-xs', ROLE_COLORS[role.value])}>
                        {role.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Role Change Preview */}
          {hasChanged && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Role Change Preview</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <Badge className={cn('capitalize', ROLE_COLORS[user?.role])}>
                    {currentRoleInfo?.label || user?.role}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Current</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <Badge className={cn('capitalize', ROLE_COLORS[selectedRole])}>
                    {newRoleInfo?.label || selectedRole}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">New</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Warning for admin role */}
          {selectedRole === 'admin' && user?.role !== 'admin' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Granting admin role will give this user full access to all administrative functions.
              </p>
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !hasChanged}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {hasChanged ? 'Change Role' : 'No Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleChangeModal;
