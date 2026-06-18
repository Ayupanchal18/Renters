import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';
import { 
  Images, Upload, Search, RefreshCw, Filter, 
  Trash2, HardDrive, AlertTriangle, FileText, 
  Eye, HelpCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import MediaUploadZone from '../../components/admin/MediaUploadZone';
import MediaDetailPanel from '../../components/admin/MediaDetailPanel';

const API_BASE = '/api/admin/media';

export default function MediaLibrary() {
  const navigate = useNavigate();
  
  // Data states
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, total: 0, totalPages: 0 });
  const [storageStats, setStorageStats] = useState({ totalUsedBytes: 0, maxLimitBytes: 10 * 1024 * 1024 * 1024, percentUsed: '0.00', modules: [] });
  
  // UX states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'orphaned', 'active'
  const [sort, setSort] = useState('newest');

  // Sidebar detail state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load storage stats
  const fetchStorageStats = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/storage/stats`, { headers: getHeaders() }, navigate);
      const data = await res.json();
      if (data.success) {
        setStorageStats(data.data);
      }
    } catch (err) {
      console.error("Failed to load storage statistics:", err);
    }
  }, [navigate]);

  // Load media assets
  const fetchAssets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (moduleFilter && moduleFilter !== 'all') params.append('module', moduleFilter);
      if (statusFilter === 'orphaned') params.append('isOrphaned', 'true');
      if (statusFilter === 'active') params.append('isOrphaned', 'false');

      const res = await authenticatedFetch(`${API_BASE}?${params}`, { headers: getHeaders() }, navigate);
      const data = await res.json();

      if (data.success) {
        setAssets(data.data.assets);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || "Failed to load assets");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Load Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, moduleFilter, statusFilter, sort, pagination.limit, navigate]);

  useEffect(() => {
    fetchAssets(1);
    fetchStorageStats();
  }, [debouncedSearch, moduleFilter, statusFilter, sort, fetchAssets, fetchStorageStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAssets(pagination.page), fetchStorageStats()]);
    setRefreshing(false);
  };

  const handleBulkPruneOrphaned = async () => {
    const confirmPrune = window.confirm("Are you sure you want to delete all orphaned files? This will remove all files not currently attached to any properties, content pages, or reviews.");
    if (!confirmPrune) return;

    try {
      setLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/bulk/orphaned`, { method: 'DELETE', headers: getHeaders() }, navigate);
      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "Prune Complete",
          description: data.message || `Successfully removed ${data.deletedCount} unused assets.`
        });
        fetchAssets(1);
        fetchStorageStats();
      } else {
        throw new Error(data.message || "Failed to delete orphaned assets");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Prune Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Images className="h-6 w-6" />
            Media Library
          </h1>
          <p className="text-muted-foreground">
            Manage, crop, compress, and organize all assets and media listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={() => setUploadOpen(!uploadOpen)}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadOpen ? 'Hide Upload Zone' : 'Upload New'}
          </Button>
        </div>
      </div>

      {/* Storage Dashboard */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Limit Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  Cloud Storage Limit
                </span>
                <span>{storageStats.percentUsed}%</span>
              </div>
              <Progress value={parseFloat(storageStats.percentUsed)} className="h-2.5 bg-secondary" />
              <p className="text-xs text-muted-foreground">
                Using {formatBytes(storageStats.totalUsedBytes)} of {formatBytes(storageStats.maxLimitBytes)}
              </p>
            </div>

            {/* Modules Breakdown */}
            <div className="border-x px-6 space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Category Breakdown</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {storageStats.modules?.map((m) => (
                  <div key={m.module} className="bg-muted p-1.5 rounded-lg flex items-center gap-1 shadow-sm capitalize">
                    <span className="font-semibold">{m.module}:</span>
                    <span className="text-muted-foreground">{formatBytes(m.sizeBytes)} ({m.count})</span>
                  </div>
                )) || <span className="text-muted-foreground">No data available</span>}
              </div>
            </div>

            {/* Maintenance / Pruning Options */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'orphaned' ? 'all' : 'orphaned')}
                className="text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                {statusFilter === 'orphaned' ? 'Show All Files' : 'Filter Unused (Orphans)'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkPruneOrphaned} 
                className="text-xs hover:bg-destructive/10 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Bulk Delete Unused
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone (collapsible) */}
      {uploadOpen && (
        <Card className="border-primary/25 bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-sm">Drag-and-Drop Uploader</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUploadZone 
              module={moduleFilter !== 'all' ? moduleFilter : 'misc'}
              onUploadComplete={() => {
                fetchAssets(1);
                fetchStorageStats();
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search filename or original name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="testimonial">Testimonial</SelectItem>
                <SelectItem value="misc">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Usage Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Usage Status</SelectItem>
                <SelectItem value="active">Active (Linked)</SelectItem>
                <SelectItem value="orphaned">Orphaned (Unlinked)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Uploads</SelectItem>
                <SelectItem value="oldest">Oldest Uploads</SelectItem>
                <SelectItem value="largest">Largest File Sizes</SelectItem>
                <SelectItem value="smallest">Smallest File Sizes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Media Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-card">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">No media assets found</h3>
          <p className="text-muted-foreground text-sm max-w-sm text-center mt-1">
            Try adjusting your search criteria, category filters, or click upload to add your first asset.
          </p>
          <Button className="mt-4" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {assets.map((asset) => {
              const isImage = asset.mimeType?.startsWith('image/');
              
              return (
                <div 
                  key={asset._id}
                  onClick={() => handleAssetClick(asset)}
                  className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-primary/50 aspect-square flex flex-col justify-between"
                >
                  {/* Visual Content Box */}
                  <div className="flex-1 bg-muted/30 flex items-center justify-center overflow-hidden relative">
                    {isImage ? (
                      <img 
                        src={asset.thumbnailUrl || asset.cdnUrl} 
                        alt={asset.originalName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground opacity-60" />
                    )}

                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-9 w-9">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Tags overlay */}
                    {asset.isOrphaned && (
                      <div className="absolute top-2 left-2 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        Orphan
                      </div>
                    )}
                  </div>

                  {/* Metadata title footer */}
                  <div className="p-2 border-t bg-card/90">
                    <p className="text-xs font-semibold truncate text-foreground">
                      {asset.originalName || asset.filename}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatBytes(asset.sizeBytes)} · {asset.module || 'misc'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} files
              </span>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => fetchAssets(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <Button
                      key={pNum}
                      variant={pagination.page === pNum ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 text-xs"
                      onClick={() => fetchAssets(pNum)}
                    >
                      {pNum}
                    </Button>
                  );
                })}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => fetchAssets(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sliding Inspector Detail Panel */}
      {detailOpen && (
        <MediaDetailPanel
          asset={selectedAsset}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedAsset(null);
          }}
          onDeleteSuccess={() => {
            fetchAssets(pagination.page);
            fetchStorageStats();
          }}
          onReplaceSuccess={(updatedAsset) => {
            setSelectedAsset(updatedAsset);
            fetchAssets(pagination.page);
            fetchStorageStats();
          }}
        />
      )}
    </div>
  );
}
