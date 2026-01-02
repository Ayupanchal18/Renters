import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import StatsCards from '../../components/admin/StatsCards';
import ActivityFeed from '../../components/admin/ActivityFeed';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  RefreshCw,
  TrendingUp,
  Building2,
  MapPin,
  AlertCircle,
  Home,
  ShoppingCart
} from 'lucide-react';

/**
 * Admin Overview Page
 * 
 * Main dashboard page displaying:
 * - Key metrics (users, properties, etc.)
 * - Property distribution charts
 * - Recent activity feed
 */

const API_BASE = '/api/admin/dashboard';

const ChartCard = ({ title, data, loading, icon: Icon }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const entries = Object.entries(data || {}).slice(0, 8);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(([label, value]) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[150px]">
                    {label || 'Unknown'}
                  </span>
                  <span className="font-medium">{value?.toLocaleString() ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        )}
      </CardContent>
    </Card>
  );
};

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/stats`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    }
  }, [navigate]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/activity?limit=10`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActivityLoading(true);
    setError(null);
    
    await Promise.all([
      fetchStats().finally(() => setLoading(false)),
      fetchActivities().finally(() => setActivityLoading(false))
    ]);
  }, [fetchStats, fetchActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds (Requirement 2.5)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchActivities]);

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load dashboard</h2>
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your platform's key metrics and recent activity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Charts and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property Distribution Charts */}
        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
          <ChartCard
            title="Properties by Listing Type"
            data={stats?.properties?.byListingType ? {
              'For Rent': stats.properties.byListingType.rent || 0,
              'For Sale': stats.properties.byListingType.buy || 0
            } : {}}
            loading={loading}
            icon={Home}
          />
          <ChartCard
            title="Properties by City"
            data={stats?.properties?.byCity}
            loading={loading}
            icon={MapPin}
          />
          <ChartCard
            title="Properties by Category"
            data={stats?.properties?.byCategory}
            loading={loading}
            icon={Building2}
          />
          <ChartCard
            title="Properties by Status"
            data={stats?.properties?.byStatus}
            loading={loading}
            icon={TrendingUp}
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={activities}
            loading={activityLoading}
            title="Recent Activity"
            maxItems={8}
            showViewAll={true}
            onViewAll={() => navigate('/admin/audit-logs')}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
