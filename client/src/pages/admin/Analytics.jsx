import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { authenticatedFetch, getHeaders } from "../../lib/api";
import {
    TrendingUp,
    IndianRupee,
    CreditCard,
    Percent,
    Users,
    MapPin,
    Grid,
    RefreshCw,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

import RevenueChart from "../../components/admin/RevenueChart";
import UserFunnelChart from "../../components/admin/UserFunnelChart";
import GeographicHeatMap from "../../components/admin/GeographicHeatMap";
import CohortRetentionTable from "../../components/admin/CohortRetentionTable";
import TransactionTable from "../../components/admin/TransactionTable";

const API_BASE = "/api/admin/analytics";

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);
};

// Custom Sparkline generator
const Sparkline = ({ data, strokeColor = "hsl(var(--primary))" }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const points = data
        .map((val, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * (height - 6) - 3;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg className="w-24 h-8 shrink-0 select-none" viewBox={`0 0 ${width} ${height}`}>
            <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

export default function Analytics() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshing, setRefreshing] = useState(false);

    // KPI stats state
    const [kpis, setKpis] = useState(null);
    const [kpisLoading, setKpisLoading] = useState(true);
    const [kpisError, setKpisError] = useState(null);

    // Timeseries data state
    const [revenueData, setRevenueData] = useState([]);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [revenueError, setRevenueError] = useState(null);
    const [period, setPeriod] = useState("30d");

    // Funnel state
    const [funnelData, setFunnelData] = useState([]);
    const [funnelLoading, setFunnelLoading] = useState(true);
    const [funnelError, setFunnelError] = useState(null);

    // Geographic state
    const [geoData, setGeoData] = useState([]);
    const [geoLoading, setGeoLoading] = useState(true);
    const [geoError, setGeoError] = useState(null);

    // Cohort state
    const [cohortData, setCohortData] = useState([]);
    const [cohortLoading, setCohortLoading] = useState(true);
    const [cohortError, setCohortError] = useState(null);

    // Transactions list state
    const [transactions, setTransactions] = useState([]);
    const [txnPagination, setTxnPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [txnFilters, setTxnFilters] = useState({ search: "", status: "all", type: "all" });
    const [txnLoading, setTxnLoading] = useState(true);
    const [txnError, setTxnError] = useState(null);

    // Fetch KPIs
    const fetchKPIs = useCallback(async () => {
        try {
            setKpisLoading(true);
            setKpisError(null);
            const response = await authenticatedFetch(`${API_BASE}/kpis`, { headers: getHeaders() }, navigate);
            const res = await response.json();
            if (res.success) {
                setKpis(res.data);
            } else {
                throw new Error(res.message || "Failed to load headline KPIs");
            }
        } catch (err) {
            setKpisError(err.message);
        } finally {
            setKpisLoading(false);
        }
    }, [navigate]);

    // Fetch Revenue Timeseries
    const fetchRevenue = useCallback(async (selectedPeriod) => {
        try {
            setRevenueLoading(true);
            setRevenueError(null);
            const response = await authenticatedFetch(
                `${API_BASE}/revenue?period=${selectedPeriod}`,
                { headers: getHeaders() },
                navigate
            );
            const res = await response.json();
            if (res.success) {
                setRevenueData(res.data);
            } else {
                throw new Error(res.message || "Failed to load revenue charts");
            }
        } catch (err) {
            setRevenueError(err.message);
        } finally {
            setRevenueLoading(false);
        }
    }, [navigate]);

    // Fetch User Funnel
    const fetchFunnel = useCallback(async () => {
        try {
            setFunnelLoading(true);
            setFunnelError(null);
            const response = await authenticatedFetch(`${API_BASE}/funnel`, { headers: getHeaders() }, navigate);
            const res = await response.json();
            if (res.success) {
                setFunnelData(res.data);
            } else {
                throw new Error(res.message || "Failed to load user funnel");
            }
        } catch (err) {
            setFunnelError(err.message);
        } finally {
            setFunnelLoading(false);
        }
    }, [navigate]);

    // Fetch Geographics
    const fetchGeo = useCallback(async () => {
        try {
            setGeoLoading(true);
            setGeoError(null);
            const response = await authenticatedFetch(`${API_BASE}/geographic`, { headers: getHeaders() }, navigate);
            const res = await response.json();
            if (res.success) {
                setGeoData(res.data);
            } else {
                throw new Error(res.message || "Failed to load geographic data");
            }
        } catch (err) {
            setGeoError(err.message);
        } finally {
            setGeoLoading(false);
        }
    }, [navigate]);

    // Fetch Cohorts
    const fetchCohort = useCallback(async () => {
        try {
            setCohortLoading(true);
            setCohortError(null);
            const response = await authenticatedFetch(`${API_BASE}/cohort`, { headers: getHeaders() }, navigate);
            const res = await response.json();
            if (res.success) {
                setCohortData(res.data);
            } else {
                throw new Error(res.message || "Failed to compute user retention cohorts");
            }
        } catch (err) {
            setCohortError(err.message);
        } finally {
            setCohortLoading(false);
        }
    }, [navigate]);

    // Fetch Transactions
    const fetchTransactions = useCallback(async (page = 1, currentFilters = txnFilters) => {
        try {
            setTxnLoading(true);
            setTxnError(null);
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: txnPagination.limit.toString()
            });

            if (currentFilters.search) params.append("search", currentFilters.search);
            if (currentFilters.status && currentFilters.status !== "all") params.append("status", currentFilters.status);
            if (currentFilters.type && currentFilters.type !== "all") params.append("type", currentFilters.type);

            const response = await authenticatedFetch(`${API_BASE}/transactions?${params}`, { headers: getHeaders() }, navigate);
            const res = await response.json();
            if (res.success) {
                setTransactions(res.data.transactions);
                setTxnPagination(res.data.pagination);
            } else {
                throw new Error(res.message || "Failed to list transactions");
            }
        } catch (err) {
            setTxnError(err.message);
        } finally {
            setTxnLoading(false);
        }
    }, [navigate, txnFilters, txnPagination.limit]);

    // Initial loading of active tabs
    useEffect(() => {
        fetchKPIs();
        fetchRevenue(period);
        fetchFunnel();
        fetchGeo();
        fetchCohort();
        fetchTransactions(1);
    }, []);

    // Fetch revenue whenever period state triggers
    useEffect(() => {
        fetchRevenue(period);
    }, [period]);

    // Refresh dashboard handler
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchKPIs(),
            fetchRevenue(period),
            fetchFunnel(),
            fetchGeo(),
            fetchCohort(),
            fetchTransactions(1)
        ]);
        setRefreshing(false);
    };

    const handleFilterChange = (key, val) => {
        let updated;
        if (key === "clear") {
            updated = { search: "", status: "all", type: "all" };
        } else {
            updated = { ...txnFilters, [key]: val };
        }
        setTxnFilters(updated);
        fetchTransactions(1, updated);
    };

    const handlePageChange = (newPage) => {
        fetchTransactions(newPage);
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Financial & Business Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                        Analyze revenues, conversions, retention rates, and transaction records
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-10 border-border/80 self-end sm:self-auto"
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                    Refresh Stats
                </Button>
            </div>

            {/* Headline KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* MRR Card */}
                <Card className="border border-border/80 shadow-xs relative overflow-hidden bg-card">
                    <CardContent className="p-4 pt-5">
                        {kpisLoading ? (
                            <div className="h-16 animate-pulse bg-muted/30 rounded-md" />
                        ) : kpisError ? (
                            <div className="h-16 flex items-center justify-center text-xs text-destructive">Error Loading KPIs</div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Monthly Rev (MRR)</span>
                                    <span className="text-2xl font-black text-foreground">{formatCurrency(kpis?.mrr)}</span>
                                    <span className="text-xs font-semibold flex items-center gap-0.5 mt-1 text-success">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                        {kpis?.mrrDelta}
                                    </span>
                                </div>
                                <Sparkline data={kpis?.sparkline} strokeColor="hsl(var(--primary))" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ARR Card */}
                <Card className="border border-border/80 shadow-xs relative overflow-hidden bg-card">
                    <CardContent className="p-4 pt-5">
                        {kpisLoading ? (
                            <div className="h-16 animate-pulse bg-muted/30 rounded-md" />
                        ) : kpisError ? (
                            <div className="h-16 flex items-center justify-center text-xs text-destructive">Error Loading KPIs</div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Annualized Rev (ARR)</span>
                                    <span className="text-2xl font-black text-foreground">{formatCurrency(kpis?.arr)}</span>
                                    <span className="text-xs font-semibold flex items-center gap-0.5 mt-1 text-success">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                        {kpis?.arrDelta}
                                    </span>
                                </div>
                                <Sparkline data={kpis?.sparkline} strokeColor="hsl(var(--success))" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ATV Card */}
                <Card className="border border-border/80 shadow-xs relative overflow-hidden bg-card">
                    <CardContent className="p-4 pt-5">
                        {kpisLoading ? (
                            <div className="h-16 animate-pulse bg-muted/30 rounded-md" />
                        ) : kpisError ? (
                            <div className="h-16 flex items-center justify-center text-xs text-destructive">Error Loading KPIs</div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Avg Ticket Value</span>
                                    <span className="text-2xl font-black text-foreground">{formatCurrency(kpis?.avgTxnValue)}</span>
                                    <span className="text-xs font-semibold flex items-center gap-0.5 mt-1 text-success">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                        {kpis?.avgTxnDelta}
                                    </span>
                                </div>
                                <Sparkline data={kpis?.sparkline?.map(v => v * 0.9)} strokeColor="hsl(var(--warning))" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Paid Users Card */}
                <Card className="border border-border/80 shadow-xs relative overflow-hidden bg-card">
                    <CardContent className="p-4 pt-5">
                        {kpisLoading ? (
                            <div className="h-16 animate-pulse bg-muted/30 rounded-md" />
                        ) : kpisError ? (
                            <div className="h-16 flex items-center justify-center text-xs text-destructive">Error Loading KPIs</div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Paid Subscribers</span>
                                    <span className="text-2xl font-black text-foreground">{kpis?.activePaidUsers}</span>
                                    <span className="text-xs font-semibold flex items-center gap-0.5 mt-1 text-success">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                                        {kpis?.paidUsersDelta}
                                    </span>
                                </div>
                                <Sparkline data={kpis?.sparkline?.map(v => v * 0.7)} strokeColor="hsl(var(--accent))" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Custom Tab selectors */}
            <div className="flex gap-1.5 border-b border-border/60 pb-px">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px outline-none",
                        activeTab === "overview"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <TrendingUp className="h-4 w-4" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("geographics")}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px outline-none",
                        activeTab === "geographics"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <MapPin className="h-4 w-4" />
                    Geographics Map
                </button>
                <button
                    onClick={() => setActiveTab("retention")}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px outline-none",
                        activeTab === "retention"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Grid className="h-4 w-4" />
                    Retention Cohorts
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px outline-none",
                        activeTab === "logs"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    <CreditCard className="h-4 w-4" />
                    Transaction Logs
                </button>
            </div>

            {/* Active Tab Panel */}
            <div className="mt-4">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
                        <RevenueChart
                            data={revenueData}
                            period={period}
                            onPeriodChange={setPeriod}
                            loading={revenueLoading}
                            error={revenueError}
                        />
                        <UserFunnelChart
                            data={funnelData}
                            loading={funnelLoading}
                            error={funnelError}
                        />
                    </div>
                )}

                {activeTab === "geographics" && (
                    <GeographicHeatMap
                        data={geoData}
                        loading={geoLoading}
                        error={geoError}
                    />
                )}

                {activeTab === "retention" && (
                    <CohortRetentionTable
                        data={cohortData}
                        loading={cohortLoading}
                        error={cohortError}
                    />
                )}

                {activeTab === "logs" && (
                    <TransactionTable
                        transactions={transactions}
                        pagination={txnPagination}
                        loading={txnLoading}
                        error={txnError}
                        filters={txnFilters}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                        onRefresh={() => fetchTransactions(txnPagination.page)}
                    />
                )}
            </div>
        </div>
    );
}
