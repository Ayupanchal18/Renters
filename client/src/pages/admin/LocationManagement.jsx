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
  Loader2,
  Building,
  Map,
  Globe
} from 'lucide-react';

const API_BASE = '/api/admin/locations';

const LOCATION_TYPES = [
  { value: 'state', label: 'State', icon: Globe },
  { value: 'city', label: 'City', icon: Building },
  { value: 'area', label: 'Area', icon: Map }
];

const LocationManagement = () => {
  const navigate = useNavigate();
  
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [parentLocation, setParentLocation] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
        setLocations(data.data.locations || []);
        setPagination(data.data.pagination || { page: 1, limit: 100, total: 0, totalPages: 0 });
      } else {
        throw new Error(data.message || 'Failed to fetch locations');
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [navigate, debouncedSearch, typeFilter, visibilityFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLocations();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setVisibilityFilter('all');
  };

  const hasActiveFilters = search || typeFilter !== 'all' || visibilityFilter !== 'all';

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

  const getTypeIcon = (type) => {
    const typeConfig = LOCATION_TYPES.find(t => t.value === type);
    return typeConfig?.icon || MapPin;
  };

  if (error && locations.length === 0) {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
            Location Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage cities for property listings
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
          <Button size="sm" onClick={() => handleCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
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
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && locations.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Location List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No locations found. Click "Add Location" to create one.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Parent</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locations.map(location => {
                      const TypeIcon = getTypeIcon(location.type);
                      return (
                        <tr key={location._id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <TypeIcon className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{location.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {location.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {location.parentId?.name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {location.isVisible ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Visible
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Hidden</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {locations.map(location => {
                  const TypeIcon = getTypeIcon(location.type);
                  return (
                    <div key={location._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <TypeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{location.name}</p>
                            {location.parentId?.name && (
                              <p className="text-sm text-muted-foreground truncate">
                                Parent: {location.parentId.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="capitalize text-xs">
                            {location.type}
                          </Badge>
                          {location.isVisible ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              Visible
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVisibility(location)}
                        >
                          {location.isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(location)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
          type: parentLocation ? (parentLocation.type === 'state' ? 'city' : 'area') : 'city',
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

  const getParentOptions = () => {
    if (formData.type === 'state') return [];
    if (formData.type === 'city') {
      return locations.filter(l => l.type === 'state');
    }
    return locations.filter(l => l.type === 'city' || l.type === 'state');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
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
              {isEdit ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationManagement;
