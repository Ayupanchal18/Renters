import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { authenticatedFetch } from "../../lib/api";
import { toast } from "sonner";
import { 
    Mail, Megaphone, Download, RefreshCw, Search, Users, CheckCircle2, UserCheck, Trash2, Calendar, ShieldCheck
} from "lucide-react";

export default function NewsletterSubscribers() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchSubscribers = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "25"
            });
            
            if (typeFilter === "newsletter") {
                queryParams.append("type", "newsletter_subscriber");
            } else if (typeFilter === "campaign") {
                queryParams.append("type", "campaign_subscriber");
            } else {
                // Fetch both
                queryParams.append("type", "newsletter_subscriber");
            }

            if (search.trim()) queryParams.append("search", search.trim());

            const res = await authenticatedFetch(`/api/legal/admin/requests?${queryParams.toString()}`);
            const data = await res.json();

            if (data.success) {
                setSubscribers(data.data.requests || []);
                setTotalPages(data.data.pagination?.totalPages || 1);
                setTotalCount(data.data.pagination?.total || 0);
            } else {
                toast.error("Failed to load subscriber list");
            }
        } catch (err) {
            console.error("Error fetching subscribers:", err);
            toast.error("Network error fetching subscribers");
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, search]);

    useEffect(() => {
        fetchSubscribers();
    }, [fetchSubscribers]);

    const handleExportCSV = () => {
        if (subscribers.length === 0) {
            toast.error("No subscribers available to export");
            return;
        }

        const headers = ["ID", "Email", "Interest Type", "Details", "Subscribed Date", "Status", "IP Address"];
        const rows = subscribers.map(sub => [
            sub._id,
            `"${sub.applicantEmail}"`,
            `"${sub.type}"`,
            `"${sub.details.replace(/"/g, '""')}"`,
            `"${new Date(sub.createdAt).toLocaleString()}"`,
            `"${sub.status}"`,
            `"${sub.ipAddress || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `renters_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Subscriber CSV exported successfully!");
    };

    const handleUnsubscribe = async (id) => {
        try {
            const res = await authenticatedFetch(`/api/legal/admin/requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rejected",
                    resolutionNotes: "Unsubscribed / Removed by admin"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Subscriber marked as unsubscribed");
                fetchSubscribers();
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error("Error updating subscriber:", err);
            toast.error("Error updating subscriber");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Mail className="w-6 h-6 text-primary" />
                        Newsletter & Campaign Subscribers
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View interested users, campaign leads, and export email subscriber lists.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={fetchSubscribers} variant="outline" size="sm" className="gap-1.5">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleExportCSV} className="gap-1.5 font-bold">
                        <Download className="w-4 h-4" />
                        Export CSV List
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{totalCount}</div>
                        <div className="text-xs text-muted-foreground">Total Active Subscribers</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{subscribers.filter(s => s.type === "newsletter_subscriber").length}</div>
                        <div className="text-xs text-muted-foreground">Property Alert Subscribers</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{subscribers.filter(s => s.type === "campaign_subscriber").length}</div>
                        <div className="text-xs text-muted-foreground">Campaign Interested Leads</div>
                    </div>
                </Card>
            </div>

            {/* Filter Bar */}
            <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs sm:text-sm"
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="All Interest Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Interest Types</SelectItem>
                            <SelectItem value="newsletter">📧 Newsletter Subscribers</SelectItem>
                            <SelectItem value="campaign">📢 Campaign Interested Leads</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Subscribers Table */}
            {loading ? (
                <div className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading subscriber records...
                </div>
            ) : subscribers.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground space-y-2">
                    <Mail className="w-10 h-10 text-primary mx-auto" />
                    <h3 className="font-bold text-foreground">No Subscribers Found</h3>
                    <p className="text-xs">No email subscribers match your filter criteria.</p>
                </Card>
            ) : (
                <Card className="overflow-hidden border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                <tr>
                                    <th className="p-3">Subscriber Email</th>
                                    <th className="p-3">Interest Category</th>
                                    <th className="p-3">Subscribed Date</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subscribers.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-bold text-foreground">
                                            {sub.applicantEmail}
                                        </td>
                                        <td className="p-3">
                                            {sub.type === "campaign_subscriber" ? (
                                                <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                                    📢 Campaign Lead
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    📧 Newsletter Subscriber
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            <span className="flex items-center gap-1 font-mono">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(sub.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {sub.status === "rejected" ? (
                                                <Badge variant="secondary">Unsubscribed</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            {sub.status !== "rejected" && (
                                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleUnsubscribe(sub._id)}>
                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                    Unsubscribe
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
