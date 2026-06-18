import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { MapPin, Map, BarChart2, Globe, Building2, HelpCircle } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

// Simplified geometric path coordinates for a stylized India state map
// Optimized for visual elegance, responsiveness, and interaction.
const STATE_MAP_SHAPES = [
    {
        id: "Delhi",
        name: "Delhi",
        path: "M 220 180 L 240 180 L 240 200 L 220 200 Z", // stylized block for NCR
        center: { x: 230, y: 190 }
    },
    {
        id: "Maharashtra",
        name: "Maharashtra",
        path: "M 130 310 L 190 310 L 210 350 L 160 380 L 130 350 Z",
        center: { x: 170, y: 340 }
    },
    {
        id: "Karnataka",
        name: "Karnataka",
        path: "M 150 395 L 185 395 L 180 470 L 145 450 Z",
        center: { x: 165, y: 430 }
    },
    {
        id: "Telangana",
        name: "Telangana",
        path: "M 195 360 L 235 365 L 225 410 L 190 395 Z",
        center: { x: 210, y: 380 }
    },
    {
        id: "Tamil Nadu",
        name: "Tamil Nadu",
        path: "M 175 475 L 205 470 L 195 540 L 165 520 Z",
        center: { x: 185, y: 500 }
    },
    // Adding abstract outlines for other regions to complete the India silhouette contextually
    {
        id: "North",
        name: "North Region (JK/HP/Punjab)",
        path: "M 180 60 L 230 65 L 250 140 L 200 170 L 170 120 Z",
        center: { x: 210, y: 110 },
        isDecorative: true
    },
    {
        id: "West",
        name: "Rajasthan & Gujarat",
        path: "M 90 200 L 180 200 L 210 240 L 150 300 L 115 300 L 80 250 Z",
        center: { x: 140, y: 240 },
        isDecorative: true
    },
    {
        id: "East",
        name: "East Region (UP/Bihar/WB)",
        path: "M 250 190 L 320 210 L 340 290 L 270 320 L 225 250 Z",
        center: { x: 280, y: 260 },
        isDecorative: true
    },
    {
        id: "NorthEast",
        name: "North East Region",
        path: "M 360 210 L 410 220 L 420 260 L 370 270 L 355 240 Z",
        center: { x: 385, y: 240 },
        isDecorative: true
    }
];

