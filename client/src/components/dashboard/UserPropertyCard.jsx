import { Eye, MapPin, Edit2, MoreVertical, ToggleLeft, ToggleRight, Trash2, TrendingUp, Users, Calendar, Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function UserPropertyCard({ 
    property, 
    onToggleStatus, 
    onDeleteProperty,
    variant = "default" // "default", "compact", "detailed"
}) {
    const [showDropdown, setShowDropdown] = useState(false);

    const handleToggleStatus = async () => {
        const newStatus = property.status === 'active' ? 'inactive' : 'active';
        if (onToggleStatus) {
            await onToggleStatus(property._id, newStatus);
        }
        setShowDropdown(false);
    };

    const handleDeleteProperty = async () => {
        if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            if (onDeleteProperty) {
                await onDeleteProperty(property._id);
            }
        }
        setShowDropdown(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50 border-green-200';
            case 'inactive': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'blocked': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getPerformanceIndicator = () => {
        const viewsPerDay = property.views / Math.max(1, Math.ceil((Date.now() - new Date(property.createdAt)) / (1000 * 60 * 60 * 24)));
        
        if (viewsPerDay > 5) return { label: 'High Performance', color: 'text-green-600', icon: '📈' };
        if (viewsPerDay > 2) return { label: 'Good Performance', color: 'text-blue-600', icon: '📊' };
        if (viewsPerDay > 0.5) return { label: 'Average Performance', color: 'text-yellow-600', icon: '📉' };
        return { label: 'Low Performance', color: 'text-red-600', icon: '📉' };
    };

    if (variant === "compact") {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {property.photos && property.photos[0] && (
                            <img
                                src={property.photos[0]}
                                alt={property.title}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 truncate">{property.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Eye size={12} />
                                <span>{property.views || 0}</span>
                                <span className="text-gray-400">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(property.status)}`}>
                                    {property.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Link
                        to={`/properties/${property._id}`}
                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                    >
                        <Edit2 size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    const performance = getPerformanceIndicator();

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {property.photos && property.photos[0] && (
                        <div className="relative">
                            <img
                                src={property.photos[0]}
                                alt={property.title}
                                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                            {property.featured && (
                                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                    <Star size={12} className="text-white" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg truncate pr-2">
                                {property.title}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}>
                                {property.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{property.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>Listed {formatDate(property.createdAt)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <span className={`${performance.color} font-medium`}>
                                {performance.icon} {performance.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical size={16} className="text-gray-600" />
                    </button>

                    {showDropdown && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                <div className="py-1">
                                    <Link
                                        to={`/properties/${property._id}`}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <Edit2 size={14} />
                                        View Details
                                    </Link>

                                    <button
                                        onClick={handleToggleStatus}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                    >
                                        {property.status === 'active' ? (
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
                                        onClick={handleDeleteProperty}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        <Trash2 size={14} />
                                        Delete Property
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Property Performance Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-green-600" />
                        <span className="text-xs font-medium text-green-700">Rent</span>
                    </div>
                    <div className="text-sm font-bold text-green-900">
                        ₹{property.monthlyRent?.toLocaleString() || 'N/A'}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Favorites</span>
                    </div>
                    <div className="text-sm font-bold text-blue-900">
                        {property.favoritesCount || 0}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Eye size={14} className="text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">Views</span>
                    </div>
                    <div className="text-sm font-bold text-purple-900">
                        {property.views || 0}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Inquiries</span>
                    </div>
                    <div className="text-sm font-bold text-orange-900">
                        {Math.floor((property.views || 0) * 0.1)} {/* Estimated inquiries */}
                    </div>
                </div>
            </div>

            {/* Property Details */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{property.propertyType}</span>
                    {property.bedrooms && (
                        <>
                            <span className="text-gray-400">•</span>
                            <span>{property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
                        </>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{property.furnishing}</span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        to={`/properties/${property._id}`}
                        className="flex items-center gap-1 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Edit2 size={14} />
                        Edit
                    </Link>
                    
                    <button
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            property.status === 'active' 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                        }`}
                    >
                        {property.status === 'active' ? (
                            <>
                                <ToggleLeft size={14} />
                                Pause
                            </>
                        ) : (
                            <>
                                <ToggleRight size={14} />
                                Activate
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}