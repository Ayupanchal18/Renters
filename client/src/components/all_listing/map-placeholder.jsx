import { Map } from "lucide-react";

export function MapPlaceholder() {
    return (
        <div className="w-full h-96 md:h-[600px] bg-muted border border-border rounded-lg flex flex-col items-center justify-center">
            <Map className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Map View</h3>
            <p className="text-muted-foreground text-center max-w-sm">
                Interactive map with property locations and details will be displayed
                here. Integrating Google Maps or similar service.
            </p>
        </div>
    );
}
