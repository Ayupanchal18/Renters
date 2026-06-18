import { FileText, Clock, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { getDraftAge } from '../../hooks/useDraftSave';

/**
 * Modal shown when a saved draft is found on wizard mount.
 * Lets user resume where they left off or start fresh.
 */
export default function DraftRestoreModal({ draft, onRestore, onDiscard }) {
    if (!draft) return null;

    const stepNames = [
        '', 'Basic Info', 'Location', 'Details & Amenities', 'Photos',
        'Pricing', 'Review'
    ];

    const savedStep = Math.min(draft.currentStep || 1, 6);
    const stepName = stepNames[savedStep] || `Step ${savedStep}`;
    const age = getDraftAge(draft.savedAt);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                        <div className="relative bg-primary/10 p-4 rounded-full">
                            <FileText size={32} className="text-primary" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold text-foreground text-center mb-2">
                    Resume Your Listing?
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    You have an unsaved listing draft. Pick up where you left off or start fresh.
                </p>

                {/* Draft info */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Saved</span>
                        <span className="text-foreground font-medium ml-auto">{age}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Last step</span>
                        <span className="text-foreground font-medium ml-auto">{stepName} ({savedStep}/6)</span>
                    </div>
                    {draft.formData?.title && (
                        <div className="pt-2 border-t border-border">
                            <p className="text-sm text-foreground font-medium truncate">
                                &ldquo;{draft.formData.title}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Button onClick={onRestore} className="w-full flex items-center justify-center gap-2">
                        <RotateCcw size={16} />
                        Resume Draft
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onDiscard}
                        className="w-full flex items-center justify-center gap-2 text-muted-foreground"
                    >
                        <Trash2 size={16} />
                        Start Fresh
                    </Button>
                </div>
            </div>
        </div>
    );
}
