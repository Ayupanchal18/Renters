import React, { useEffect } from "react";
import { GraduationCap, HeartPulse, ShoppingBag, Utensils, Trees, Bus, MapPin, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const CATEGORY_TABS = [
    { key: "schools", label: "Schools", icon: GraduationCap },
    { key: "hospitals", label: "Hospitals", icon: HeartPulse },
    { key: "groceries", label: "Groceries", icon: ShoppingBag },
    { key: "restaurants", label: "Restaurants", icon: Utensils },
    { key: "parks", label: "Parks", icon: Trees },
    { key: "transit", label: "Transit", icon: Bus }
];

export function AmenitiesList({
    categories = {},
    activeCategory,
    setActiveCategory,
    selectedAmenityId,
    onAmenityClick
}) {
    // Determine category with most results to set as default on load (only if activeCategory not set yet)
    useEffect(() => {
        if (!activeCategory && Object.keys(categories).length > 0) {
            let maxCount = -1;
            let defaultCat = "schools";
            CATEGORY_TABS.forEach(tab => {
                const count = categories[tab.key]?.length || 0;
                if (count > maxCount) {
                    maxCount = count;
                    defaultCat = tab.key;
                }
            });
            setActiveCategory(defaultCat);
        }
    }, [categories, activeCategory, setActiveCategory]);

    const activeList = categories[activeCategory] || [];

    const formatDistanceStr = (distanceMeters) => {
        if (distanceMeters < 1000) {
            return `${distanceMeters} m`;
        }
        return `${(distanceMeters / 1000).toFixed(1)} km`;
    };

    // Keyboard navigation helper for tabs (left/right arrows)
    const handleKeyDown = (e, index) => {
        let newIndex = index;
        if (e.key === "ArrowRight") {
            newIndex = (index + 1) % CATEGORY_TABS.length;
            e.preventDefault();
        } else if (e.key === "ArrowLeft") {
            newIndex = (index - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length;
            e.preventDefault();
        }

        if (newIndex !== index) {
            setActiveCategory(CATEGORY_TABS[newIndex].key);
            // Focus new element
            const tabBtn = document.getElementById(`tab-btn-${CATEGORY_TABS[newIndex].key}`);
            if (tabBtn) tabBtn.focus();
        }
    };

    return (
        <div className="space-y-4">
            {/* Category tabs list wrapper */}
            <div
                role="tablist"
                aria-label="Neighborhood Amenity Categories"
                className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-1 px-1"
            >
                {CATEGORY_TABS.map((tab, idx) => {
                    const TabIcon = tab.icon;
                    const isActive = activeCategory === tab.key;
                    const count = categories[tab.key]?.length || 0;

                    return (
                        <button
                            type="button"
                            role="tab"
                            key={tab.key}
                            id={`tab-btn-${tab.key}`}
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.key}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => setActiveCategory(tab.key)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className={cn(
                                "flex items-center gap-1.5 py-2 px-3.5 rounded-full border text-xs font-semibold flex-shrink-0 snap-center transition-all active:scale-97",
                                isActive
                                    ? "bg-primary border-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
                                    : "border-border/60 bg-card/65 text-foreground hover:border-primary/50"
                            )}
                        >
                            <TabIcon className="w-3.5 h-3.5" />
                            {tab.label}
                            {count > 0 && (
                                <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded-full ml-1",
                                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List panel */}
            <div
                id={`panel-${activeCategory}`}
                role="tabpanel"
                aria-labelledby={`tab-btn-${activeCategory}`}
                className="space-y-2 max-h-[280px] overflow-y-auto pr-1"
            >
                {activeList.length === 0 ? (
                    <div className="text-center py-8 bg-muted/10 border border-dashed border-border/60 rounded-xl">
                        <MapPin className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
                        <p className="text-xs text-muted-foreground italic">
                            No {activeCategory} found within 1.5km
                        </p>
                    </div>
                ) : (
                    activeList.map((item, index) => {
                        const isSelected = selectedAmenityId === `${item.name}_${item.lat}_${item.lng}`;
                        
                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => onAmenityClick(item)}
                                className={cn(
                                    "w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 hover:bg-muted/15 hover-pop",
                                    isSelected 
                                        ? "bg-primary/5 border-primary/45 shadow-sm text-primary" 
                                        : "bg-card/40 border-border/40 text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center border",
                                        isSelected 
                                            ? "bg-primary/10 border-primary/20 text-primary" 
                                            : "bg-muted/30 border-border/40 text-muted-foreground"
                                    )}>
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                    </div>
                                    <div className="min-w-0">
                                        <h5 className="text-xs font-bold truncate pr-2">{item.name}</h5>
                                        <p className="text-[10px] text-muted-foreground capitalize">{item.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                                    <span>{formatDistanceStr(item.distance)}</span>
                                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
