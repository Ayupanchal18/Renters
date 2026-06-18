import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LeaseDraftEditor from "../components/lease/LeaseDraftEditor";
import { Button } from "../components/ui/button";

export default function LeaseAgreement() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Back Nav Link */}
                <div className="mb-6">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground hover:text-foreground pl-0 rounded-lg"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Dashboard
                    </Button>
                </div>

                {/* Page Title & Vault Details */}
                <div className="mb-6 flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                            Digital Lease Agreement
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Draft, review, and legally sign your lease contracts on the Renters network securely.
                        </p>
                    </div>
                </div>

                {/* Main Editor Component */}
                <LeaseDraftEditor leaseId={id} />
            </main>

            <Footer />
        </div>
    );
}
