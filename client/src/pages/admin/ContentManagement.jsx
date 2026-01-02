import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  FileText,
  Image,
  Layout,
  Search as SearchIcon,
  Plus,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  Settings
} from 'lucide-react';
import BannerEditor from '../../components/admin/BannerEditor';
import PageEditor from '../../components/admin/PageEditor';

/**
 * Content Management Page
 * 
 * Admin page for managing CMS content with tabs for:
 * - Banners (homepage banners)
 * - Pages (static pages like About, Terms, Privacy)
 * - SEO (metadata management)
 */

const CONTENT_API = '/api/admin/content';

const ContentManagement = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('banners');
  
  // Content state
  const [banners, setBanners] = useState([]);
  const [pages, setPages] = useState([]);
  const [seoData, setSeoData] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Common state
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [formMode, setFormMode] = useState('create');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'order',
        sortOrder: 'asc'
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (statusFilter !== 'all') {
        params.append('isPublished', statusFilter === 'published' ? 'true' : 'false');
      }
      
      const response = await authenticatedFetch(`${CONTENT_API}/banners?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data.banners || []);
      } else {
        throw new Error(data.message || 'Failed to fetch banners');
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, debouncedSearch, statusFilter]);

  // Fetch pages
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy: 'title',
        sortOrder: 'asc'
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (statusFilter !== 'all') {
        params.append('isPublished', statusFilter === 'published' ? 'true' : 'false');
      }
      
      const response = await authenticatedFetch(`${CONTENT_API}/pages?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setPages(data.data.pages || []);
      } else {
        throw new Error(data.message || 'Failed to fetch pages');
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, debouncedSearch, statusFilter]);

  // Fetch SEO data (pages with metadata)
  const fetchSeoData = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const response = await authenticatedFetch(`${CONTENT_API}/pages?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setSeoData(data.data.pages || []);
      } else {
        throw new Error(data.message || 'Failed to fetch SEO data');
      }
    } catch (err) {
      console.error('Error fetching SEO data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, debouncedSearch]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'banners') {
      fetchBanners();
    } else if (activeTab === 'pages') {
      fetchPages();
    } else if (activeTab === 'seo') {
      fetchSeoData();
    }
  }, [activeTab, debouncedSearch, statusFilter]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'banners') {
      await fetchBanners();
    } else if (activeTab === 'pages') {
      await fetchPages();
    } else {
      await fetchSeoData();
    }
    setRefreshing(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all';

  // Banner actions
  const handleCreateBanner = () => {
    setSelectedBanner(null);
    setFormMode('create');
    setBannerEditorOpen(true);
  };

  const handleEditBanner = (banner) => {
    setSelectedBanner(banner);
    setFormMode('edit');
    setBannerEditorOpen(true);
  };

  const handleDeleteBanner = async (banner) => {
    if (!window.confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${CONTENT_API}/banners/${banner._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchBanners();
      } else {
        throw new Error(data.message || 'Failed to delete banner');
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(err.message);
    }
  };

  const handleBannerSaved = () => {
    setBannerEditorOpen(false);
    setSelectedBanner(null);
    fetchBanners();
  };

  // Page actions
  const handleCreatePage = () => {
    setSelectedPage(null);
    setFormMode('create');
    setPageEditorOpen(true);
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setFormMode('edit');
    setPageEditorOpen(true);
  };

  const handleDeletePage = async (page) => {
    if (!window.confirm(`Are you sure you want to delete "${page.title}"?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${CONTENT_API}/pages/${page.slug}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchPages();
      } else {
        throw new Error(data.message || 'Failed to delete page');
      }
    } catch (err) {
      console.error('Error deleting page:', err);
      setError(err.message);
    }
  };

  const handlePageSaved = () => {
    setPageEditorOpen(false);
    setSelectedPage(null);
    if (activeTab === 'pages') {
      fetchPages();
    } else {
      fetchSeoData();
    }
  };

  // SEO edit (reuses page editor with SEO focus)
  const handleEditSeo = (page) => {
    setSelectedPage(page);
    setFormMode('edit');
    setPageEditorOpen(true);
  };

  // Render banners list
  const renderBanners = () => (
    <div className="divide-y">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : banners.length > 0 ? (
        banners.map(banner => (
          <div
            key={banner._id}
            className="flex items-center gap-4 py-4 px-4 hover:bg-muted/50"
          >
            {/* Banner preview */}
            <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Banner info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{banner.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {banner.slug}
              </div>
            </div>
            
            {/* Status */}
            <Badge variant={banner.isPublished ? 'default' : 'secondary'}>
              {banner.isPublished ? (
                <><Eye className="h-3 w-3 mr-1" /> Published</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
              )}
            </Badge>
            
            {/* Order */}
            <span className="text-sm text-muted-foreground">
              Order: {banner.order || 0}
            </span>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEditBanner(banner)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeleteBanner(banner)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No banners found. Click "Add Banner" to create one.</p>
        </div>
      )}
    </div>
  );

  // Render pages list
  const renderPages = () => (
    <div className="divide-y">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length > 0 ? (
        pages.map(page => (
          <div
            key={page._id}
            className="flex items-center gap-4 py-4 px-4 hover:bg-muted/50"
          >
            {/* Page icon */}
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Page info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{page.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                /{page.slug}
              </div>
            </div>
            
            {/* Status */}
            <Badge variant={page.isPublished ? 'default' : 'secondary'}>
              {page.isPublished ? (
                <><Eye className="h-3 w-3 mr-1" /> Published</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
              )}
            </Badge>
            
            {/* Last updated */}
            <span className="text-sm text-muted-foreground">
              {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : '-'}
            </span>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEditPage(page)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeletePage(page)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pages found. Click "Add Page" to create one.</p>
        </div>
      )}
    </div>
  );

  // Render SEO list
  const renderSeo = () => (
    <div className="divide-y">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : seoData.length > 0 ? (
        seoData.map(page => (
          <div
            key={page._id}
            className="flex items-start gap-4 py-4 px-4 hover:bg-muted/50"
          >
            {/* SEO icon */}
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* SEO info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{page.title}</div>
              <div className="text-sm text-muted-foreground mb-2">
                /{page.slug}
              </div>
              
              {/* SEO metadata preview */}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="truncate">
                    {page.metadata?.seoTitle || <span className="text-muted-foreground italic">Not set</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="truncate">
                    {page.metadata?.seoDescription || <span className="text-muted-foreground italic">Not set</span>}
                  </span>
                </div>
                {page.metadata?.seoKeywords?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">Keywords:</span>
                    {page.metadata.seoKeywords.slice(0, 3).map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {page.metadata.seoKeywords.length > 3 && (
                      <span className="text-muted-foreground text-xs">
                        +{page.metadata.seoKeywords.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditSeo(page)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit SEO
            </Button>
          </div>
        ))
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pages with SEO data found. Create pages first to manage their SEO.</p>
        </div>
      )}
    </div>
  );

  // Get tab icon
  const getTabIcon = (tab) => {
    switch (tab) {
      case 'banners':
        return <Image className="h-4 w-4" />;
      case 'pages':
        return <FileText className="h-4 w-4" />;
      case 'seo':
        return <Globe className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layout className="h-6 w-6" />
            Content Management
          </h1>
          <p className="text-muted-foreground">
            Manage banners, static pages, and SEO metadata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          {activeTab === 'banners' && (
            <Button onClick={handleCreateBanner}>
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          )}
          {activeTab === 'pages' && (
            <Button onClick={handleCreatePage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {['banners', 'pages', 'seo'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {getTabIcon(tab)}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter (not for SEO tab) */}
            {activeTab !== 'seo' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            )}
            
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
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {activeTab === 'banners' && renderBanners()}
          {activeTab === 'pages' && renderPages()}
          {activeTab === 'seo' && renderSeo()}
        </CardContent>
      </Card>

      {/* Banner Editor Modal */}
      <BannerEditor
        open={bannerEditorOpen}
        onOpenChange={setBannerEditorOpen}
        banner={selectedBanner}
        mode={formMode}
        onSaved={handleBannerSaved}
      />

      {/* Page Editor Modal */}
      <PageEditor
        open={pageEditorOpen}
        onOpenChange={setPageEditorOpen}
        page={selectedPage}
        mode={formMode}
        onSaved={handlePageSaved}
        showSeoFields={activeTab === 'seo'}
      />
    </div>
  );
};

export default ContentManagement;
