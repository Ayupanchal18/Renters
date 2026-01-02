import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Star,
  MessageSquare,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Check,
  XCircle,
  Trash2,
  Ban,
  Eye,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';

/**
 * Review Moderation Page
 * 
 * Admin page for moderating reviews with:
 * - Review list with filters
 * - Approve/Reject/Delete actions
 * - Block user for violations
 */

const API_BASE = '/api/admin/reviews';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle
};

// Star Rating Component
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

// Review Detail Modal
const ReviewDetailModal = ({ open, onOpenChange, review }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Property</p>
            <p className="font-medium">{review.propertyId?.title || 'Unknown Property'}</p>
            {review.propertyId?.address && (
              <p className="text-sm text-muted-foreground">{review.propertyId.address}</p>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {review.userId?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium">{review.userId?.name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground">{review.userId?.email}</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Rating</p>
            <StarRating rating={review.rating} />
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Comment</p>
            <p className="text-sm bg-muted p-3 rounded-lg">{review.comment || 'No comment provided'}</p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn('capitalize', STATUS_COLORS[review.status])}>{review.status}</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-sm">{formatDate(review.createdAt)}</p>
            </div>
          </div>

          {/* Rejection Reason */}
          {review.status === 'rejected' && review.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Rejection Reason</p>
              <p className="text-sm text-red-700 dark:text-red-400">{review.rejectionReason}</p>
            </div>
          )}

          {/* Moderation Info */}
          {review.moderatedBy && (
            <div className="text-sm text-muted-foreground">
              Moderated by {review.moderatedBy.name} on {formatDate(review.moderatedAt)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Reject Modal
const RejectModal = ({ open, onOpenChange, review, onReject }) => {
  const [reason, setReason] = useState('');
  const [notifyAuthor, setNotifyAuthor] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onReject(review._id, reason, notifyAuthor);
    setLoading(false);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Reject Review
          </DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this review
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifyAuthor"
              checked={notifyAuthor}
              onChange={(e) => setNotifyAuthor(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="notifyAuthor" className="text-sm">Notify the author about this rejection</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || !reason.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Block User Modal
const BlockUserModal = ({ open, onOpenChange, review, onBlock }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onBlock(review._id, reason);
    setLoading(false);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Block User
          </DialogTitle>
          <DialogDescription>
            Block {review?.userId?.name || 'this user'} from submitting reviews
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">
              This action will block the user from logging in and submitting any further reviews.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Block Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for blocking this user..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || !reason.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
              Block User
            </Button>
          </DialogFooter>
        </form>
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
        Showing {startItem} to {endItem} of {total} reviews
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

// Mobile Card Component for Reviews
const ReviewCard = ({ review, onView, onApprove, onReject, onDelete, onBlockUser }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatusIcon = STATUS_ICONS[review.status] || Clock;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {review.userId?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{review.userId?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground truncate">{review.userId?.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(review)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {review.status !== 'approved' && (
              <DropdownMenuItem onClick={() => onApprove(review._id)}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
            )}
            {review.status !== 'rejected' && (
              <DropdownMenuItem onClick={() => onReject(review)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBlockUser(review)} className="text-destructive focus:text-destructive">
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(review._id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-muted/50 rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Property</p>
        <p className="text-sm font-medium truncate">{review.propertyId?.title || 'Unknown Property'}</p>
      </div>

      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        <Badge className={cn('capitalize', STATUS_COLORS[review.status])}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {review.status}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">
        {review.comment || 'No comment'}
      </p>

      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
    </div>
  );
};

// Review Row Component
const ReviewRow = ({ review, onView, onApprove, onReject, onDelete, onBlockUser }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatusIcon = STATUS_ICONS[review.status] || Clock;

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {review.userId?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{review.userId?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground truncate">{review.userId?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium truncate max-w-[200px]">{review.propertyId?.title || 'Unknown Property'}</p>
      </td>
      <td className="px-4 py-3">
        <StarRating rating={review.rating} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
          {review.comment || 'No comment'}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', STATUS_COLORS[review.status])}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {review.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(review)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {review.status !== 'approved' && (
              <DropdownMenuItem onClick={() => onApprove(review._id)}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
            )}
            {review.status !== 'rejected' && (
              <DropdownMenuItem onClick={() => onReject(review)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBlockUser(review)} className="text-destructive focus:text-destructive">
              <Ban className="h-4 w-4 mr-2" />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(review._id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

// Main Component
const ReviewModeration = () => {
  const navigate = useNavigate();
  
  // Data state
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch reviews
  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });
      
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter !== 'all') {
        params.append('minRating', ratingFilter);
        params.append('maxRating', ratingFilter);
      }
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data.reviews);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } else {
        throw new Error(data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, pagination.limit, debouncedSearch, statusFilter, ratingFilter, sortBy, sortOrder]);

  // Initial load and filter changes
  useEffect(() => {
    fetchReviews(1);
  }, [debouncedSearch, statusFilter, ratingFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReviews(pagination.page);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRatingFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || ratingFilter !== 'all';

  // Action handlers
  const handleApprove = async (reviewId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${reviewId}/approve`, {
        method: 'PATCH',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchReviews(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to approve review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (reviewId, reason, notifyAuthor) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${reviewId}/reject`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason, notifyAuthor })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchReviews(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to reject review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${reviewId}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchReviews(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBlockUser = async (reviewId, reason) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${reviewId}/block-user`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchReviews(pagination.page);
        alert(`User has been blocked successfully`);
      } else {
        throw new Error(data.message || 'Failed to block user');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    const pendingReviews = reviews.filter(r => r.status === 'pending');
    if (pendingReviews.length === 0) {
      alert('No pending reviews to approve');
      return;
    }
    
    if (!window.confirm(`Approve all ${pendingReviews.length} pending reviews?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/bulk/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reviewIds: pendingReviews.map(r => r._id) })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchReviews(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to bulk approve');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Error state
  if (error && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load reviews</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Review Moderation
          </h1>
          <p className="text-muted-foreground">
            Moderate user reviews and ratings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          {summary.pending > 0 && (
            <Button onClick={handleBulkApprove}>
              <Check className="h-4 w-4 mr-2" />
              Approve All Pending ({summary.pending})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && reviews.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Reviews - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews found</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onView={(r) => { setSelectedReview(r); setDetailModalOpen(true); }}
              onApprove={handleApprove}
              onReject={(r) => { setSelectedReview(r); setRejectModalOpen(true); }}
              onDelete={handleDelete}
              onBlockUser={(r) => { setSelectedReview(r); setBlockModalOpen(true); }}
            />
          ))
        )}
        
        {!loading && reviews.length > 0 && (
          <Pagination pagination={pagination} onPageChange={(page) => fetchReviews(page)} />
        )}
      </div>

      {/* Reviews Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Property</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Comment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                    </tr>
                  ))
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews found</p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <ReviewRow
                      key={review._id}
                      review={review}
                      onView={(r) => { setSelectedReview(r); setDetailModalOpen(true); }}
                      onApprove={handleApprove}
                      onReject={(r) => { setSelectedReview(r); setRejectModalOpen(true); }}
                      onDelete={handleDelete}
                      onBlockUser={(r) => { setSelectedReview(r); setBlockModalOpen(true); }}
                    />
                  ))
                )}
              </tbody>
            </table>
            
            {!loading && reviews.length > 0 && (
              <Pagination pagination={pagination} onPageChange={(page) => fetchReviews(page)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ReviewDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        review={selectedReview}
      />
      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        review={selectedReview}
        onReject={handleReject}
      />
      <BlockUserModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        review={selectedReview}
        onBlock={handleBlockUser}
      />
    </div>
  );
};

export default ReviewModeration;
