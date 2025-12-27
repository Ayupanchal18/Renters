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
import PropertyTable from '../../components/admin/PropertyTable';
import PropertyFormModal from '../../components/admin/PropertyFormModal';
import PropertyStatusModal from '../../components/admin/PropertyStatusModal';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  Home,
  ShoppingCart
} from 'lucide-react';
import { LISTING_TYPES, LISTING_TYPE_LABELS } from '@shared/propertyTypes';

/**
 * Property Management Page
 * 
 * Admin page for managing properties with:
 * - Paginated property table
 * - Search and filter capabilities
 * - Create/Edit/Delete property actions
 * - Status and featured management
 * 
 * Requirements: 4.1 - Return all properties regardless of owner with pagination
 * Requirements: 12.2 - Provide sorting, filtering, and pagination controls
 */

const API_BASE = '/api/admin/properties';

const PropertyManagement = () => {
  const navigate = useNavigate();
  
  // Data state
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [listingTypeFilter, setListingTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal state
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formMode, setFormMode] = useState('create');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch properties
  const fetchProperties = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (featuredFilter && featuredFilter !== 'all') {
        params.append('featured', featuredFilter === 'featured' ? 'true' : 'false');
      }
      if (listingTypeFilter && listingTypeFilter !== 'all') {
        params.append('listingType', listingTypeFilter);
      }
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.data.properties);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, pagination.limit, debouncedSearch, categoryFilter, statusFilter, featuredFilter, listingTypeFilter, sortBy, sortOrder]);

  // Initial load and filter changes
  useEffect(() => {
    fetchProperties(1);
  }, [debouncedSearch, categoryFilter, statusFilter, featuredFilter, listingTypeFilter, sortBy, sortOrder]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProperties(pagination.page);
    setRefreshing(false);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    fetchProperties(newPage);
  };

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setFeaturedFilter('all');
    setListingTypeFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all' || listingTypeFilter !== 'all';

  // Property actions
  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setFormMode('create');
    setPropertyFormOpen(true);
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setFormMode('edit');
    setPropertyFormOpen(true);
  };

  const handleChangeStatus = (property) => {
    setSelectedProperty(property);
    setStatusModalOpen(true);
  };

  const handlePropertySaved = () => {
    setPropertyFormOpen(false);
    setSelectedProperty(null);
    fetchProperties(pagination.page);
  };

  const handleStatusChanged = () => {
    setStatusModalOpen(false);
    setSelectedProperty(null);
    fetchProperties(pagination.page);
  };

  const handleToggleFeatured = async (propertyId, featured) => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/${propertyId}/featured`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ featured: !featured })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchProperties(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to update featured status');
      }
    } catch (err) {
      console.error('Error updating featured status:', err);
      setError(err.message);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${propertyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchProperties(pagination.page);
      } else {
        throw new Error(data.message || 'Failed to delete property');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      setError(err.message);
    }
  };

  // Error state
  if (error && properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load properties</h2>
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
            <Building2 className="h-6 w-6" />
            Property Management
          </h1>
          <p className="text-muted-foreground">
            Manage all property listings across the platform
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
          <Button onClick={handleCreateProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
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
                placeholder="Search by title, city, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="pg">PG</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Featured Filter */}
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="regular">Regular Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Listing Type Filter */}
            <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={LISTING_TYPES.RENT}>
                  <span className="flex items-center gap-2">
                    <Home className="h-3 w-3" />
                    {LISTING_TYPE_LABELS.rent}
                  </span>
                </SelectItem>
                <SelectItem value={LISTING_TYPES.BUY}>
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3" />
                    {LISTING_TYPE_LABELS.buy}
                  </span>
                </SelectItem>
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
      {error && properties.length > 0 && (
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

      {/* Property Table */}
      <Card>
        <CardContent className="p-0">
          <PropertyTable
            properties={properties}
            loading={loading}
            pagination={pagination}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onEdit={handleEditProperty}
            onChangeStatus={handleChangeStatus}
            onToggleFeatured={handleToggleFeatured}
            onDelete={handleDeleteProperty}
          />
        </CardContent>
      </Card>

      {/* Property Form Modal */}
      <PropertyFormModal
        open={propertyFormOpen}
        onOpenChange={setPropertyFormOpen}
        property={selectedProperty}
        mode={formMode}
        onSaved={handlePropertySaved}
      />

      {/* Property Status Modal */}
      <PropertyStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        property={selectedProperty}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
};

export default PropertyManagement;
