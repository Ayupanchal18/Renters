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
  Tags,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  X,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

/**
 * Category Management Page
 * 
 * Admin page for managing categories and amenities with:
 * - Category CRUD operations
 * - Amenity CRUD operations
 * - Active/Inactive toggle
 * 
 * Requirements: 5.4 - Create property categories (Rent, Buy, Commercial, PG)
 * Requirements: 5.5 - Allow add, edit, and delete operations for amenities
 */

const CATEGORIES_API = '/api/admin/categories';
const AMENITIES_API = '/api/admin/categories/amenities';

const AMENITY_CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'security', label: 'Security' },
  { value: 'recreation', label: 'Recreation' },
  { value: 'utility', label: 'Utility' },
  { value: 'other', label: 'Other' }
];

const CategoryManagement = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('categories');
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Amenities state
  const [amenities, setAmenities] = useState([]);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [amenityPagination, setAmenityPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  // Common state
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amenityCategoryFilter, setAmenityCategoryFilter] = useState('all');
  
  // Modal state
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [amenityFormOpen, setAmenityFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [formMode, setFormMode] = useState('create');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      
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
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }
      
      const response = await authenticatedFetch(`${CATEGORIES_API}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [navigate, debouncedSearch, statusFilter]);

  // Fetch amenities
  const fetchAmenities = useCallback(async () => {
    try {
      setAmenitiesLoading(true);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy: 'category',
        sortOrder: 'asc'
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }
      if (amenityCategoryFilter !== 'all') {
        params.append('category', amenityCategoryFilter);
      }
      
      const response = await authenticatedFetch(`${AMENITIES_API}/list?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setAmenities(data.data.amenities);
        setAmenityPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch amenities');
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setError(err.message);
    } finally {
      setAmenitiesLoading(false);
    }
  }, [navigate, debouncedSearch, statusFilter, amenityCategoryFilter]);

  // Initial load
  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else {
      fetchAmenities();
    }
  }, [activeTab, debouncedSearch, statusFilter, amenityCategoryFilter]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'categories') {
      await fetchCategories();
    } else {
      await fetchAmenities();
    }
    setRefreshing(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAmenityCategoryFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || amenityCategoryFilter !== 'all';

  // Category actions
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setFormMode('create');
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormMode('edit');
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${CATEGORIES_API}/${category._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchCategories();
      } else {
        throw new Error(data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message);
    }
  };

  const handleCategorySaved = () => {
    setCategoryFormOpen(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  // Amenity actions
  const handleCreateAmenity = () => {
    setSelectedAmenity(null);
    setFormMode('create');
    setAmenityFormOpen(true);
  };

  const handleEditAmenity = (amenity) => {
    setSelectedAmenity(amenity);
    setFormMode('edit');
    setAmenityFormOpen(true);
  };

  const handleDeleteAmenity = async (amenity) => {
    if (!window.confirm(`Are you sure you want to delete "${amenity.name}"?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${AMENITIES_API}/${amenity._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchAmenities();
      } else {
        throw new Error(data.message || 'Failed to delete amenity');
      }
    } catch (err) {
      console.error('Error deleting amenity:', err);
      setError(err.message);
    }
  };

  const handleAmenitySaved = () => {
    setAmenityFormOpen(false);
    setSelectedAmenity(null);
    fetchAmenities();
  };

  // Render categories list
  const renderCategories = () => (
    <div>
      {categoriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block divide-y">
            {categories.map(category => (
              <div
                key={category._id}
                className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {category.description}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {category.slug}
                </Badge>
                <Badge variant={category.isActive ? 'default' : 'secondary'} className="shrink-0">
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-sm text-muted-foreground shrink-0">
                  Order: {category.order}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {categories.map(category => (
              <div key={category._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={category.isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">{category.slug}</Badge>
                  <span>•</span>
                  <span>Order: {category.order}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No categories found. Click "Add Category" to create one.
        </div>
      )}
    </div>
  );

  // Render amenities list
  const renderAmenities = () => {
    // Group amenities by category
    const groupedAmenities = amenities.reduce((acc, amenity) => {
      const cat = amenity.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(amenity);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {amenitiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : amenities.length > 0 ? (
          Object.entries(groupedAmenities).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-4">
                {AMENITY_CATEGORIES.find(c => c.value === category)?.label || category}
              </h3>
              
              {/* Desktop View */}
              <div className="hidden sm:block divide-y border rounded-lg">
                {items.map(amenity => (
                  <div
                    key={amenity._id}
                    className="flex items-center gap-3 py-2 px-4 hover:bg-muted/50"
                  >
                    <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium">{amenity.name}</span>
                    <Badge variant={amenity.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {amenity.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditAmenity(amenity)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAmenity(amenity)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile View */}
              <div className="sm:hidden divide-y border rounded-lg">
                {items.map(amenity => (
                  <div key={amenity._id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{amenity.name}</span>
                      </div>
                      <Badge variant={amenity.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {amenity.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => handleEditAmenity(amenity)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAmenity(amenity)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No amenities found. Click "Add Amenity" to create one.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Tags className="h-5 w-5 sm:h-6 sm:w-6" />
            Category & Amenity Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage property categories and amenities
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
          {activeTab === 'categories' ? (
            <Button size="sm" onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreateAmenity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'categories'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'amenities'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Amenities
        </button>
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
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Amenity Category Filter (only for amenities tab) */}
            {activeTab === 'amenities' && (
              <Select value={amenityCategoryFilter} onValueChange={setAmenityCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {AMENITY_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
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
        <CardContent className="p-4">
          {activeTab === 'categories' ? renderCategories() : renderAmenities()}
        </CardContent>
      </Card>

      {/* Category Form Modal */}
      <CategoryFormModal
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={selectedCategory}
        mode={formMode}
        onSaved={handleCategorySaved}
      />

      {/* Amenity Form Modal */}
      <AmenityFormModal
        open={amenityFormOpen}
        onOpenChange={setAmenityFormOpen}
        amenity={selectedAmenity}
        mode={formMode}
        onSaved={handleAmenitySaved}
      />
    </div>
  );
};


// Category Form Modal Component
const CategoryFormModal = ({ open, onOpenChange, category, mode, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    order: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (isEdit && category) {
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          isActive: category.isActive !== false,
          order: category.order || 0
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          isActive: true,
          order: 0
        });
      }
      setError(null);
      setErrors({});
    }
  }, [open, category, isEdit]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    // Auto-generate slug from name
    if (field === 'name' && !isEdit) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
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
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim(),
        isActive: formData.isActive,
        order: parseInt(formData.order) || 0
      };
      
      let response;
      if (isEdit) {
        response = await authenticatedFetch(`${CATEGORIES_API}/${category._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      } else {
        response = await authenticatedFetch(CATEGORIES_API, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} category`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} category:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update category details.' : 'Create a new property category.'}
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
            <label htmlFor="cat-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="cat-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Apartment, Villa, PG"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          {/* Slug */}
          <div className="space-y-2">
            <label htmlFor="cat-slug" className="text-sm font-medium">Slug</label>
            <Input
              id="cat-slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="auto-generated-from-name"
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="cat-desc" className="text-sm font-medium">Description</label>
            <Input
              id="cat-desc"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description"
            />
          </div>
          
          {/* Order */}
          <div className="space-y-2">
            <label htmlFor="cat-order" className="text-sm font-medium">Display Order</label>
            <Input
              id="cat-order"
              type="number"
              value={formData.order}
              onChange={(e) => handleChange('order', e.target.value)}
              min="0"
            />
          </div>
          
          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cat-active"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="cat-active" className="text-sm font-medium">Active</label>
          </div>
          
          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// Amenity Form Modal Component
const AmenityFormModal = ({ open, onOpenChange, amenity, mode, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    icon: '',
    isActive: true,
    order: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (isEdit && amenity) {
        setFormData({
          name: amenity.name || '',
          category: amenity.category || 'other',
          icon: amenity.icon || '',
          isActive: amenity.isActive !== false,
          order: amenity.order || 0
        });
      } else {
        setFormData({
          name: '',
          category: 'other',
          icon: '',
          isActive: true,
          order: 0
        });
      }
      setError(null);
      setErrors({});
    }
  }, [open, amenity, isEdit]);

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
        category: formData.category,
        icon: formData.icon.trim() || null,
        isActive: formData.isActive,
        order: parseInt(formData.order) || 0
      };
      
      let response;
      if (isEdit) {
        response = await authenticatedFetch(`${AMENITIES_API}/${amenity._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      } else {
        response = await authenticatedFetch(AMENITIES_API, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} amenity`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} amenity:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Amenity' : 'Add New Amenity'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update amenity details.' : 'Create a new property amenity.'}
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
            <label htmlFor="amenity-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="amenity-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., WiFi, Parking, Gym"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {AMENITY_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Icon */}
          <div className="space-y-2">
            <label htmlFor="amenity-icon" className="text-sm font-medium">Icon (optional)</label>
            <Input
              id="amenity-icon"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="Icon name or URL"
            />
          </div>
          
          {/* Order */}
          <div className="space-y-2">
            <label htmlFor="amenity-order" className="text-sm font-medium">Display Order</label>
            <Input
              id="amenity-order"
              type="number"
              value={formData.order}
              onChange={(e) => handleChange('order', e.target.value)}
              min="0"
            />
          </div>
          
          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="amenity-active"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="amenity-active" className="text-sm font-medium">Active</label>
          </div>
          
          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Amenity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagement;
