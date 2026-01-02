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
import { cn } from '../../lib/utils';
import {
  AlertCircle,
  Loader2,
  FileText,
  Globe,
  Eye,
  EyeOff,
  X,
  Plus,
  Search
} from 'lucide-react';

/**
 * Page Editor Component
 * 
 * Modal component for creating and editing static pages with:
 * - Title and slug
 * - Rich content (HTML/Markdown)
 * - SEO metadata (title, description, keywords)
 * - Published status
 */

const CONTENT_API = '/api/admin/content';

const PageEditor = ({ open, onOpenChange, page, mode, onSaved, showSeoFields = false }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [activeTab, setActiveTab] = useState(showSeoFields ? 'seo' : 'content');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: false,
    // SEO fields
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    author: ''
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (isEdit && page) {
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          isPublished: page.isPublished || false,
          seoTitle: page.metadata?.seoTitle || '',
          seoDescription: page.metadata?.seoDescription || '',
          seoKeywords: page.metadata?.seoKeywords || [],
          author: page.metadata?.author || ''
        });
      } else {
        setFormData({
          title: '',
          slug: '',
          content: '',
          isPublished: false,
          seoTitle: '',
          seoDescription: '',
          seoKeywords: [],
          author: ''
        });
      }
      setActiveTab(showSeoFields ? 'seo' : 'content');
      setNewKeyword('');
      setError(null);
      setErrors({});
    }
  }, [open, page, isEdit, showSeoFields]);

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

  const handleAddKeyword = () => {
    const keyword = newKeyword.trim().toLowerCase();
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keyword]
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword)
    }));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
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
    
    if (!showSeoFields && !formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (formData.seoDescription && formData.seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description should be under 160 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        content: formData.content.trim(),
        isPublished: formData.isPublished,
        metadata: {
          seoTitle: formData.seoTitle.trim() || undefined,
          seoDescription: formData.seoDescription.trim() || undefined,
          seoKeywords: formData.seoKeywords.length > 0 ? formData.seoKeywords : undefined,
          author: formData.author.trim() || undefined
        }
      };
      
      let response;
      if (isEdit) {
        response = await authenticatedFetch(`${CONTENT_API}/pages/${page.slug}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      } else {
        response = await authenticatedFetch(`${CONTENT_API}/pages`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} page`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} page:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render content tab
  const renderContentTab = () => (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="page-title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="page-title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Page title"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>
      
      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="page-slug" className="text-sm font-medium">
          Slug <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">/</span>
          <Input
            id="page-slug"
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="page-slug"
            className="flex-1"
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug}</p>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <label htmlFor="page-content" className="text-sm font-medium">
          Content <span className="text-destructive">*</span>
        </label>
        <textarea
          id="page-content"
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Page content (HTML or Markdown supported)"
          className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          You can use HTML or Markdown for formatting.
        </p>
      </div>
      
      {/* Author */}
      <div className="space-y-2">
        <label htmlFor="page-author" className="text-sm font-medium">
          Author
        </label>
        <Input
          id="page-author"
          value={formData.author}
          onChange={(e) => handleChange('author', e.target.value)}
          placeholder="Author name"
        />
      </div>
      
      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <div className="flex items-center gap-3">
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
  );

  // Render SEO tab
  const renderSeoTab = () => (
    <div className="space-y-4">
      {/* SEO Title */}
      <div className="space-y-2">
        <label htmlFor="seo-title" className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          SEO Title
        </label>
        <Input
          id="seo-title"
          value={formData.seoTitle}
          onChange={(e) => handleChange('seoTitle', e.target.value)}
          placeholder="SEO optimized title (defaults to page title)"
        />
        <p className="text-xs text-muted-foreground">
          {formData.seoTitle.length}/60 characters (recommended)
        </p>
      </div>
      
      {/* SEO Description */}
      <div className="space-y-2">
        <label htmlFor="seo-description" className="text-sm font-medium">
          Meta Description
        </label>
        <textarea
          id="seo-description"
          value={formData.seoDescription}
          onChange={(e) => handleChange('seoDescription', e.target.value)}
          placeholder="Brief description for search engines"
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className={cn(
          "text-xs",
          formData.seoDescription.length > 160 ? "text-destructive" : "text-muted-foreground"
        )}>
          {formData.seoDescription.length}/160 characters
        </p>
        {errors.seoDescription && (
          <p className="text-sm text-destructive">{errors.seoDescription}</p>
        )}
      </div>
      
      {/* SEO Keywords */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Keywords</label>
        <div className="flex items-center gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            placeholder="Add keyword and press Enter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.seoKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.seoKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Add relevant keywords for better search visibility
        </p>
      </div>
      
      {/* SEO Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search Preview</label>
        <div className="p-4 bg-muted rounded-lg space-y-1">
          <div className="text-blue-600 text-lg truncate">
            {formData.seoTitle || formData.title || 'Page Title'}
          </div>
          <div className="text-green-700 text-sm">
            example.com/{formData.slug || 'page-slug'}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {formData.seoDescription || 'No description set. Add a meta description to improve search visibility.'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSeoFields ? (
              <><Globe className="h-5 w-5" /> Edit SEO Settings</>
            ) : (
              <><FileText className="h-5 w-5" /> {isEdit ? 'Edit Page' : 'Add New Page'}</>
            )}
          </DialogTitle>
          <DialogDescription>
            {showSeoFields
              ? 'Update SEO metadata for better search visibility.'
              : isEdit
                ? 'Update page content and settings.'
                : 'Create a new static page.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* Tabs (only show if not SEO-only mode) */}
          {!showSeoFields && (
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === 'content'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === 'seo'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="h-4 w-4" />
                SEO
              </button>
            </div>
          )}
          
          {/* Tab Content */}
          {showSeoFields ? (
            <>
              {/* Show page info in SEO mode */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{formData.title}</div>
                <div className="text-sm text-muted-foreground">/{formData.slug}</div>
              </div>
              {renderSeoTab()}
            </>
          ) : (
            activeTab === 'content' ? renderContentTab() : renderSeoTab()
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {showSeoFields ? 'Save SEO Settings' : isEdit ? 'Save Changes' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PageEditor;
