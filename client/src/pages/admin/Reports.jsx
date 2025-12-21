import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  FileText,
  Download,
  Users,
  Building2,
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileJson,
  Loader2,
  BarChart3,
  TrendingUp,
  X
} from 'lucide-react';

/**
 * Reports Page
 * 
 * Admin page for generating reports and exporting data with:
 * - User report generation with filters
 * - Property report generation with filters
 * - Activity/Audit log export
 * - CSV and JSON export formats
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

const API_BASE = '/api/admin/reports';

// Report type configurations
const REPORT_TYPES = {
  users: {
    title: 'User Report',
    description: 'Generate reports on user accounts, roles, and activity',
    icon: Users,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    filters: ['dateRange', 'role', 'status', 'includeDeleted']
  },
  properties: {
    title: 'Property Report',
    description: 'Generate reports on property listings, status, and pricing',
    icon: Building2,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    filters: ['dateRange', 'city', 'category', 'status', 'priceRange', 'includeDeleted']
  },
  activity: {
    title: 'Activity Report',
    description: 'Export audit logs and admin activity records',
    icon: Activity,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    filters: ['dateRange', 'action', 'resourceType']
  }
};

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'owner', label: 'Owner' },
  { value: 'agent', label: 'Agent' },
  { value: 'seller', label: 'Seller' },
  { value: 'admin', label: 'Admin' }
];

const USER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' }
];

const PROPERTY_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'rented', label: 'Rented' },
  { value: 'sold', label: 'Sold' },
  { value: 'expired', label: 'Expired' }
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'room', label: 'Room' },
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'pg', label: 'PG' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'commercial', label: 'Commercial' }
];

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
    <div className={cn('p-3 rounded-lg', color)}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  </div>
);

// Report Results Component
const ReportResults = ({ reportType, data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Generate a report to see results</p>
      </div>
    );
  }

  const { records, summary, generatedAt } = data;

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Report Summary</h3>
          <Badge variant="outline">
            Generated: {new Date(generatedAt).toLocaleString()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Records"
            value={summary.totalRecords.toLocaleString()}
            icon={FileText}
            color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          />
          
          {reportType === 'users' && summary.byRole && (
            <>
              <SummaryCard
                title="Active Users"
                value={summary.byStatus?.active?.toLocaleString() || '0'}
                icon={Users}
                color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              />
              <SummaryCard
                title="Blocked Users"
                value={summary.byStatus?.blocked?.toLocaleString() || '0'}
                icon={AlertCircle}
                color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              />
            </>
          )}
          
          {reportType === 'properties' && summary.priceStats && (
            <>
              <SummaryCard
                title="Avg. Price"
                value={`₹${summary.priceStats.avg?.toLocaleString() || '0'}`}
                icon={TrendingUp}
                color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              />
              <SummaryCard
                title="Price Range"
                value={`₹${summary.priceStats.min?.toLocaleString() || '0'} - ₹${summary.priceStats.max?.toLocaleString() || '0'}`}
                icon={BarChart3}
                color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
              />
            </>
          )}
        </div>
      </div>

      {/* Distribution Charts */}
      {reportType === 'users' && summary.byRole && Object.keys(summary.byRole).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byRole).map(([role, count]) => (
                <Badge key={role} variant="secondary" className="text-sm">
                  {role}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'properties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.byCategory && Object.keys(summary.byCategory).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="text-sm">
                      {category}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {summary.byCity && Object.keys(summary.byCity).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.byCity).slice(0, 10).map(([city, count]) => (
                    <Badge key={city} variant="secondary" className="text-sm">
                      {city}: {count}
                    </Badge>
                  ))}
                  {Object.keys(summary.byCity).length > 10 && (
                    <Badge variant="outline" className="text-sm">
                      +{Object.keys(summary.byCity).length - 10} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Records Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Records Preview</CardTitle>
          <CardDescription>
            Showing first {Math.min(records.length, 10)} of {records.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {records.length > 0 && Object.keys(records[0]).slice(0, 6).map(key => (
                    <th key={key} className="text-left py-2 px-3 font-medium text-muted-foreground">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 10).map((record, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {Object.values(record).slice(0, 6).map((value, vidx) => (
                      <td key={vidx} className="py-2 px-3 truncate max-w-[200px]">
                        {String(value || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Reports Component
const Reports = () => {
  const navigate = useNavigate();
  
  // State
  const [activeReport, setActiveReport] = useState('users');
  const [reportData, setReportData] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    role: 'all',
    status: 'all',
    city: '',
    category: 'all',
    priceMin: '',
    priceMax: '',
    action: '',
    resourceType: '',
    includeDeleted: false
  });

  // Fetch report summary on mount
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await authenticatedFetch(`${API_BASE}/summary`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      if (data.success) {
        setReportSummary(data.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Reset filters when report type changes
  useEffect(() => {
    setFilters({
      startDate: '',
      endDate: '',
      role: 'all',
      status: 'all',
      city: '',
      category: 'all',
      priceMin: '',
      priceMax: '',
      action: '',
      resourceType: '',
      includeDeleted: false
    });
    setReportData(null);
    setError(null);
  }, [activeReport]);

  // Build filter params for API
  const buildFilterParams = () => {
    const params = {};
    
    if (filters.startDate) {
      params.startDate = new Date(filters.startDate).toISOString();
    }
    if (filters.endDate) {
      params.endDate = new Date(filters.endDate).toISOString();
    }
    if (filters.role && filters.role !== 'all') {
      params.role = filters.role;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.city) {
      params.city = filters.city;
    }
    if (filters.category && filters.category !== 'all') {
      params.category = filters.category;
    }
    if (filters.priceMin) {
      params.priceMin = Number(filters.priceMin);
    }
    if (filters.priceMax) {
      params.priceMax = Number(filters.priceMax);
    }
    if (filters.action) {
      params.action = filters.action;
    }
    if (filters.resourceType) {
      params.resourceType = filters.resourceType;
    }
    if (filters.includeDeleted) {
      params.includeDeleted = true;
    }
    
    return params;
  };

  // Generate report
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = buildFilterParams();
      
      const response = await authenticatedFetch(`${API_BASE}/${activeReport}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(filterParams)
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export report
  const handleExport = async (format) => {
    try {
      setExporting(true);
      setError(null);
      
      const filterParams = buildFilterParams();
      const queryParams = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filterParams).map(([k, v]) => [k, String(v)])
        )
      });
      
      const response = await authenticatedFetch(
        `${API_BASE}/${activeReport}/export?${queryParams}`,
        { headers: getHeaders() },
        navigate
      );
      
      // Handle file download
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${activeReport}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, filename);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, filename);
      }
    } catch (err) {
      console.error('Error exporting report:', err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Download blob helper
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      role: 'all',
      status: 'all',
      city: '',
      category: 'all',
      priceMin: '',
      priceMax: '',
      action: '',
      resourceType: '',
      includeDeleted: false
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || 
    (filters.role && filters.role !== 'all') || 
    (filters.status && filters.status !== 'all') ||
    filters.city || 
    (filters.category && filters.category !== 'all') ||
    filters.priceMin || filters.priceMax ||
    filters.action || filters.resourceType ||
    filters.includeDeleted;

  const currentReportConfig = REPORT_TYPES[activeReport];
  const ReportIcon = currentReportConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Reports & Exports
          </h1>
          <p className="text-muted-foreground">
            Generate reports and export data in various formats
          </p>
        </div>
        <Button variant="outline" onClick={fetchSummary} disabled={summaryLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', summaryLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(REPORT_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeReport === key;
          const summaryData = reportSummary?.availableReports?.find(r => r.type === key);
          
          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isActive && 'ring-2 ring-primary'
              )}
              onClick={() => setActiveReport(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{config.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {config.description}
                    </p>
                    {summaryLoading ? (
                      <Skeleton className="h-4 w-20 mt-2" />
                    ) : summaryData && (
                      <Badge variant="secondary" className="mt-2">
                        {summaryData.recordCount.toLocaleString()} records
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure filters for your {currentReportConfig.title.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range - Common to all reports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* User Report Filters */}
          {activeReport === 'users' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.includeDeleted}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">Include deleted</span>
                </label>
              </div>
            </div>
          )}

          {/* Property Report Filters */}
          {activeReport === 'properties' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="Enter city name"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.includeDeleted}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">Include deleted</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Activity Report Filters */}
          {activeReport === 'activity' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Input
                  placeholder="e.g., CREATE, UPDATE, DELETE"
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Resource Type</label>
                <Input
                  placeholder="e.g., user, property"
                  value={filters.resourceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4 mr-2" />
                )}
                Export JSON
              </Button>
            </div>
            
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
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

      {/* Report Results */}
      <ReportResults
        reportType={activeReport}
        data={reportData}
        loading={loading}
      />
    </div>
  );
};

export default Reports;