export default function GeographicHeatMap({ data, loading, error }) {
    const [selectedState, setSelectedState] = useState(null);
    const [hoveredState, setHoveredState] = useState(null);

    // Sync selected state once data is loaded
    useEffect(() => {
        if (data && data.length > 0 && !selectedState) {
            // Default to the state with the highest listing count
            const highest = [...data].sort((a, b) => b.count - a.count)[0];
            setSelectedState(highest);
        }
    }, [data, selectedState]);

    const getDensityColor = (count) => {
        if (!count) return "fill-muted/40 stroke-border";
        if (count > 100) return "fill-primary/90 stroke-primary-foreground hover:fill-primary";
        if (count > 50) return "fill-primary/65 stroke-primary-foreground hover:fill-primary/80";
        if (count > 25) return "fill-primary/45 stroke-primary-foreground hover:fill-primary/60";
        return "fill-primary/25 stroke-primary-foreground hover:fill-primary/45";
    };

    const handleStateClick = (stateName) => {
        const matched = data?.find(
            (s) => s.state.toLowerCase() === stateName.toLowerCase()
        );
        if (matched) {
            setSelectedState(matched);
        }
    };

    const activeStateData = selectedState || (data && data[0]);

    return (
        <Card className="col-span-8 shadow-sm border border-border">
            <CardHeader className="pb-4 border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Map className="h-5 w-5 text-primary" />
                            Geographic Listing Density
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Active listings distributed by Indian states and cities
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-muted/60 border border-border px-3 py-1.5 rounded-full text-muted-foreground font-semibold">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <span>Interactive Heatmap</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="h-[400px] w-full flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
                        <span className="text-sm text-muted-foreground">Loading geographic distribution...</span>
                    </div>
                ) : error ? (
                    <div className="h-[400px] w-full flex flex-col items-center justify-center bg-destructive/5 rounded-md border border-destructive/15">
                        <span className="text-sm font-medium text-destructive">Failed to load geographic analytics</span>
                        <span className="text-xs text-muted-foreground mt-1">{error}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
                        {/* Map Vector Panel */}
                        <div className="lg:col-span-6 flex flex-col items-center justify-center relative bg-muted/20 border border-border/60 rounded-xl p-4 min-h-[380px]">
                            <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 bg-card px-2 py-1 rounded-md border border-border/80">
                                <HelpCircle className="h-3 w-3 text-primary" />
                                Click a highlighted state
                            </span>
                            
                            <svg
                                viewBox="0 0 450 580"
                                className="w-full max-h-[340px] drop-shadow-sm select-none"
                            >
                                <g className="transition-all duration-300">
                                    {STATE_MAP_SHAPES.map((shape) => {
                                        const stateStats = data?.find(
                                            (s) => s.state.toLowerCase() === shape.id.toLowerCase()
                                        );
                                        const isSelected = activeStateData?.state.toLowerCase() === shape.id.toLowerCase();
                                        const isDecorative = shape.isDecorative;
                                        
                                        const fillClass = isDecorative 
                                            ? "fill-muted/30 stroke-muted-foreground/20" 
                                            : getDensityColor(stateStats?.count);

                                        return (
                                            <g key={shape.id} className="group cursor-pointer">
                                                <path
                                                    d={shape.path}
                                                    className={`transition-all duration-200 ease-in-out stroke-[1.5] ${fillClass} ${
                                                        isSelected ? "stroke-primary stroke-2 ring-2 ring-primary/20 scale-[1.01] drop-shadow-md" : "stroke-border"
                                                    }`}
                                                    onClick={() => !isDecorative && handleStateClick(shape.id)}
                                                    onMouseEnter={() => !isDecorative && setHoveredState(shape.name)}
                                                    onMouseLeave={() => setHoveredState(null)}
                                                />
                                                {!isDecorative && stateStats && (
                                                    <circle
                                                        cx={shape.center.x}
                                                        cy={shape.center.y}
                                                        r={isSelected ? 6 : 4}
                                                        className="fill-foreground/90 pointer-events-none"
                                                    />
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>

                            {/* Hover overlay tooltip */}
                            <div className="mt-4 text-xs font-semibold text-muted-foreground h-4">
                                {hoveredState && (
                                    <span className="text-foreground flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                        {hoveredState} {data?.find(s => s.state === hoveredState) ? `(${data.find(s => s.state === hoveredState).count} listings)` : ""}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* City Details Panel */}
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                            <div className="space-y-4">
                                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-xs">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-foreground">
                                            {activeStateData?.state || "Select State"}
                                        </h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-semibold">
                                            <Building2 className="h-3.5 w-3.5 text-primary" />
                                            {activeStateData?.count || 0} total properties listed
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-primary">
                                            {activeStateData?.cities?.length || 0}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                                            Active Cities
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                        <BarChart2 className="h-3.5 w-3.5 text-primary" />
                                        City Distribution
                                    </h4>
                                    <div className="h-[210px] w-full border border-border/50 rounded-xl p-3 bg-muted/10">
                                        {activeStateData?.cities && activeStateData.cities.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={activeStateData.cities}
                                                    layout="vertical"
                                                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                                                >
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="city"
                                                        type="category"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        style={{ fontSize: "11px", fontWeight: "600", fill: "hsl(var(--foreground))" }}
                                                    />
                                                    <ChartTooltip
                                                        cursor={{ fill: "rgba(var(--foreground), 0.04)" }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-card border border-border shadow-md rounded-md px-3 py-1.5 text-xs font-semibold font-sans">
                                                                        <span className="text-muted-foreground">{payload[0].payload.city}: </span>
                                                                        <span className="text-foreground">{payload[0].value} listings</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        radius={[0, 4, 4, 0]}
                                                        barSize={14}
                                                    >
                                                        {activeStateData.cities.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill="hsl(var(--primary))"
                                                                className="transition-all duration-200 hover:fill-primary"
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground font-semibold">No city breakdown available</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Density Stats Legends */}
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/80">
                                <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                                    <span className="block text-xs font-black text-foreground">High</span>
                                    <span className="text-[10px] text-muted-foreground font-semibold">100+ listings</span>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-primary/30 border border-primary/40">
                                    <span className="block text-xs font-black text-foreground">Medium</span>
                                    <span className="text-[10px] text-muted-foreground font-semibold">50+ listings</span>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-primary/50 border border-primary/60">
                                    <span className="block text-xs font-black text-foreground">Modest</span>
                                    <span className="text-[10px] text-muted-foreground font-semibold">25+ listings</span>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-muted border border-border">
                                    <span className="block text-xs font-black text-foreground">None</span>
                                    <span className="text-[10px] text-muted-foreground font-semibold">0 listings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
