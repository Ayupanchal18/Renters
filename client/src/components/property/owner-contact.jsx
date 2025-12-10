import { Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function OwnerContact({ owner, propertyId }) {
    return (
        <div className="section-card overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Owner Information</h3>
            </div>

            <div className="p-6 space-y-4">
                {/* Owner Card */}
                <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <img
                        src={owner.avatar || "/placeholder.svg"}
                        alt={owner.name}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                        <p className="font-semibold text-foreground">{owner.name}</p>
                        <p className="text-sm text-muted-foreground">Property Owner</p>
                    </div>
                </div>

                {/* Verification */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="text-sm text-green-700 font-medium">Verified Owner</span>
                </div>

                {/* Contact Methods */}
                <div className="space-y-2">
                    <a
                        href={`tel:${owner.phone}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors group cursor-pointer"
                    >
                        <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Call Owner</p>
                            <p className="text-sm font-medium text-foreground">{owner.phone}</p>
                        </div>
                    </a>

                    <a
                        href={`mailto:${owner.email}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors group cursor-pointer"
                    >
                        <div className="bg-accent/10 p-2 rounded-lg group-hover:bg-accent/20 transition-colors">
                            <Mail className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Send Email</p>
                            <p className="text-sm font-medium text-foreground">{owner.email}</p>
                        </div>
                    </a>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2 pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request Viewing
                    </Button>

                    <Button variant="outline" className="w-full">
                        Schedule Tour
                    </Button>
                </div>
            </div>
        </div>
    );
}
