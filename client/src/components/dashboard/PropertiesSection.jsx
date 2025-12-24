import React, { useState, useCallback, useMemo } from "react";
import { Eye, MapPin, Edit2, MoreVertical, ToggleLeft, ToggleRight, Trash2, TrendingUp, Users, Calendar, Loader2, Filter, ArrowUpDown, Home, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PropertiesSectionSkeleton } from "../ui/skeleton-loaders";
import { LoadingOverlay, InlineLoading } from "../ui/loading-states";

// Memoized PropertyCard component with optimized mobile design
const PropertyCard = React.memo(function PropertyCard({ 
    prop, 
    onToggleStatus, 
    onDeleteProperty, 
    operationLoading, 
    activeDropdown,
    setActiveDropdown 
}) {
    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'active': return 'text-success bg-success/10 border-success/20';
            case 'inactive': return 'text-warning bg-warning/10 border-warning/20';
            case 'blocked': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    }, []);

    const formatDate = useCallback((date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    const handleToggleClick = useCallback(() => {
        onToggleStatus(prop._id, prop.status);
    }, [prop._id, prop.status, onToggleStatus]);

    const handleDeleteClick = useCallback(() => {
        onDeleteProperty(prop._id);
    }, [prop._id, onDeleteProperty]);

    const handleDropdownToggle = useCallback(() => {
        setActiveDropdown(activeDropdown === prop._id ? null : prop._id);
    }, [activeDropdown, prop._id, setActiveDropdown]);

    const daysListed = Math.floor((new Date() - new Date(prop.createdAt)) / (1000 * 60 * 60 * 24)) || 0;

    // Dropdown menu component (reused for both layouts)
    const DropdownMenu = ({ className = "" }) => (
        <div className={`absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-xl z-20 overflow-hidden ${className}`}>
            <div className="py-1">
                <Link
                    to={`/properties/${prop._id}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    onClick={() => setActiveDropdown(null)}
                >
                    <Edit2 size={14} className="text-muted-foreground" />
                    View Details
                </Link>
                <button
                    onClick={handleToggleClick}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted w-full text-left disabled:opacity-50 transition-colors"
                    disabled={operationLoading[prop._id]}
                >
                    {prop.status === 'active' ? (
                        <>
                            <ToggleLeft size={14} className="text-warning" />
                            Deactivate
                        </>
                    ) : (
                        <>
                            <ToggleRight size={14} className="text-success" />
                            Activate
                        </>
                    )}
                </button>
                <div className="border-t border-border my-1" />
                <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left disabled:opacity-50 transition-colors"
                    disabled={operationLoading[prop._id]}
                >
                    <Trash2 size={14} />
                    Delete
                </button>
            </div>
        </div>
    );

    return (
        <div className="group bg-card border border-border hover:border-primary/30 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Mobile Layout (< lg) */}
            <div className="block lg:hidden">
                {/* Header with image and basic info */}
                <div className="flex gap-3 p-3">
                    {/* Property Image */}
                    {(prop.photos && prop.photos[0]) ? (
                        <Link to={`/properties/${prop._id}`} className="flex-shrink-0">
                            <img
                                src={prop.photos[0]}
                                alt={prop.title}
                                className="w-20 h-20 object-cover rounded-lg"
                                loading="lazy"
                            />
                        </Link>
                    ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                            <Building2 size={24} className="text-muted-foreground/40" />
                        </div>
                    )}

                    {/* Title, Status, Location, Price */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <Link to={`/properties/${prop._id}`} className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                                    {prop.title}
                                </h4>
                            </Link>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize ${getStatusColor(prop.status)}`}>
                                    {prop.status}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={handleDropdownToggle}
                                        className="p-1 hover:bg-muted rounded transition-colors"
                                        disabled={operationLoading[prop._id]}
                                    >
                                        {operationLoading[prop._id] ? (
                                            <Loader2 size={14} className="text-muted-foreground animate-spin" />
                                        ) : (
                                            <MoreVertical size={14} className="text-muted-foreground" />
                                        )}
                                    </button>
                                    {activeDropdown === prop._id && <DropdownMenu />}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1.5">
                            <MapPin size={11} className="text-primary flex-shrink-0" />
                            <span className="truncate">{prop.city || "Unknown"}</span>
                        </div>

                        {/* Rent Price */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-primary">₹{prop.monthlyRent?.toLocaleString() || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground">/mo</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-around px-3 py-2 bg-muted/30 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye size={12} className="text-purple-500" />
                        <span>{prop.views || 0}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Users size={12} className="text-blue-500" />
                        <span>{prop.favoritesCount || 0}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar size={12} className="text-orange-500" />
                        <span>{daysListed}d</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{prop.propertyType}</span>
                    {prop.bedrooms && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{prop.bedrooms} BHK</span>
                    )}
                    {prop.furnishing && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{prop.furnishing}</span>
                    )}
                    {prop.views > 100 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 text-success text-[10px] font-medium rounded">
                            <TrendingUp size={9} />
                            Hot
                        </span>
                    )}
                </div>

                {/* Loading indicator */}
                {operationLoading[prop._id] && (
                    <div className="px-3 py-2 bg-primary/5 border-t border-primary/20">
                        <div className="flex items-center gap-2">
                            <Loader2 size={12} className="text-primary animate-spin" />
                            <span className="text-xs text-primary font-medium">
                                {operationLoading[prop._id] === 'toggle' ? 'Updating...' : 'Deleting...'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop/Tablet Layout (>= lg) */}
            <div className="hidden lg:block p-5">
                <div className="flex items-start gap-4">
                    {(prop.photos && prop.photos[0]) ? (
                        <Link to={`/properties/${prop._id}`} className="flex-shrink-0">
                            <img
                                src={prop.photos[0]}
                                alt={prop.title}
                                className="w-28 h-28 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                loading="lazy"
                            />
                        </Link>
                    ) : (
                        <div className="w-28 h-28 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                            <Building2 size={32} className="text-muted-foreground/40" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {/* Title and Status Row */}
                        <div className="flex items-start justify-between mb-3 gap-3">
                            <Link to={`/properties/${prop._id}`} className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-lg truncate hover:text-primary transition-colors">
                                    {prop.title}
                                </h4>
                            </Link>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(prop.status)}`}>
                                    {prop.status}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={handleDropdownToggle}
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                        disabled={operationLoading[prop._id]}
                                    >
                                        {operationLoading[prop._id] ? (
                                            <Loader2 size={14} className="text-muted-foreground animate-spin" />
                                        ) : (
                                            <MoreVertical size={14} className="text-muted-foreground" />
                                        )}
                                    </button>
                                    {activeDropdown === prop._id && <DropdownMenu className="w-52" />}
                                </div>
                            </div>
                        </div>
                        
                        {/* Loading indicator */}
                        {operationLoading[prop._id] && (
                            <div className="flex items-center gap-1 mb-2">
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                                    <Loader2 size={12} className="text-primary animate-spin" />
                                    <span className="text-xs text-primary font-medium">
                                        {operationLoading[prop._id] === 'toggle' ? 'Updating...' : 'Deleting...'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mb-4">
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                                <MapPin size={14} className="text-primary" />
                                <span>{prop.city || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                                <Eye size={14} className="text-purple-500" />
                                <span>{prop.views || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                                <Calendar size={14} className="text-orange-500" />
                                <span>{formatDate(prop.createdAt)}</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/30">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <TrendingUp size={12} className="text-emerald-600" />
                                    <span className="text-xs font-medium text-muted-foreground">Rent</span>
                                </div>
                                <div className="text-base font-bold text-foreground">
                                    ₹{prop.monthlyRent?.toLocaleString() || 'N/A'}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/30">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Eye size={12} className="text-purple-600" />
                                    <span className="text-xs font-medium text-muted-foreground">Views</span>
                                </div>
                                <div className="text-base font-bold text-foreground">
                                    {prop.views || 0}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/30">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Users size={12} className="text-blue-600" />
                                    <span className="text-xs font-medium text-muted-foreground">Favorites</span>
                                </div>
                                <div className="text-base font-bold text-foreground">
                                    {prop.favoritesCount || 0}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 rounded-xl p-3 border border-orange-200/50 dark:border-orange-800/30">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar size={12} className="text-orange-600" />
                                    <span className="text-xs font-medium text-muted-foreground">Days</span>
                                </div>
                                <div className="text-base font-bold text-foreground">
                                    {daysListed}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                            {prop.views > 100 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
                                    <TrendingUp size={12} />
                                    High Views
                                </span>
                            )}
                            {prop.favoritesCount > 10 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                                    <Users size={12} />
                                    Popular
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{prop.propertyType}</span>
                            {prop.bedrooms && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{prop.bedrooms} bed</span>
                            )}
                            {prop.furnishing && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full capitalize">{prop.furnishing}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});


const PropertiesSection = React.memo(function PropertiesSection({ 
    properties, 
    onToggleStatus, 
    onDeleteProperty, 
    isLoading = false,
    error = null,
    onRetry
}) {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [operationLoading, setOperationLoading] = useState({});

    const handleToggleStatus = useCallback(async (propertyId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        setOperationLoading(prev => ({ ...prev, [propertyId]: 'toggle' }));
        setActiveDropdown(null);
        
        try {
            if (onToggleStatus) {
                await onToggleStatus(propertyId, newStatus);
            }
        } catch (error) {
            console.error('Toggle status error:', error);
        } finally {
            setOperationLoading(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
            });
        }
    }, [onToggleStatus]);

    const handleDeleteProperty = useCallback(async (propertyId) => {
        if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }
        
        setOperationLoading(prev => ({ ...prev, [propertyId]: 'delete' }));
        setActiveDropdown(null);
        
        try {
            if (onDeleteProperty) {
                await onDeleteProperty(propertyId);
            }
        } catch (error) {
            console.error('Delete property error:', error);
        } finally {
            setOperationLoading(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
            });
        }
    }, [onDeleteProperty]);

    // Filter and sort properties
    const filteredAndSortedProperties = useMemo(() => {
        if (!properties) return [];

        let filtered = properties;
        if (filterStatus !== 'all') {
            filtered = properties.filter(prop => prop.status === filterStatus);
        }

        const sorted = [...filtered].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'title':
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
                    break;
                case 'views':
                    aValue = a.views || 0;
                    bValue = b.views || 0;
                    break;
                case 'monthlyRent':
                    aValue = a.monthlyRent || 0;
                    bValue = b.monthlyRent || 0;
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt || 0);
                    bValue = new Date(b.createdAt || 0);
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

        return sorted;
    }, [properties, filterStatus, sortBy, sortOrder]);

    if (isLoading && (!properties || properties.length === 0)) {
        return <PropertiesSectionSkeleton />;
    }

    return (
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
            <LoadingOverlay 
                isVisible={isLoading && properties && properties.length > 0}
                text="Updating properties..."
                backdrop={false}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                        <Home size={16} className="text-primary sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">Your Properties</h3>
                        <p className="text-xs text-muted-foreground hidden sm:block">Manage your listings</p>
                    </div>
                </div>
                {properties && properties.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                        {filteredAndSortedProperties.length}/{properties.length}
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4">
                {/* Error state */}
                {error && (
                    <div className="mb-3 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-destructive">{error}</span>
                            {onRetry && (
                                <button onClick={onRetry} className="text-xs text-destructive hover:text-destructive/80 font-medium">
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter and Sort Controls */}
                {properties && properties.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-1.5 flex-1">
                            <Filter size={12} className="text-muted-foreground flex-shrink-0" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-xs bg-card border border-border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground flex-1 min-w-0"
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 flex-1">
                            <ArrowUpDown size={12} className="text-muted-foreground flex-shrink-0" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs bg-card border border-border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground flex-1 min-w-0"
                            >
                                <option value="createdAt">Date</option>
                                <option value="title">Title</option>
                                <option value="views">Views</option>
                                <option value="monthlyRent">Rent</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="text-xs px-1.5 py-1 bg-card border border-border rounded hover:bg-muted transition-colors"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                )}

                {properties && properties.length > 0 ? (
                    filteredAndSortedProperties.length > 0 ? (
                        <div className="space-y-2">
                            {filteredAndSortedProperties.map((prop) => (
                                <PropertyCard
                                    key={prop._id}
                                    prop={prop}
                                    onToggleStatus={handleToggleStatus}
                                    onDeleteProperty={handleDeleteProperty}
                                    operationLoading={operationLoading}
                                    activeDropdown={activeDropdown}
                                    setActiveDropdown={setActiveDropdown}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                                <Filter size={18} className="text-muted-foreground" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground mb-1">No matches</h4>
                            <p className="text-xs text-muted-foreground mb-2">Try adjusting your filters</p>
                            <button
                                onClick={() => {
                                    setFilterStatus('all');
                                    setSortBy('createdAt');
                                    setSortOrder('desc');
                                }}
                                className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    )
                ) : (
                    <div className="text-center py-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Building2 size={24} className="text-primary" />
                        </div>
                        <h4 className="text-base font-semibold text-foreground mb-1">No properties yet</h4>
                        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">Start by posting your first property</p>
                        <Link 
                            to="/post-property" 
                            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm"
                        >
                            Post Property
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
});

export default PropertiesSection;
