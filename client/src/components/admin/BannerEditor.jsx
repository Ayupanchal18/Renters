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
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import {
  AlertCircle,
  Loader2,
  Image,
  Link as LinkIcon,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Banner Editor Component
 * 
 * Modal component for creating and editing homepage banners with:
 * - Title and slug
 * - Image URL
 * - Link URL and text
 * - Start/end dates for scheduling
 * - Display order
 * - Published status
 * 
 * Requirements: 6.1 - Update homepage banners
 * Requirements: 6.2 - Edit hero sections
 */

const CONTENT_API = '/api/admin/content';

const BannerEditor = ({ open, onOpenChange, banner, mode, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    startDate: '',
    endDate: '',
    order: 0,
    isPublished: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (isEdit && banner) {
        setFormData({
          title: banner.title || '',
          slug: banner.slug || '',
          content: banner.content || '',
          imageUrl: banner.imageUrl || '',
          linkUrl: banner.linkUrl || '',
          linkText: banner.linkText || '',
          startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
          endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
          order: banner.order || 0,
          isPublished: banner.isPublished || false
        });
      } else {
        setFormData({
          title: '',
          slug: '',
          content: '',
          imageUrl: '',
          linkUrl: '',
          linkText: '',
          startDate: '',
          endDate: '',
          order: 0,
          isPublished: false
        });
      }
      setError(null);
      setErrors({});
    }
  }, [open, banner, isEdit]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    // Auto-generate slug from title
    if (field === 'title' && !isEdit) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }
    
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }
    
    if (formData.linkUrl && !isValidUrl(formData.linkUrl)) {
      newErrors.linkUrl = 'Please enter a valid URL';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || null,
        linkUrl: formData.linkUrl.trim() || null,
        linkText: formData.linkText.trim() || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        order: parseInt(formData.order) || 0,
        isPublished: formData.isPublished
      };
      
      let response;
      if (isEdit) {
        response = await authenticatedFetch(`${CONTENT_API}/banners/${banner._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      } else {
        response = await authenticatedFetch(`${CONTENT_API}/banners`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} banner`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} banner:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {isEdit ? 'Edit Banner' : 'Add New Banner'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update banner details and settings.' : 'Create a new homepage banner.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="banner-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="banner-title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Banner title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>
          
          {/* Slug */}
          <div className="space-y-2">
            <label htmlFor="banner-slug" className="text-sm font-medium">
              Slug <span className="text-destructive">*</span>
            </label>
            <Input
              id="banner-slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="banner-slug"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
          </div>
          
          {/* Content/Description */}
          <div className="space-y-2">
            <label htmlFor="banner-content" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="banner-content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Optional banner description or subtitle"
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          
          {/* Image URL */}
          <div className="space-y-2">
            <label htmlFor="banner-image" className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4" />
              Image URL
            </label>
            <Input
              id="banner-image"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://example.com/banner-image.jpg"
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl}</p>
            )}
            {formData.imageUrl && !errors.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border bg-muted">
                <img
                  src={formData.imageUrl}
                  alt="Banner preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Link URL and Text */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="banner-link" className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link URL
              </label>
              <Input
                id="banner-link"
                value={formData.linkUrl}
                onChange={(e) => handleChange('linkUrl', e.target.value)}
                placeholder="https://example.com/page"
              />
              {errors.linkUrl && (
                <p className="text-sm text-destructive">{errors.linkUrl}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="banner-link-text" className="text-sm font-medium">
                Link Text
              </label>
              <Input
                id="banner-link-text"
                value={formData.linkText}
                onChange={(e) => handleChange('linkText', e.target.value)}
                placeholder="Learn More"
              />
            </div>
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="banner-start" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                id="banner-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="banner-end" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                id="banner-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>
          
          {/* Order and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="banner-order" className="text-sm font-medium">
                Display Order
              </label>
              <Input
                id="banner-order"
                type="number"
                value={formData.order}
                onChange={(e) => handleChange('order', e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center gap-3 h-10">
                <button
                  type="button"
                  onClick={() => handleChange('isPublished', !formData.isPublished)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                    formData.isPublished
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {formData.isPublished ? (
                    <><Eye className="h-4 w-4" /> Published</>
                  ) : (
                    <><EyeOff className="h-4 w-4" /> Draft</>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Banner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BannerEditor;
