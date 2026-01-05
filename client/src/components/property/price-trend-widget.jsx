/**
 * Price Trend Widget Component
 * Shows neighborhood price statistics and comparison for a property
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Info, Loader2 } from 'lucide-react';

export default function PriceTrendWidget({ 
    city, 
    category, 
    currentPrice, 
    listingType = 'rent' 
}) {
    const [data, setData] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!city) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch trend data
                const trendParams = new URLSearchParams({
                    city,
                    listingType,
                    months: '6'
                });
                if (category) trendParams.append('category', category);

                const trendRes = await fetch(`/api/price-trends?${trendParams}`);
                const trendJson = await trendRes.json();

                if (trendJson.success && !trendJson.data.noData) {
                    setData(trendJson.data);
                }

                // Fetch price comparison if currentPrice is provided
                if (currentPrice && currentPrice > 0) {
                    const compareParams = new URLSearchParams({
                        city,
                        price: currentPrice.toString(),
                        listingType
                    });
                    if (category) compareParams.append('category', category);

                    const compareRes = await fetch(`/api/price-trends/compare?${compareParams}`);
                    const compareJson = await compareRes.json();

                    if (compareJson.success && !compareJson.data.noData) {
                        setComparison(compareJson.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching price trends:', err);
                setError('Unable to load price data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [city, category, currentPrice, listingType]);

    if (!city) return null;

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Loading price trends...</span>
                </div>
            </div>
        );
    }

    if (error || (!data && !comparison)) {
        return null; // Silently fail - don't show widget if no data
    }

    const priceLabel = listingType === 'buy' ? 'Price' : 'Rent';
    const formatPrice = (price) => {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
        if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
        return `₹${price}`;
    };

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'excellent': return 'text-green-600 bg-green-50 dark:bg-green-900/30';
            case 'good': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
            case 'fair': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
            case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/30';
            default: return 'text-slate-600 bg-slate-50 dark:bg-slate-700';
        }
    };

    const getRatingLabel = (rating) => {
        switch (rating) {
            case 'excellent': return 'Excellent Value';
            case 'good': return 'Good Value';
            case 'fair': return 'Fair Price';
            case 'high': return 'Above Market';
            default: return 'Market Rate';
        }
    };

    // Simple bar chart component
    const SimpleTrendChart = ({ trends }) => {
        if (!trends || trends.length < 2) return null;
        
        const maxPrice = Math.max(...trends.map(t => t.avgPrice));
        const minPrice = Math.min(...trends.map(t => t.avgPrice));
        const range = maxPrice - minPrice || 1;

        return (
            <div className="flex items-end gap-1 h-16">
                {trends.map((trend, idx) => {
                    const height = ((trend.avgPrice - minPrice) / range * 60) + 20; // 20-80% height
                    const month = trend.month.split('-')[1];
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                            <div 
                                className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                                style={{ height: `${height}%` }}
                                title={`${trend.month}: ${formatPrice(trend.avgPrice)}`}
                            />
                            <span className="text-[10px] text-slate-400 mt-1">{month}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {priceLabel} Insights for {city}
                    </h3>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Price Comparison Badge */}
                {comparison && (
                    <div className={`rounded-lg p-3 ${getRatingColor(comparison.priceRating)}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {comparison.diffPercent < 0 ? (
                                    <TrendingDown className="w-5 h-5" />
                                ) : comparison.diffPercent > 0 ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <Minus className="w-5 h-5" />
                                )}
                                <span className="font-semibold text-sm">
                                    {getRatingLabel(comparison.priceRating)}
                                </span>
                            </div>
                            <span className="text-sm font-medium">
                                {Math.abs(comparison.diffPercent)}% {comparison.diffPercent >= 0 ? 'above' : 'below'} avg
                            </span>
                        </div>
                        <p className="text-xs mt-1 opacity-80">
                            Compared to {comparison.comparedTo} similar properties in {city}
                        </p>
                    </div>
                )}

                {/* Statistics Grid */}
                {data && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Avg {priceLabel}</p>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {formatPrice(data.averagePrice)}
                            </p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Low</p>
                            <p className="font-bold text-green-600 text-sm">
                                {formatPrice(data.priceRange.min)}
                            </p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400">High</p>
                            <p className="font-bold text-red-600 text-sm">
                                {formatPrice(data.priceRange.max)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Simple Trend Chart */}
                {data && data.trends && data.trends.length > 1 && (
                    <div className="mt-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {priceLabel} Trend (Last 6 Months)
                        </p>
                        <SimpleTrendChart trends={data.trends} />
                    </div>
                )}

                {/* Info Footer */}
                <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-400">
                        Based on {data?.totalListings || 0} listings in {city}
                        {category ? ` (${category})` : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}

