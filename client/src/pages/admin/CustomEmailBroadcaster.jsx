import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { authenticatedFetch } from "../../lib/api";
import { toast } from "sonner";
import { 
    Send, Mail, Users, Eye, CheckCircle2, RefreshCw, Smartphone, Monitor, ShieldCheck, AlertCircle, FileCode
} from "lucide-react";

export default function CustomEmailBroadcaster() {
    const location = useLocation();
    const passedTemplate = location.state?.template;

    const [savedTemplates, setSavedTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    
    // Broadcast Form
    const [subject, setSubject] = useState(passedTemplate?.subject || "");
    const [htmlCode, setHtmlCode] = useState(passedTemplate?.htmlCode || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">\n  <h1 style="color: #2563eb;">Exclusive Property Alert</h1>\n  <p>Discover verified luxury flats and rental homes directly from owners.</p>\n</div>`);
    const [targetRole, setTargetRole] = useState("all");
    const [city, setCity] = useState("");

    // Test Email Modal & Loading
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'preview'

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await authenticatedFetch("/api/admin/email-templates");
            const data = await res.json();
            if (data.success) {
                setSavedTemplates(data.data || []);
            }
        } catch (err) {
            console.error("Error loading templates:", err);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSelectTemplate = (templateId) => {
        setSelectedTemplateId(templateId);
        const found = savedTemplates.find(t => t._id === templateId);
        if (found) {
            setSubject(found.subject);
            setHtmlCode(found.htmlCode);
            toast.success(`Loaded saved template: ${found.title}`);
        }
    };

    const handleSendTestEmail = async () => {
        if (!subject || !htmlCode) {
            toast.error("Subject line and HTML code are required.");
            return;
        }
        if (!testEmail || !testEmail.includes("@")) {
            toast.error("Please enter a valid recipient email address for test delivery.");
            return;
        }

        setSendingTest(true);
        try {
            const res = await authenticatedFetch("/api/admin/notifications/send-test-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    htmlCode,
                    recipientEmail: testEmail
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Test email sent successfully to ${testEmail}!`);
            } else {
                toast.error(data.message || "Test email failed");
            }
        } catch (err) {
            console.error("Send test email error:", err);
            toast.error("Error sending test email");
        } finally {
            setSendingTest(false);
        }
    };

    const handleBroadcastEmail = async () => {
        if (!subject || !htmlCode) {
            toast.error("Subject line and HTML code are required.");
            return;
        }

        if (!window.confirm(`Are you sure you want to broadcast this HTML email to matching users (${targetRole.toUpperCase()})?`)) {
            return;
        }

        setBroadcasting(true);
        try {
            const res = await authenticatedFetch("/api/admin/notifications/broadcast-html", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    htmlCode,
                    targetRole,
                    city
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Email broadcast completed!");
            } else {
                toast.error(data.message || "Broadcast failed");
            }
        } catch (err) {
            console.error("Broadcast error:", err);
            toast.error("Error processing broadcast");
        } finally {
            setBroadcasting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Send className="w-6 h-6 text-primary" />
                        Raw HTML Email Broadcaster
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Paste custom raw HTML code or load saved templates to broadcast targeted email campaigns.
                    </p>
                </div>

                {/* View Mode Tabs */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                    <Button
                        size="sm"
                        variant={activeTab === "editor" ? "default" : "ghost"}
                        onClick={() => setActiveTab("editor")}
                        className="gap-1.5 text-xs font-bold"
                    >
                        <FileCode className="w-3.5 h-3.5" />
                        HTML Code Editor
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "preview" ? "default" : "ghost"}
                        onClick={() => setActiveTab("preview")}
                        className="gap-1.5 text-xs font-bold"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Live Rendered Preview
                    </Button>
                </div>
            </div>

            {/* Target Audience Filters Bar */}
            <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        Target Audience Segmentation
                    </h3>
                    <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                        <SelectTrigger className="h-8 text-xs w-60">
                            <SelectValue placeholder="Load Saved Template..." />
                        </SelectTrigger>
                        <SelectContent>
                            {savedTemplates.map(t => (
                                <SelectItem key={t._id} value={t._id}>{t.title} ({t.category})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Target Role / Segment</label>
                        <Select value={targetRole} onValueChange={setTargetRole}>
                            <SelectTrigger className="h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">👥 All Active Users</SelectItem>
                                <SelectItem value="newsletter_subscribers">📧 Newsletter Subscribers Only</SelectItem>
                                <SelectItem value="user">🏠 Renters / Buyers</SelectItem>
                                <SelectItem value="owner">🔑 Property Owners</SelectItem>
                                <SelectItem value="agent">💼 Real Estate Agents</SelectItem>
                                <SelectItem value="seller">🏢 Builders & Sellers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Target City (Optional)</label>
                        <Input
                            placeholder="e.g. Mumbai, Bengaluru..."
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-9 text-xs sm:text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">Email Subject Line *</label>
                        <Input
                            placeholder="e.g. 🔥 New Verified Flats Available in Mumbai"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-9 text-xs sm:text-sm"
                            required
                        />
                    </div>
                </div>
            </Card>

            {/* Main Content: Editor vs Preview */}
            {activeTab === "editor" ? (
                <Card className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <FileCode className="w-4 h-4 text-primary" />
                            Paste Raw HTML Email Code Below (No Templating Tags Required)
                        </label>
                        <span className="text-xs text-muted-foreground font-mono">{htmlCode.length} characters</span>
                    </div>

                    <textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        placeholder="Paste complete raw HTML code from Mailchimp, Figma, or custom editor..."
                        className="w-full h-[400px] p-4 text-xs font-mono rounded-lg border border-border bg-muted/20 resize-y focus:ring-2 focus:ring-primary"
                    />
                </Card>
            ) : (
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-emerald-500" />
                            Live Rendered Email Viewport
                        </h4>
                        <Badge variant="outline" className="text-xs">HTML Render Engine Active</Badge>
                    </div>

                    <div className="min-h-[420px] border border-border rounded-lg overflow-hidden bg-white">
                        <iframe
                            srcDoc={htmlCode}
                            title="Live HTML Broadcast Preview"
                            className="w-full h-full min-h-[420px]"
                        />
                    </div>
                </Card>
            )}

            {/* Action Footer Bar */}
            <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Enter email to send test..."
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="h-9 text-xs sm:text-sm max-w-xs"
                    />
                    <Button onClick={handleSendTestEmail} disabled={sendingTest} variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                        <Mail className="w-4 h-4 text-primary" />
                        {sendingTest ? "Sending Test..." : "Send Test Email"}
                    </Button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button onClick={handleBroadcastEmail} disabled={broadcasting} className="gap-2 font-bold px-6">
                        {broadcasting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {broadcasting ? "Broadcasting Mass Email..." : "Broadcast Mass Email Campaign"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
