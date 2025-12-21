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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Loader2,
  Building,
  Map,
  Globe
} from 'lucide-react';

/**
 * Location Management Page
 * 
 * Admin page for managing locations with:
 * - Location tree view
 * - CRUD operations for cities, areas, and states
 * - Visibility toggle
 * 
 * Requirements: 5.1 - Add city, area, or state to the system
 * Requirements: 5.2 - Update the location record
 * Requirements: 5.3 - Remove location only if no properties reference it
 * Requirements: 5.6 - Show or hide location in user-facing interfaces
 */

const API_BASE = '/api/admin/locations';

const LOCATION_TYPES = [
  { value: 'state', label: 'State', icon: Globe },
  { value: 'city', label: 'City', icon: Building },
  { value: 'area', label: 'Area', icon: Map }
];

const LocationManagement = () => {
  const navigate = useNavigate();
  
  // Data state
  const [locations, setLocations] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  
  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [parentLocation, setParentLocation] = useState(null);
  
  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch locations list
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (visibilityFilter && visibilityFilter !== 'all') {
        params.append('isVisible', visibilityFilter === 'visible' ? 'true' : 'false');
      }
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.data.locations);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch locations');
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, debouncedSearch, typeFilter, visibilityFilter]);

  // Fetch tree data
  const fetchTreeData = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/tree`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setTreeData(data.data);
      }
    } catch (err) {
      console.error('Error fetching tree data:', err);
    }
  }, [navigate]);

  // Initial load
  useEffect(() => {
    fetchLocations();
    fetchTreeData();
  }, [debouncedSearch, typeFilter, visibilityFilter]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchTreeData()]);
    setRefreshing(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setVisibilityFilter('all');
  };

  const hasActiveFilters = search || typeFilter !== 'all' || visibilityFilter !== 'all';

  // Tree node toggle
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Location actions
  const handleCreate = (parent = null) => {
    setSelectedLocation(null);
    setParentLocation(parent);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setParentLocation(null);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleToggleVisibility = async (location) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${location._id}/visibility`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isVisible: !location.isVisible })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        handleRefresh();
      } else {
        throw new Error(data.message || 'Failed to update visibility');
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (location) => {
    if (!window.confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${location._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        handleRefresh();
      } else {
        throw new Error(data.message || 'Failed to delete location');
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(err.message);
    }
  };

  const handleSaved = () => {
    setFormOpen(false);
    setSelectedLocation(null);
    setParentLocation(null);
    handleRefresh();
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const typeConfig = LOCATION_TYPES.find(t => t.value === type);
    return typeConfig?.icon || MapPin;
  };

  // Render tree node
  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);
    const TypeIcon = getTypeIcon(node.type);
    
    return (
      <div key={node._id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md group",
            level > 0 && "ml-6"
          )}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleNode(node._id)}
            className={cn(
              "p-1 rounded hover:bg-muted",
              !hasChildren && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          {/* Type icon */}
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
          
          {/* Name */}
          <span className="flex-1 font-medium">{node.name}</span>
          
          {/* Type badge */}
          <Badge variant="outline" className="text-xs capitalize">
            {node.type}
          </Badge>
          
          {/* Visibility indicator */}
          {!node.isVisible && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
          
          {/* Property count */}
          {node.propertyCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {node.propertyCount} properties
            </span>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleCreate(node)}
              title="Add child location"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleEdit(node)}
              title="Edit location"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleToggleVisibility(node)}
              title={node.isVisible ? 'Hide location' : 'Show location'}
            >
              {node.isVisible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => handleDelete(node)}
              title="Delete location"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l ml-5">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render list view
  const renderListView = () => (
    <div className="divide-y">
      {locations.map(location => {
        const TypeIcon = getTypeIcon(location.type);
        return (
          <div
            key={location._id}
            className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50"
          >
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{location.name}</div>
              {location.parentId && (
                <div className="text-sm text-muted-foreground">
                  Parent: {location.parentId.name || 'Unknown'}
                </div>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {location.type}
            </Badge>
            {!location.isVisible && (
              <Badge variant="secondary">Hidden</Badge>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(location)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggleVisibility(location)}
              >
                {location.isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(location)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      {locations.length === 0 && !loading && (
        <div className="py-12 text-center text-muted-foreground">
          No locations found
        </div>
      )}
    </div>
  );

  // Error state
  if (error && locations.length === 0 && treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load locations</h2>
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
            <MapPin className="h-6 w-6" />
            Location Management
          </h1>
          <p className="text-muted-foreground">
            Manage cities, areas, and states for property listings
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
          <Button onClick={() => handleCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
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
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Visibility Filter */}
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="rounded-r-none"
              >
                Tree
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                List
              </Button>
            </div>
            
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
      {error && (locations.length > 0 || treeData.length > 0) && (
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

      {/* Location Content */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-1">
              {treeData.length > 0 ? (
                treeData.map(node => renderTreeNode(node))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No locations found. Click "Add Location" to create one.
                </div>
              )}
            </div>
          ) : (
            renderListView()
          )}
        </CardContent>
      </Card>

      {/* Location Form Modal */}
      <LocationFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        location={selectedLocation}
        parentLocation={parentLocation}
        mode={formMode}
        locations={locations}
        onSaved={handleSaved}
      />
    </div>
  );
};

// Location Form Modal Component
const LocationFormModal = ({ open, onOpenChange, location, parentLocation, mode, locations, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'city',
    parentId: '',
    isVisible: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (isEdit && location) {
        setFormData({
          name: location.name || '',
          type: location.type || 'city',
          parentId: location.parentId?._id || location.parentId || '',
          isVisible: location.isVisible !== false
        });
      } else {
        setFormData({
          name: '',
          type: parentLocation ? (parentLocation.type === 'state' ? 'city' : 'area') : 'state',
          parentId: parentLocation?._id || '',
          isVisible: true
        });
      }
      setError(null);
      setErrors({});
    }
  }, [open, location, parentLocation, isEdit]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
        name: formData.name.trim(),
        type: formData.type,
        parentId: formData.parentId || null,
        isVisible: formData.isVisible
      };
      
      let response;
      if (isEdit) {
        response = await authenticatedFetch(`${API_BASE}/${location._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      } else {
        response = await authenticatedFetch(API_BASE, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} location`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} location:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get available parent locations based on type
  const getParentOptions = () => {
    if (formData.type === 'state') return [];
    if (formData.type === 'city') {
      return locations.filter(l => l.type === 'state');
    }
    return locations.filter(l => l.type === 'city' || l.type === 'state');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update location details.'
              : parentLocation 
                ? `Add a new location under "${parentLocation.name}".`
                : 'Create a new location for property listings.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter location name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Parent Location */}
          {formData.type !== 'state' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Location</label>
              <Select 
                value={formData.parentId} 
                onValueChange={(value) => handleChange('parentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {getParentOptions().map(loc => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Visibility */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isVisible"
              checked={formData.isVisible}
              onChange={(e) => handleChange('isVisible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isVisible" className="text-sm font-medium">
              Visible to users
            </label>
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
              {isEdit ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationManagement;
