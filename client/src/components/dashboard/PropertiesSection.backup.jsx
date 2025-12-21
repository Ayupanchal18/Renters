import React, { useState, useCallback, useMemo } from "react";
import { Eye, MapPin, Edit2, MoreVertical, ToggleLeft, ToggleRight, Trash2, TrendingUp, Users, Calendar, Loader2, Filter, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { usePropertySync } from "../../hooks/usePropertySync";
import { PropertiesSectionSkeleton } from "../ui/skeleton-loaders";
import { LoadingOverlay, InlineLoading } from "../ui/loading-states";
import { useOptimisticProperties } from "../../utils/optimisticUpdates";

// Memoized PropertyCard component for better performance
const PropertyCard = React.memo(function PropertyCard({ 
    prop, 
    onToggleStatus, 
    onDeleteProperty, 
    operationLoading, 
    hasPendingUpdates, 
    hasOptimisticUpdates,
    activeDropdown,
    setActiveDropdown 
}) {
    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50';
            case 'inactive': return 'text-yellow-600 bg-yellow-50';
            case 'blocked': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
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
            className="group border border-gray-200 hover:border-primary rounded-lg p-6 transition-all hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    {(prop.photos && prop.photos[0]) && (
                        <img
                            src={prop.photos[0] || "/placeholder.svg"}
                            alt={prop.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            loading="lazy"
                        />
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 text-lg truncate pr-2">
                                    {prop.title}
                                </h4>
                                {(hasPendingUpdates(prop._id) || hasOptimisticUpdates(prop._id) || operationLoading[prop._id]) && (
                                    <div className="flex items-center gap-1">
                                        <Loader2 size={16} className="text-blue-500 animate-spin" />
                                        {operationLoading[prop._id] && (
                                            <span className="text-xs text-blue-600">
                                                {operationLoading[prop._id] === 'toggle' ? 'Updating...' : 'Deleting...'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prop.status)} ${prop._isOptimistic ? 'opacity-70' : ''}`}>
                                {prop.status}
                                {prop._isOptimistic && (
                                    <span className="ml-1 text-xs">•</span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{prop.city || "Unknown"}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>{prop.views || 0} views</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>Listed {formatDate(prop.createdAt)}</span>
                            </div>
                        </div>

                        {/* Property Performance Metrics */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={14} className="text-green-600" />
                                    <span className="text-xs font-medium text-gray-600">Monthly Rent</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                    ₹{prop.monthlyRent?.toLocaleString() || 'N/A'}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye size={14} className="text-purple-600" />
                                    <span className="text-xs font-medium text-gray-600">Total Views</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                    {prop.views || 0}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={14} className="text-blue-600" />
                                    <span className="text-xs font-medium text-gray-600">Favorites</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                    {prop.favoritesCount || 0}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={14} className="text-orange-600" />
                                    <span className="text-xs font-medium text-gray-600">Days Listed</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.floor((new Date() - new Date(prop.createdAt)) / (1000 * 60 * 60 * 24)) || 0}
                                </div>
                            </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="flex items-center gap-4 mb-3">
                            {prop.views > 100 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    <TrendingUp size={12} />
                                    High Views
                                </span>
                            )}
                            {prop.favoritesCount > 10 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    <Users size={12} />
                                    Popular
                                </span>
                            )}
                            {prop.status === 'active' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    ● Active Listing
                                </span>
                            )}
                        </div>

                        {/* Property Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{prop.propertyType}</span>
                            {prop.bedrooms && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <span>{prop.bedrooms} {prop.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
                                </>
                            )}
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{prop.furnishing}</span>
                        </div>
                    </div>
                </div>

                {/* Action Menu */}
                <div className="relative">
                    <button
                        onClick={handleDropdownToggle}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={operationLoading[prop._id]}
                    >
                        {operationLoading[prop._id] ? (
                            <Loader2 size={16} className="text-gray-400 animate-spin" />
                        ) : (
                            <MoreVertical size={16} className="text-gray-600" />
                        )}
                    </button>

                    {activeDropdown === prop._id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                                <Link
                                    to={`/properties/${prop._id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={() => setActiveDropdown(null)}
                                >
                                    <Edit2 size={14} />
                                    View Details
                                </Link>

                                <button
                                    onClick={handleToggleClick}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left disabled:opacity-50"
                                    disabled={operationLoading[prop._id]}
                                >
                                    {operationLoading[prop._id] === 'toggle' ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Updating...
                                        </>
                                    ) : prop.status === 'active' ? (
                                        <>
                                            <ToggleLeft size={14} />
                                            Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <ToggleRight size={14} />
                                            Activate
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleDeleteClick}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
                                    disabled={operationLoading[prop._id]}
                                >
                                    {operationLoading[prop._id] === 'delete' ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            Delete Property
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
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
    
    const { hasPendingUpdates } = usePropertySync();
    
    // Use optimistic updates for better UX
    const {
        properties: optimisticProperties,
        togglePropertyStatus,
        deleteProperty,
        hasPendingUpdates: hasOptimisticUpdates
    } = useOptimisticProperties(properties || []);

    const handleToggleStatus = useCallback(async (propertyId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        setOperationLoading(prev => ({ ...prev, [propertyId]: 'toggle' }));
        setActiveDropdown(null);
        
        try {
            if (onToggleStatus) {
                await togglePropertyStatus(propertyId, newStatus, onToggleStatus);
            }
        } catch (error) {
            // Error handling is done in optimistic update hook
        } finally {
            setOperationLoading(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
            });
        }
    }, [onToggleStatus, togglePropertyStatus]);

    const handleDeleteProperty = useCallback(async (propertyId) => {
        if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }
        
        setOperationLoading(prev => ({ ...prev, [propertyId]: 'delete' }));
        setActiveDropdown(null);
        
        try {
            if (onDeleteProperty) {
                await deleteProperty(propertyId, onDeleteProperty);
            }
        } catch (error) {
            // Error handling is done in optimistic update hook
        } finally {
            setOperationLoading(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
            });
        }
    }, [onDeleteProperty, deleteProperty]);



    // Filter and sort properties (use optimistic properties) - memoized for performance
    const filteredAndSortedProperties = useMemo(() => {
        if (!optimisticProperties) return [];

        // Filter by status
        let filtered = optimisticProperties;
        if (filterStatus !== 'all') {
            filtered = optimisticProperties.filter(prop => prop.status === filterStatus);
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
    }, [optimisticProperties, filterStatus, sortBy, sortOrder]);

    // Show skeleton loader when loading
    if (isLoading && (!optimisticProperties || optimisticProperties.length === 0)) {
        return <PropertiesSectionSkeleton />;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 relative">
            {/* Loading overlay for operations */}
            <LoadingOverlay 
                isVisible={isLoading && optimisticProperties && optimisticProperties.length > 0}
                text="Updating properties..."
                backdrop={false}
            />
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">Your Properties</h3>
                    {isLoading && (
                        <InlineLoading text="Loading..." size="sm" />
                    )}
                </div>
                {optimisticProperties && optimisticProperties.length > 0 && (
                    <div className="text-sm text-gray-600">
                        {filteredAndSortedProperties.length} of {optimisticProperties.length} {optimisticProperties.length === 1 ? 'property' : 'properties'}
                    </div>
                )}
            </div>

            {/* Error state */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-red-800">{error}</span>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filter and Sort Controls */}
            {optimisticProperties && optimisticProperties.length > 0 && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Filter:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="createdAt">Date Created</option>
                            <option value="title">Title</option>
                            <option value="views">Views</option>
                            <option value="monthlyRent">Rent</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="text-sm px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            )}

            {optimisticProperties && optimisticProperties.length > 0 ? (
                filteredAndSortedProperties.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAndSortedProperties.map((prop) => (
                            <PropertyCard
                                key={prop._id}
                                prop={prop}
                                onToggleStatus={handleToggleStatus}
                                onDeleteProperty={handleDeleteProperty}
                                operationLoading={operationLoading}
                                hasPendingUpdates={hasPendingUpdates}
                                hasOptimisticUpdates={hasOptimisticUpdates}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Filter size={24} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No properties match your filters</h4>
                        <p className="text-gray-600 mb-4">Try adjusting your filter criteria to see more properties</p>
                        <button
                            onClick={() => {
                                setFilterStatus('all');
                                setSortBy('createdAt');
                                setSortOrder('desc');
                            }}
                            className="text-primary hover:text-primary/80 font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin size={24} className="text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h4>
                    <p className="text-gray-600 mb-6">Start building your rental portfolio by posting your first property</p>
                    <Link 
                        to="/post-property" 
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Post your first property
                    </Link>
                </div>
            )}
        </div>
    );
});

export default PropertiesSection;
