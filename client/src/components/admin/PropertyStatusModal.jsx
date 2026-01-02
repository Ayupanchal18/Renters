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
import { Loader2, AlertCircle, Settings2, ArrowRight, Star, StarOff, Home, ShoppingCart } from 'lucide-react';
import { LISTING_TYPE_LABELS } from '@shared/propertyTypes';

/**
 * Property Status Modal Component
 * 
 * Modal for changing property status and featured flags
 */

const API_BASE = '/api/admin/properties';

const STATUSES = [
  { value: 'active', label: 'Active', description: 'Property is live and visible to users' },
  { value: 'inactive', label: 'Inactive', description: 'Property is hidden from listings' },
  { value: 'blocked', label: 'Blocked', description: 'Property is blocked due to policy violation' },
  { value: 'rented', label: 'Rented', description: 'Property has been rented out' },
  { value: 'sold', label: 'Sold', description: 'Property has been sold' },
  { value: 'expired', label: 'Expired', description: 'Listing has expired' }
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  sold: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  expired: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
};

const LISTING_TYPE_COLORS = {
  rent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  buy: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
};

const PropertyStatusModal = ({ open, onOpenChange, property, onStatusChanged }) => {
  const navigate = useNavigate();
  
  // Form state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [reason, setReason] = useState('');
  const [featured, setFeatured] = useState(false);
  const [premium, setPremium] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens/closes or property changes
  useEffect(() => {
    if (open && property) {
      setSelectedStatus(property.status || 'active');
      setFeatured(property.featured || false);
      setPremium(property.premium || false);
      setReason('');
      setError(null);
    }
  }, [open, property]);

  // Check if anything has changed
  const statusChanged = property && selectedStatus !== property.status;
  const featuredChanged = property && (featured !== property.featured || premium !== property.premium);
  const hasChanges = statusChanged || featuredChanged;

  // Handle status change submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Update status if changed
      if (statusChanged) {
        const statusResponse = await authenticatedFetch(`${API_BASE}/${property._id}/status`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status: selectedStatus, reason })
        }, navigate);
        
        const statusData = await statusResponse.json();
        
        if (!statusData.success) {
          throw new Error(statusData.message || 'Failed to change property status');
        }
      }
      
      // Update featured/premium if changed
      if (featuredChanged) {
        const featuredResponse = await authenticatedFetch(`${API_BASE}/${property._id}/featured`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ featured, premium })
        }, navigate);
        
        const featuredData = await featuredResponse.json();
        
        if (!featuredData.success) {
          throw new Error(featuredData.message || 'Failed to update featured status');
        }
      }
      
      onStatusChanged();
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusInfo = STATUSES.find(s => s.value === property?.status);
  const newStatusInfo = STATUSES.find(s => s.value === selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Change Property Status
          </DialogTitle>
          <DialogDescription>
            Update the status and visibility settings for this property.
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
          
          {/* Property Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-16 w-20 rounded-md bg-muted overflow-hidden shrink-0">
                <img 
                  src={property?.photos?.[0] || '/placeholder.svg'} 
                  alt={property?.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{property?.title || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground truncate">{property?.city}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn('capitalize text-xs', LISTING_TYPE_COLORS[property?.listingType] || LISTING_TYPE_COLORS.rent)}>
                    <span className="flex items-center gap-1">
                      {property?.listingType === 'buy' ? <ShoppingCart className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                      {LISTING_TYPE_LABELS[property?.listingType] || 'For Rent'}
                    </span>
                  </Badge>
                  <Badge className={cn('capitalize text-xs', STATUS_COLORS[property?.status])}>
                    {property?.status || 'active'}
                  </Badge>
                  {property?.featured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('capitalize text-xs', STATUS_COLORS[status.value])}>
                        {status.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {status.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Change Preview */}
          {statusChanged && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Status Change Preview</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <Badge className={cn('capitalize', STATUS_COLORS[property?.status])}>
                    {currentStatusInfo?.label || property?.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Current</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <Badge className={cn('capitalize', STATUS_COLORS[selectedStatus])}>
                    {newStatusInfo?.label || selectedStatus}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">New</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Reason for status change */}
          {statusChanged && (selectedStatus === 'blocked' || selectedStatus === 'inactive') && (
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for change (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for status change..."
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
          )}
          
          {/* Featured/Premium Settings */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Visibility Settings</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {featured ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Featured Property</p>
                  <p className="text-xs text-muted-foreground">Show in featured listings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeatured(!featured)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  featured ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    featured ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Premium Listing</p>
                <p className="text-xs text-muted-foreground">Highlight with premium badge</p>
              </div>
              <button
                type="button"
                onClick={() => setPremium(!premium)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  premium ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    premium ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
          
          {/* Warning for blocked status */}
          {selectedStatus === 'blocked' && property?.status !== 'blocked' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Blocking this property will hide it from all listings and notify the owner.
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
            <Button type="submit" disabled={loading || !hasChanges}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyStatusModal;
