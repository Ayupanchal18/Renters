import React, { useState, useCallback, useMemo } from "react";
import { Eye, MapPin, Edit2, MoreVertical, ToggleLeft, ToggleRight, Trash2, TrendingUp, Users, Calendar, Loader2, Filter, ArrowUpDown, Home, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PropertiesSectionSkeleton } from "../ui/skeleton-loaders";
import { LoadingOverlay, InlineLoading } from "../ui/loading-states";

// Memoized PropertyCard component for better performance
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

    return (
        <div
            key={prop._id}
            className="group bg-card border border-border hover:border-primary/50 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
            {/* Mobile: Title row with status and menu at top */}
            <div className="flex items-center justify-between gap-2 mb-3 sm:hidden">
                <h4 className="font-semibold text-foreground text-base truncate flex-1 min-w-0">
                    {prop.title}
                </h4>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusColor(prop.status)}`}>
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
                        {activeDropdown === prop._id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                                <div className="py-1">
                                    <Link
                                        to={`/properties/${prop._id}`}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                        onClick={() => setActiveDropdown(null)}
                                    >
                                        <Edit2 size={15} className="text-muted-foreground" />
                                        View Details
                                    </Link>
                                    <button
                                        onClick={handleToggleClick}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted w-full text-left disabled:opacity-50 transition-colors"
                                        disabled={operationLoading[prop._id]}
                                    >
                                        {prop.status === 'active' ? (
                                            <>
                                                <ToggleLeft size={15} className="text-warning" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <ToggleRight size={15} className="text-success" />
                                                Activate
                                            </>
                                        )}
                                    </button>
                                    <div className="border-t border-border my-1" />
                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left disabled:opacity-50 transition-colors"
                                        disabled={operationLoading[prop._id]}
                                    >
                                        <Trash2 size={15} />
                                        Delete Property
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-3">
                {(prop.photos && prop.photos[0]) ? (
                    <img
                        src={prop.photos[0]}
                        alt={prop.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0 shadow-sm"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Building2 size={24} className="text-muted-foreground/50 sm:w-8 sm:h-8" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Desktop: Title and Status Row */}
                    <div className="hidden sm:flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-semibold text-foreground text-lg truncate flex-1 min-w-0 pr-2">
                            {prop.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(prop.status)}`}>
                                {prop.status}
                            </span>
                            {/* Desktop Action Menu */}
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
                                {activeDropdown === prop._id && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                                        <div className="py-1">
                                            <Link
                                                to={`/properties/${prop._id}`}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                onClick={() => setActiveDropdown(null)}
                                            >
                                                <Edit2 size={15} className="text-muted-foreground" />
                                                View Details
                                            </Link>
                                            <button
                                                onClick={handleToggleClick}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted w-full text-left disabled:opacity-50 transition-colors"
                                                disabled={operationLoading[prop._id]}
                                            >
                                                {prop.status === 'active' ? (
                                                    <>
                                                        <ToggleLeft size={15} className="text-warning" />
                                                        Deactivate
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleRight size={15} className="text-success" />
                                                        Activate
                                                    </>
                                                )}
                                            </button>
                                            <div className="border-t border-border my-1" />
                                            <button
                                                onClick={handleDeleteClick}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left disabled:opacity-50 transition-colors"
                                                disabled={operationLoading[prop._id]}
                                            >
                                                <Trash2 size={15} />
                                                Delete Property
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mb-4">
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

                    {/* Property Performance Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-4 max-w-xs sm:max-w-none">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-emerald-200/50 dark:border-emerald-800/30 w-full max-w-[80px] sm:max-w-none">
                            <div className="flex items-center gap-0.5 sm:gap-1.5 mb-0.5 sm:mb-1">
                                <TrendingUp size={8} className="text-emerald-600 flex-shrink-0 sm:w-3 sm:h-3" />
                                <span className="text-xs font-medium text-muted-foreground truncate">Rent</span>
                            </div>
                            <div className="text-xs sm:text-base font-bold text-foreground truncate">
                                ₹{prop.monthlyRent?.toLocaleString() || 'N/A'}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-purple-200/50 dark:border-purple-800/30 w-full max-w-[80px] sm:max-w-none">
                            <div className="flex items-center gap-0.5 sm:gap-1.5 mb-0.5 sm:mb-1">
                                <Eye size={8} className="text-purple-600 flex-shrink-0 sm:w-3 sm:h-3" />
                                <span className="text-xs font-medium text-muted-foreground truncate">Views</span>
                            </div>
                            <div className="text-xs sm:text-base font-bold text-foreground">
                                {prop.views || 0}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-blue-200/50 dark:border-blue-800/30 w-full max-w-[80px] sm:max-w-none">
                            <div className="flex items-center gap-0.5 sm:gap-1.5 mb-0.5 sm:mb-1">
                                <Users size={8} className="text-blue-600 flex-shrink-0 sm:w-3 sm:h-3" />
                                <span className="text-xs font-medium text-muted-foreground truncate">Favorites</span>
                            </div>
                            <div className="text-xs sm:text-base font-bold text-foreground">
                                {prop.favoritesCount || 0}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-orange-200/50 dark:border-orange-800/30 w-full max-w-[80px] sm:max-w-none">
                            <div className="flex items-center gap-0.5 sm:gap-1.5 mb-0.5 sm:mb-1">
                                <Calendar size={8} className="text-orange-600 flex-shrink-0 sm:w-3 sm:h-3" />
                                <span className="text-xs font-medium text-muted-foreground truncate">Days</span>
                            </div>
                            <div className="text-xs sm:text-base font-bold text-foreground">
                                {Math.floor((new Date() - new Date(prop.createdAt)) / (1000 * 60 * 60 * 24)) || 0}
                            </div>
                        </div>
                    </div>

                    {/* Performance Indicators & Property Details */}
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

    // Filter and sort properties - memoized for performance
    const filteredAndSortedProperties = useMemo(() => {
        if (!properties) return [];

        // Filter by status
        let filtered = properties;
        if (filterStatus !== 'all') {
            filtered = properties.filter(prop => prop.status === filterStatus);
        }

        // Sort properties
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

    // Show skeleton loader when loading
    if (isLoading && (!properties || properties.length === 0)) {
        return <PropertiesSectionSkeleton />;
    }

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
            {/* Loading overlay for operations */}
            <LoadingOverlay 
                isVisible={isLoading && properties && properties.length > 0}
                text="Updating properties..."
                backdrop={false}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Home size={18} className="text-primary sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-foreground">Your Properties</h3>
                            {isLoading && <InlineLoading text="" size="sm" />}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Manage your listings</p>
                    </div>
                </div>
                {properties && properties.length > 0 && (
                    <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">
                        {filteredAndSortedProperties.length} of {properties.length}
                    </div>
                )}
            </div>

            <div className="p-6">
                {/* Error state */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-destructive">{error}</span>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="text-sm text-destructive hover:text-destructive/80 font-medium"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter and Sort Controls */}
                {properties && properties.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-muted/50 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-sm bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground flex-1 sm:flex-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-sm bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground flex-1 sm:flex-none"
                            >
                                <option value="createdAt">Date</option>
                                <option value="title">Title</option>
                                <option value="views">Views</option>
                                <option value="monthlyRent">Rent</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="text-sm px-2.5 py-1.5 bg-card border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                )}


            {properties && properties.length > 0 ? (
                filteredAndSortedProperties.length > 0 ? (
                    <div className="space-y-4">
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
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Filter size={24} className="text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">No properties match your filters</h4>
                        <p className="text-muted-foreground mb-4">Try adjusting your filter criteria to see more properties</p>
                        <button
                            onClick={() => {
                                setFilterStatus('all');
                                setSortBy('createdAt');
                                setSortOrder('desc');
                            }}
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Building2 size={32} className="text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">No properties yet</h4>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Start building your rental portfolio by posting your first property</p>
                    <Link 
                        to="/post-property" 
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Post your first property
                    </Link>
                </div>
            )}
            </div>
        </div>
    );
});

export default PropertiesSection;
