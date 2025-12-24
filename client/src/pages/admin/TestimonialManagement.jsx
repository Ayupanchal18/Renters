import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Star,
  Quote,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare
} from 'lucide-react';

const API_BASE = '/api/admin/testimonials';

// Star Rating Component
const StarRating = ({ rating, onChange, readonly = false }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              'h-5 w-5',
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
};

// Testimonial Form Modal
const TestimonialFormModal = ({ open, onOpenChange, testimonial, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = !!testimonial;
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    content: '',
    rating: 5,
    image: '',
    isActive: true,
    order: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (testimonial) {
        setFormData({
          name: testimonial.name || '',
          role: testimonial.role || '',
          location: testimonial.location || '',
          content: testimonial.content || '',
          rating: testimonial.rating || 5,
          image: testimonial.image || '',
          isActive: testimonial.isActive !== false,
          order: testimonial.order || 0
        });
      } else {
        setFormData({
          name: '',
          role: '',
          location: '',
          content: '',
          rating: 5,
          image: '',
          isActive: true,
          order: 0
        });
      }
      setError(null);
    }
  }, [open, testimonial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `${API_BASE}/${testimonial._id}` : API_BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await authenticatedFetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSaved();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to save testimonial');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            {isEdit ? 'Edit Testimonial' : 'Add Testimonial'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update testimonial details' : 'Add a new testimonial for the homepage'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Software Engineer"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location *</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Mumbai, Maharashtra"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Testimonial Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write the testimonial content..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <StarRating
              rating={formData.rating}
              onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL (optional)</label>
            <Input
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-muted-foreground">Leave empty to auto-generate avatar</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Testimonial'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const TestimonialManagement = () => {
  const navigate = useNavigate();
  
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(`${API_BASE}?limit=50`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setTestimonials(data.data.testimonials || []);
      } else {
        throw new Error(data.message || 'Failed to fetch testimonials');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTestimonials();
    setRefreshing(false);
  };

  const handleCreate = () => {
    setSelectedTestimonial(null);
    setFormOpen(true);
  };

  const handleEdit = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setFormOpen(true);
  };

  const handleToggleVisibility = async (testimonial) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${testimonial._id}/visibility`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !testimonial.isActive })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchTestimonials();
      } else {
        throw new Error(data.message || 'Failed to update visibility');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (testimonial) => {
    if (!window.confirm(`Are you sure you want to delete this testimonial from "${testimonial.name}"?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${testimonial._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchTestimonials();
      } else {
        throw new Error(data.message || 'Failed to delete testimonial');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaved = () => {
    setFormOpen(false);
    setSelectedTestimonial(null);
    fetchTestimonials();
  };

  if (error && testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load testimonials</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            Homepage Testimonials
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage testimonials displayed on the homepage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.filter(t => t.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                <EyeOff className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.filter(t => !t.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Hidden</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Banner */}
      {error && testimonials.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Testimonials List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No testimonials found. Click "Add Testimonial" to create one.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {testimonials.map(testimonial => (
                <div key={testimonial._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={testimonial.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=6366f1&color=fff&size=100`}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {testimonial.role} • {testimonial.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {testimonial.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StarRating rating={testimonial.rating} readonly />
                    <span className="text-sm text-muted-foreground">Order: {testimonial.order}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(testimonial)}
                    >
                      {testimonial.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(testimonial)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <TestimonialFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        testimonial={selectedTestimonial}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default TestimonialManagement;
