import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import { toast } from '../ui/use-toast';
import {
  AlertCircle,
  Loader2,
  FileText,
  Globe,
  Eye,
  X,
  Plus,
  Search,
  History,
  Calendar,
  Clock,
  ExternalLink,
  Save
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const CONTENT_API = '/api/admin/content';

export default function PageEditor({ open, onOpenChange, page, mode, onSaved, showSeoFields = false }) {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [activeTab, setActiveTab] = useState(showSeoFields ? 'seo' : 'content');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft', // 'draft', 'scheduled', 'published', 'archived'
    scheduledFor: null,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    author: ''
  });
  
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Versions state
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Initialize and load version history
  const fetchVersionHistory = async () => {
    if (!isEdit || !page?._id) return;
    setVersionsLoading(true);
    try {
      const res = await authenticatedFetch(`${CONTENT_API}/pages/${page._id}/versions`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setVersions(data.data.reverse()); // Show newest versions first
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (isEdit && page) {
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          status: page.status || (page.isPublished ? 'published' : 'draft'),
          scheduledFor: page.scheduledFor || null,
          seoTitle: page.metadata?.seoTitle || '',
          seoDescription: page.metadata?.seoDescription || '',
          seoKeywords: page.metadata?.seoKeywords || [],
          author: page.metadata?.author || ''
        });
        fetchVersionHistory();
      } else {
        setFormData({
          title: '',
          slug: '',
          content: '',
          status: 'draft',
          scheduledFor: null,
          seoTitle: '',
          seoDescription: '',
          seoKeywords: [],
          author: ''
        });
        setVersions([]);
      }
      setActiveTab(showSeoFields ? 'seo' : 'content');
      setNewKeyword('');
      setError(null);
      setErrors({});
    }
  }, [open, page, isEdit, showSeoFields]);

  // Autosave Draft Debounce (Runs only in Edit mode)
  useEffect(() => {
    if (!open || !isEdit || !page?._id) return;
    
    // Skip if nothing changed from current state
    if (formData.content === page.content && formData.title === page.title && formData.slug === page.slug) {
      return;
    }

    const timer = setTimeout(async () => {
      setAutosaving(true);
      try {
        await authenticatedFetch(`${CONTENT_API}/pages/${page._id}/autosave`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            content: formData.content,
            title: formData.title,
            slug: formData.slug
          })
        });
      } catch (err) {
        console.warn("Autosave draft failed:", err);
      } finally {
        setAutosaving(false);
      }
    }, 2000); // 2-second debounce for typing/keystrokes

    return () => clearTimeout(timer);
  }, [formData.content, formData.title, formData.slug, isEdit, page, open]);

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

  const handlePreview = async () => {
    if (!page?._id) return;
    try {
      const res = await authenticatedFetch(`${CONTENT_API}/pages/${page._id}/preview-token`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Preview Token Generated",
          description: "Opening preview window..."
        });
        window.open(data.data.previewUrl, '_blank');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Preview Failed",
        description: err.message || "Failed to generate page preview",
        variant: "destructive"
      });
    }
  };

  const handleRestoreVersion = async (vNum) => {
    if (!window.confirm(`Are you sure you want to restore Version ${vNum}? Current unsaved edits will be saved as a draft first.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await authenticatedFetch(`${CONTENT_API}/pages/${page._id}/versions/${vNum}/restore`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Version Restored",
          description: `Successfully restored page content to Version ${vNum}.`
        });
        setFormData(prev => ({
          ...prev,
          content: data.data.content
        }));
        fetchVersionHistory();
        setActiveTab('content');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Restore Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!showSeoFields && !formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.status === 'scheduled' && !formData.scheduledFor) {
      newErrors.scheduledFor = 'Scheduled date and time is required';
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
      // Use the proper endpoint depending on status: 'publish', 'schedule', or basic page edit
      let endpoint = isEdit ? `${CONTENT_API}/pages/${page.slug}` : `${CONTENT_API}/pages`;
      let method = isEdit ? 'PUT' : 'POST';
      let payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        isPublished: formData.status === 'published',
        metadata: {
          seoTitle: formData.seoTitle.trim() || undefined,
          seoDescription: formData.seoDescription.trim() || undefined,
          seoKeywords: formData.seoKeywords.length > 0 ? formData.seoKeywords : undefined,
          author: formData.author.trim() || undefined
        }
      };

      // Handle custom statuses
      if (formData.status === 'scheduled') {
        endpoint = `${CONTENT_API}/pages/${page._id}/schedule`;
        method = 'POST';
        payload = { publishAt: formData.scheduledFor };
      } else if (formData.status === 'published' && isEdit) {
        endpoint = `${CONTENT_API}/pages/${page._id}/publish`;
        method = 'POST';
        payload = {
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          content: formData.content.trim()
        };
      }

      const response = await authenticatedFetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "CMS Page Saved",
          description: `Page details successfully updated.`
        });
        onSaved();
      } else {
        throw new Error(data.message || `Failed to save page`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <DialogTitle className="flex items-center gap-2">
              {showSeoFields ? (
                <><Globe className="h-5 w-5" /> Edit SEO Settings</>
              ) : (
                <><FileText className="h-5 w-5" /> {isEdit ? 'Edit Page' : 'Add New Page'}</>
              )}
              {autosaving && (
                <Badge variant="outline" className="animate-pulse text-xs text-primary ml-2 border-primary/30">
                  <Save className="h-3 w-3 mr-1" /> Auto-saving draft...
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {showSeoFields
                ? 'Update SEO metadata for better search visibility.'
                : isEdit
                  ? 'Update page content, scheduling options, and versioning.'
                  : 'Create a new static page.'}
            </DialogDescription>
          </div>

          {isEdit && !showSeoFields && (
            <Button size="sm" variant="outline" onClick={handlePreview} className="text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Preview Page
            </Button>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* Tabs */}
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
              {isEdit && (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                    activeTab === 'history'
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <History className="h-4 w-4" />
                  History ({versions.length})
                </button>
              )}
            </div>
          )}
          
          {/* Content Tab */}
          {activeTab === 'content' && !showSeoFields && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
                
                {/* Slug */}
                <div className="space-y-2">
                  <label htmlFor="page-slug" className="text-sm font-medium">
                    Slug <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="page-slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="page-slug"
                  />
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                </div>
              </div>
              
              {/* Rich Text Editor */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Content Body <span className="text-destructive">*</span>
                </label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(html) => handleChange('content', html)}
                />
                {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Author */}
                <div className="space-y-2">
                  <label htmlFor="page-author" className="text-sm font-medium">Author</label>
                  <Input
                    id="page-author"
                    value={formData.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    placeholder="Author name"
                  />
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select publication status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Private)</SelectItem>
                      <SelectItem value="published">Published (Live)</SelectItem>
                      <SelectItem value="scheduled">Scheduled (Future)</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date-time Picker (Visible only if Status is Scheduled) */}
                {formData.status === 'scheduled' && (
                  <div className="space-y-2">
                    <label htmlFor="scheduled-date" className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      Publish At
                    </label>
                    <Input
                      type="datetime-local"
                      id="scheduled-date"
                      value={formData.scheduledFor ? new Date(new Date(formData.scheduledFor).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleChange('scheduledFor', e.target.value)}
                    />
                    {errors.scheduledFor && <p className="text-xs text-destructive">{errors.scheduledFor}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="seo-title" className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  SEO Title
                </label>
                <Input
                  id="seo-title"
                  value={formData.seoTitle}
                  onChange={(e) => handleChange('seoTitle', e.target.value)}
                  placeholder="SEO optimized title"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="seo-description" className="text-sm font-medium">Meta Description</label>
                <textarea
                  id="seo-description"
                  value={formData.seoDescription}
                  onChange={(e) => handleChange('seoDescription', e.target.value)}
                  placeholder="Meta description for search engine snippets"
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters</p>
                {errors.seoDescription && <p className="text-xs text-destructive">{errors.seoDescription}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Keywords</label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Type keyword and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddKeyword} disabled={!newKeyword.trim()}>Add</Button>
                </div>
                {formData.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.seoKeywords.map((k) => (
                      <Badge key={k} variant="secondary" className="gap-1">
                        {k}
                        <button type="button" onClick={() => handleRemoveKeyword(k)} className="hover:text-destructive text-muted-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && isEdit && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Revision History</h3>
              {versionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-10 text-center">No historic versions recorded yet. Publish changes to register a restore point.</p>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {versions.map((ver) => (
                    <div key={ver.versionNumber} className="flex justify-between items-center p-3.5 bg-muted/40 border rounded-xl hover:bg-muted/70 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{ver.versionNumber}</Badge>
                          <span className="text-xs font-semibold">{ver.label || `Version ${ver.versionNumber}`}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(ver.savedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          {ver.savedBy && (
                            <>
                              <span>·</span>
                              <span>By {ver.savedBy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Quick preview version raw content in new tab
                            const w = window.open();
                            w.document.write(ver.content);
                            w.document.close();
                          }}
                          className="text-xs"
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreVersion(ver.versionNumber)}
                          className="text-xs"
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
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
}
