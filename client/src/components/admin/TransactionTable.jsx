import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    Search,
    CreditCard,
    ArrowLeftRight,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    TrendingDown,
    ShieldCheck,
    AlertCircle
} from "lucide-react";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
};

export default function TransactionTable({
    transactions,
    pagination,
    loading,
    error,
    filters,
    onFilterChange,
    onPageChange,
    onRefresh
}) {
    const [searchVal, setSearchVal] = useState(filters.search || "");

    // Debounced search trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== searchVal) {
                onFilterChange("search", searchVal);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchVal, filters.search]);

    const handleClearFilters = () => {
        setSearchVal("");
        onFilterChange("clear", null);
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: "bg-success/10 text-success border-success/25",
            pending: "bg-warning/10 text-warning border-warning/25",
            failed: "bg-destructive/10 text-destructive border-destructive/25",
            refunded: "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400"
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${styles[status] || "bg-muted text-muted-foreground border-border"}`}>
                {status}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const styles = {
            subscription: "bg-primary/10 text-primary border-primary/20",
            listing_fee: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            featured_boost: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            refund: "bg-rose-500/10 text-rose-500 border-rose-500/20"
        };
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border capitalize ${styles[type] || "bg-muted text-muted-foreground border-border"}`}>
                {type ? type.replace("_", " ") : "Unknown"}
            </span>
        );
    };

    const hasActiveFilters = filters.search || filters.status !== "all" || filters.type !== "all";

    return (
        <Card className="shadow-sm border border-border">
            <CardHeader className="pb-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Transactions History
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Audit trial of subscription payments, boosts, and listing fees
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="h-9">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {/* Search and Filters row */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by transaction ID, customer, or description..."
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            className="pl-9 h-10 bg-card border-border/80 text-sm"
                        />
                    </div>
                    
                    <Select
                        value={filters.status}
                        onValueChange={(val) => onFilterChange("status", val)}
                    >
                        <SelectTrigger className="w-full sm:w-[160px] h-10 border-border/80">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.type}
                        onValueChange={(val) => onFilterChange("type", val)}
                    >
                        <SelectTrigger className="w-full sm:w-[160px] h-10 border-border/80">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="subscription">Subscription</SelectItem>
                            <SelectItem value="listing_fee">Listing Fee</SelectItem>
                            <SelectItem value="featured_boost">Featured Boost</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={handleClearFilters} className="shrink-0 h-10">
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Table Data Grid */}
                {loading ? (
                    <div className="h-[250px] w-full flex items-center justify-center bg-muted/20 border border-border rounded-xl animate-pulse">
                        <span className="text-sm text-muted-foreground">Retrieving payment entries...</span>
                    </div>
                ) : error ? (
                    <div className="h-[250px] w-full flex flex-col items-center justify-center bg-destructive/5 rounded-xl border border-destructive/15">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <span className="text-sm font-medium text-destructive">Failed to fetch transactions</span>
                        <span className="text-xs text-muted-foreground mt-1">{error}</span>
                    </div>
                ) : !transactions || transactions.length === 0 ? (
                    <div className="h-[250px] w-full flex flex-col items-center justify-center bg-muted/10 border border-dashed border-border rounded-xl">
                        <ArrowLeftRight className="h-10 w-10 text-muted-foreground/60 mb-2" />
                        <span className="text-sm font-semibold text-foreground">No Transactions Found</span>
                        <span className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</span>
                    </div>
                ) : (
                    <div className="space-y-4 font-sans">
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full min-w-[950px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="p-3.5 font-bold text-foreground">Transaction ID</th>
                                        <th className="p-3.5 font-bold text-foreground">User Details</th>
                                        <th className="p-3.5 font-bold text-foreground">Type</th>
                                        <th className="p-3.5 font-bold text-foreground">Amount</th>
                                        <th className="p-3.5 font-bold text-foreground">Gateway</th>
                                        <th className="p-3.5 font-bold text-foreground">Date</th>
                                        <th className="p-3.5 font-bold text-foreground">Status</th>
                                        <th className="p-3.5 font-bold text-foreground">Property Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn) => (
                                        <tr key={txn._id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                            <td className="p-3.5 font-mono text-xs text-foreground font-bold">
                                                {txn.gatewayTxnId || txn._id.substring(0, 12).toUpperCase()}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-xs">{txn.userId?.name || "Deleted User"}</span>
                                                    <span className="text-[11px] text-muted-foreground">{txn.userId?.email || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">{getTypeBadge(txn.type)}</td>
                                            <td className="p-3.5 font-bold text-foreground">
                                                {txn.type === "refund" ? "-" : ""}{formatCurrency(txn.amount)}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-success/80" />
                                                    {txn.gateway}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-xs text-muted-foreground font-semibold">
                                                {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </td>
                                            <td className="p-3.5">{getStatusBadge(txn.status)}</td>
                                            <td className="p-3.5">
                                                {txn.propertyId ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground text-xs truncate max-w-[150px]">{txn.propertyId.title}</span>
                                                        <span className="text-[10px] text-muted-foreground font-bold">Ref: #{txn.propertyId.listingNumber || txn.propertyId._id.substring(0, 6)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-semibold">System Platform</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-border/80 text-xs font-semibold">
                                <div className="text-muted-foreground">
                                    Showing page <span className="text-foreground font-bold">{pagination.page}</span> of <span className="text-foreground font-bold">{pagination.totalPages}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={pagination.page <= 1}
                                        onClick={() => onPageChange(pagination.page - 1)}
                                        className="h-8 w-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => onPageChange(pagination.page + 1)}
                                        className="h-8 w-8"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
