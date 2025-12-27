import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  StarOff,
  Eye,
  Settings2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  IndianRupee,
  Home,
  ShoppingCart
} from 'lucide-react';
import { LISTING_TYPES, LISTING_TYPE_LABELS } from '@shared/propertyTypes';

/**
 * Property Table Component
 * 
 * Displays properties in a sortable, paginated table with action buttons
 * 
 * Requirements: 12.2 - Provide sorting, filtering, and pagination controls
 */

const CATEGORY_COLORS = {
  room: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  flat: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  house: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  hostel: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  commercial: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  sold: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  expired: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
};

const LISTING_TYPE_COLORS = {
  rent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  buy: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
};

const SortableHeader = ({ column, label, sortBy, sortOrder, onSort }) => {
  const isActive = sortBy === column;
  
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp 
          className={cn(
            'h-3 w-3 -mb-1',
            isActive && sortOrder === 'asc' ? 'text-primary' : 'text-muted-foreground/40'
          )} 
        />
        <ChevronDown 
          className={cn(
            'h-3 w-3',
            isActive && sortOrder === 'desc' ? 'text-primary' : 'text-muted-foreground/40'
          )} 
        />
      </span>
    </button>
  );
};


// Mobile Card Component for Properties
const PropertyCard = ({ 
  property, 
  onEdit, 
  onChangeStatus, 
  onToggleFeatured,
  onDelete 
}) => {
  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOwnerName = () => {
    if (property.ownerId && typeof property.ownerId === 'object') {
      return property.ownerId.name || 'Unknown';
    }
    return property.ownerName || 'Unknown';
  };

  const getFirstPhoto = () => {
    if (property.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return '/placeholder.svg';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="h-20 w-24 rounded-md bg-muted overflow-hidden shrink-0">
          <img 
            src={getFirstPhoto()} 
            alt={property.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  {property.title || 'Untitled'}
                </p>
                {property.featured && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{property.city || '-'}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => window.open(`/property/${property.slug || property._id}`, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Property
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(property)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Property
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeStatus(property)}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFeatured(property._id, property.featured)}>
                  {property.featured ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Remove Featured
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Mark as Featured
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(property._id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-1 text-sm font-medium mt-1">
            <IndianRupee className="h-3 w-3" />
            {property.listingType === 'buy' 
              ? formatPrice(property.sellingPrice).replace('₹', '')
              : formatPrice(property.monthlyRent).replace('₹', '')}
            {property.listingType !== 'buy' && (
              <span className="text-xs text-muted-foreground font-normal">/month</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        <Badge className={cn('capitalize', LISTING_TYPE_COLORS[property.listingType] || LISTING_TYPE_COLORS.rent)}>
          <span className="flex items-center gap-1">
            {property.listingType === 'buy' ? <ShoppingCart className="h-3 w-3" /> : <Home className="h-3 w-3" />}
            {LISTING_TYPE_LABELS[property.listingType] || 'For Rent'}
          </span>
        </Badge>
        <Badge className={cn('capitalize', CATEGORY_COLORS[property.category] || CATEGORY_COLORS.room)}>
          {property.category || 'room'}
        </Badge>
        <Badge className={cn('capitalize', STATUS_COLORS[property.status] || STATUS_COLORS.active)}>
          {property.status || 'active'}
        </Badge>
      </div>
      
      <div className="px-3 pb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Owner:</span>
          <p className="font-medium truncate">{getOwnerName()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Created:</span>
          <p className="font-medium">{formatDate(property.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

const PropertyTableRow = ({ 
  property, 
  onEdit, 
  onChangeStatus, 
  onToggleFeatured,
  onDelete 
}) => {
  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOwnerName = () => {
    if (property.ownerId && typeof property.ownerId === 'object') {
      return property.ownerId.name || 'Unknown';
    }
    return property.ownerName || 'Unknown';
  };

  const getFirstPhoto = () => {
    if (property.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return '/placeholder.svg';
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 rounded-md bg-muted overflow-hidden shrink-0">
            <img 
              src={getFirstPhoto()} 
              alt={property.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground truncate max-w-[200px]">
                {property.title || 'Untitled'}
              </p>
              {property.featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{property.city || '-'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', CATEGORY_COLORS[property.category] || CATEGORY_COLORS.room)}>
          {property.category || 'room'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', LISTING_TYPE_COLORS[property.listingType] || LISTING_TYPE_COLORS.rent)}>
          <span className="flex items-center gap-1">
            {property.listingType === 'buy' ? <ShoppingCart className="h-3 w-3" /> : <Home className="h-3 w-3" />}
            {LISTING_TYPE_LABELS[property.listingType] || 'For Rent'}
          </span>
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm font-medium">
          <IndianRupee className="h-3 w-3" />
          {property.listingType === 'buy' 
            ? formatPrice(property.sellingPrice).replace('₹', '')
            : formatPrice(property.monthlyRent).replace('₹', '')}
        </div>
        {property.listingType !== 'buy' && (
          <span className="text-xs text-muted-foreground">/month</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('capitalize', STATUS_COLORS[property.status] || STATUS_COLORS.active)}>
          {property.status || 'active'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{getOwnerName()}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{formatDate(property.createdAt)}</span>
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => window.open(`/property/${property.slug || property._id}`, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              View Property
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(property)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Property
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChangeStatus(property)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Change Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFeatured(property._id, property.featured)}>
              {property.featured ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove Featured
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Mark as Featured
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(property._id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-border">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-16 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded" /></td>
      </tr>
    ))}
  </>
);

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} properties
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">{page}</span>
          <span className="text-sm text-muted-foreground">of</span>
          <span className="text-sm font-medium">{totalPages || 1}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  );
};


// Mobile Card Skeleton for loading state
const CardSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex gap-3 p-3">
          <Skeleton className="h-20 w-24 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const PropertyTable = ({
  properties,
  loading,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onEdit,
  onChangeStatus,
  onToggleFeatured,
  onDelete
}) => {
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <CardSkeleton />
        ) : properties.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">No properties found</p>
          </div>
        ) : (
          properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              onEdit={onEdit}
              onChangeStatus={onChangeStatus}
              onToggleFeatured={onToggleFeatured}
              onDelete={onDelete}
            />
          ))
        )}
        
        {!loading && properties.length > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="title"
                  label="Property"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="category"
                  label="Category"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="listingType"
                  label="Type"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="monthlyRent"
                  label="Price"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="status"
                  label="Status"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                <SortableHeader
                  column="createdAt"
                  label="Created"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No properties found</p>
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <PropertyTableRow
                  key={property._id}
                  property={property}
                  onEdit={onEdit}
                  onChangeStatus={onChangeStatus}
                  onToggleFeatured={onToggleFeatured}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
        
        {!loading && properties.length > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>
    </>
  );
};

export default PropertyTable;
