import { CheckCircle, Home, FileText, Share2 } from 'lucide-react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl p-8 sm:p-12 shadow-xl border-0">

                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle size={80} className="text-emerald-600 relative" />
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-4xl font-bold text-center text-slate-900 mb-3">
                    Listing Submitted!
                </h1>

                <p className="text-center text-slate-600 text-lg mb-8">
                    Your property has been successfully submitted for review. Our team will verify
                    the details and publish your listing shortly.
                </p>

                {/* Timeline */}
                <div className="space-y-4 mb-8">
                    <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <FileText size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-slate-900">Review in Progress</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                We are reviewing your property details. This usually takes 24–48 hours.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <Home size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-slate-900">Listing Published</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Once approved, your listing will be visible to potential tenants.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <Share2 size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-slate-900">Share & Connect</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                Share your listing with interested tenants and manage inquiries.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={() => (window.location.href = "/")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
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
                        className="flex-1 border-2 border-slate-300 py-3 rounded-lg font-semibold"
                    >
                        Share Listing
                    </Button>
                </div>

                {/* Reference Number */}
                <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                    <p className="text-sm text-slate-600 mb-1">Your Listing Reference</p>
                    <p className="text-2xl font-mono font-bold text-slate-900">
                        #LST-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>

            </Card>
        </div>
    );
}
