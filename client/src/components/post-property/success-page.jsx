import { CheckCircle, Home, FileText, Share2 } from 'lucide-react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl p-8 sm:p-12 shadow-xl border border-border bg-card">

                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle size={80} className="text-success relative" />
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-4xl font-bold text-center text-foreground mb-3">
                    Listing Submitted!
                </h1>

                <p className="text-center text-muted-foreground text-lg mb-8">
                    Your property has been successfully submitted for review. Our team will verify
                    the details and publish your listing shortly.
                </p>

                {/* Timeline */}
                <div className="space-y-4 mb-8">
                    <div className="flex gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <FileText size={24} className="text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground">Review in Progress</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                We are reviewing your property details. This usually takes 24–48 hours.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
                        <Home size={24} className="text-success flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground">Listing Published</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Once approved, your listing will be visible to potential tenants.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                        <Share2 size={24} className="text-secondary flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-foreground">Share & Connect</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Share your listing with interested tenants and manage inquiries.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={() => (window.location.href = "/")}
                        className="flex-1 py-3 rounded-lg font-semibold"
                    >
                        Back to Home
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() =>
                            navigator.share?.({
                                title: "Check out my property listing",
                                text: "I just posted my property on our rental platform!",
                            })
                        }
                        className="flex-1 py-3 rounded-lg font-semibold"
                    >
                        Share Listing
                    </Button>
                </div>

                {/* Reference Number */}
                <div className="mt-8 pt-8 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Your Listing Reference</p>
                    <p className="text-2xl font-mono font-bold text-foreground">
                        #LST-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>

            </Card>
        </div>
    );
}
