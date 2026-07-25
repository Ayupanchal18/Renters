import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Wrench, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Maintenance() {
    const location = useLocation();
    const [info, setInfo] = useState(location.state?.maintenanceInfo || null);

    useEffect(() => {
        if (!info) {
            fetch("/api/maintenance/status")
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data) {
                        setInfo(json.data);
                    }
                })
                .catch(err => console.error("Error fetching maintenance info:", err));
        }
    }, [info]);

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
                <div className="max-w-xl w-full text-center space-y-6 bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
                        <Wrench className="w-8 h-8 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                            System Under Scheduled Maintenance
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {info?.message || "We are currently performing platform upgrades and routine maintenance to enhance your experience. We will be back online shortly!"}
                        </p>
                    </div>

                    {info?.estimatedEndTime && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-xs sm:text-sm font-semibold text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            Estimated Completion: {new Date(info.estimatedEndTime).toLocaleString()}
                        </div>
                    )}

                    <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link to="/login">
                            <Button variant="outline" size="sm" className="gap-2 text-xs font-semibold">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Admin Portal Access
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
