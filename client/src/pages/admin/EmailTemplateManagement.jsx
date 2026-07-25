import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { authenticatedFetch } from "../../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
    FileCode, Plus, Search, RefreshCw, Trash2, Edit3, Eye, Send, FolderTree, CheckCircle2
} from "lucide-react";

const CATEGORIES = [
    { value: "all", label: "All Categories" },
    { value: "promotional", label: "📢 Promotional & Marketing" },
    { value: "newsletter", label: "📰 Newsletters & Updates" },
    { value: "property_alert", label: "🏢 Property Alerts" },
    { value: "onboarding", label: "🚀 User Onboarding" },
    { value: "system", label: "⚖️ System & Legal" }
];

export default function EmailTemplateManagement() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    
    // Modal state
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");

    const [form, setForm] = useState({
        title: "",
        category: "promotional",
        subject: "",
        htmlCode: "",
        description: ""
    });
    const [saving, setSaving] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (categoryFilter !== "all") queryParams.append("category", categoryFilter);
            if (search.trim()) queryParams.append("search", search.trim());

            const res = await authenticatedFetch(`/api/admin/email-templates?${queryParams.toString()}`);
            const data = await res.json();

            if (data.success) {
                setTemplates(data.data || []);
            } else {
                toast.error("Failed to load email templates");
            }
        } catch (err) {
            console.error("Error fetching email templates:", err);
            toast.error("Network error fetching templates");
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, search]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleOpenCreateModal = () => {
        setEditingTemplate(null);
        setForm({
            title: "",
            category: "promotional",
            subject: "",
            htmlCode: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">\n  <h1 style="color: #2563eb;">Welcome to Renters</h1>\n  <p>Here is your exclusive update on verified property listings.</p>\n</div>`,
            description: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (template) => {
        setEditingTemplate(template);
        setForm({
            title: template.title,
            category: template.category,
            subject: template.subject,
            htmlCode: template.htmlCode,
            description: template.description || ""
        });
        setIsModalOpen(true);
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!form.title || !form.subject || !form.htmlCode) {
            toast.error("Title, Subject, and HTML code are required.");
            return;
        }

        setSaving(true);
        try {
            const url = editingTemplate 
                ? `/api/admin/email-templates/${editingTemplate._id}`
                : `/api/admin/email-templates`;
            const method = editingTemplate ? "PUT" : "POST";

            const res = await authenticatedFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingTemplate ? "Template updated successfully!" : "Template created successfully!");
                setIsModalOpen(false);
                fetchTemplates();
            } else {
                toast.error(data.message || "Failed to save template");
            }
        } catch (err) {
            console.error("Save template error:", err);
            toast.error("Network error saving template");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        try {
            const res = await authenticatedFetch(`/api/admin/email-templates/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Template deleted successfully");
                fetchTemplates();
            } else {
                toast.error(data.message || "Delete failed");
            }
        } catch (err) {
            console.error("Delete template error:", err);
            toast.error("Network error deleting template");
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case "promotional":
                return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">📢 Promotional</Badge>;
            case "newsletter":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">📰 Newsletter</Badge>;
            case "property_alert":
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">🏢 Property Alert</Badge>;
            case "onboarding":
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">🚀 Onboarding</Badge>;
            default:
                return <Badge variant="outline">⚖️ System</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileCode className="w-6 h-6 text-primary" />
                        HTML Email Templates Library
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create, edit, organize HTML templates into categories and launch email broadcasts.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={fetchTemplates} variant="outline" size="sm" className="gap-1.5">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleOpenCreateModal} className="gap-1.5 font-bold">
                        <Plus className="w-4 h-4" />
                        Create New Template
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search template name, subject, or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs sm:text-sm"
                        />
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Templates List */}
            {loading ? (
                <div className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading HTML templates...
                </div>
            ) : templates.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground space-y-2">
                    <FileCode className="w-10 h-10 text-primary mx-auto" />
                    <h3 className="font-bold text-foreground">No Email Templates Found</h3>
                    <p className="text-xs">Create your first HTML template to use in email campaigns.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((tpl) => (
                        <Card key={tpl._id} className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    {getCategoryBadge(tpl.category)}
                                    <span className="text-[11px] text-muted-foreground">{new Date(tpl.createdAt).toLocaleDateString()}</span>
                                </div>

                                <h3 className="font-bold text-base text-foreground line-clamp-1">{tpl.title}</h3>
                                <p className="text-xs text-muted-foreground font-medium">Subject: <span className="text-foreground">{tpl.subject}</span></p>
                                {tpl.description && <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>}
                            </div>

                            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Preview HTML" onClick={() => { setPreviewHtml(tpl.htmlCode); setPreviewModalOpen(true); }}>
                                        <Eye className="w-4 h-4 text-blue-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit Template" onClick={() => handleOpenEditModal(tpl)}>
                                        <Edit3 className="w-4 h-4 text-amber-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Delete Template" onClick={() => handleDeleteTemplate(tpl._id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>

                                <Button size="sm" className="gap-1 text-xs font-bold" onClick={() => navigate("/admin/email-broadcaster", { state: { template: tpl } })}>
                                    <Send className="w-3.5 h-3.5" />
                                    Use in Broadcast
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-foreground">
                                {editingTemplate ? "Edit HTML Email Template" : "Create New HTML Email Template"}
                            </h3>
                            <Button size="sm" variant="ghost" onClick={() => setIsModalOpen(false)}>✕</Button>
                        </div>

                        <form onSubmit={handleSaveTemplate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Template Name *</label>
                                    <Input
                                        placeholder="e.g. Summer Rent Sale 2026"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Category *</label>
                                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="promotional">📢 Promotional & Marketing</SelectItem>
                                            <SelectItem value="newsletter">📰 Newsletters & Updates</SelectItem>
                                            <SelectItem value="property_alert">🏢 Property Alerts</SelectItem>
                                            <SelectItem value="onboarding">🚀 User Onboarding</SelectItem>
                                            <SelectItem value="system">⚖️ System & Legal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Default Email Subject Line *</label>
                                <Input
                                    placeholder="e.g. 🔥 Exclusive Deals: Verified Flats in Mumbai"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Raw HTML Code * (Paste HTML Code directly)</label>
                                <textarea
                                    value={form.htmlCode}
                                    onChange={(e) => setForm({ ...form, htmlCode: e.target.value })}
                                    placeholder="Paste complete raw HTML code here..."
                                    className="w-full h-56 p-3 text-xs font-mono rounded-lg border border-border bg-muted/30"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Description (Internal Notes)</label>
                                <Input
                                    placeholder="Optional description for team reference..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={saving} className="font-bold">
                                    {saving ? "Saving..." : editingTemplate ? "Update Template" : "Save Template"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Live Preview Modal */}
            {previewModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <Card className="max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Rendered HTML Email Preview
                            </h3>
                            <Button size="sm" variant="ghost" onClick={() => setPreviewModalOpen(false)}>✕</Button>
                        </div>

                        <div className="flex-1 min-h-[400px] border border-border rounded-lg overflow-hidden bg-white">
                            <iframe
                                srcDoc={previewHtml}
                                title="HTML Preview"
                                className="w-full h-full min-h-[400px]"
                            />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
