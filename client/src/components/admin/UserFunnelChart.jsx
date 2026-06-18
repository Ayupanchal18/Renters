import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Filter, Users, ArrowDown, Percent } from "lucide-react";

export default function UserFunnelChart({ data, loading, error }) {
    return (
        <Card className="col-span-4 shadow-sm border border-border">
            <CardHeader className="pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Filter className="h-5 w-5 text-primary" />
                        User Conversion Funnel
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Conversion and drop-off rates across key registration stages
                    </p>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                {loading ? (
                    <div className="h-[350px] w-full flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
                        <span className="text-sm text-muted-foreground">Loading funnel data...</span>
                    </div>
                ) : error ? (
                    <div className="h-[350px] w-full flex flex-col items-center justify-center bg-destructive/5 rounded-md border border-destructive/15">
                        <span className="text-sm font-medium text-destructive">Failed to load funnel statistics</span>
                        <span className="text-xs text-muted-foreground mt-1">{error}</span>
                    </div>
                ) : (
                    <div className="space-y-4 font-sans">
                        {data?.map((item, index) => {
                            const isFirst = index === 0;
                            const dropoff = isFirst ? 0 : 100 - item.percentage;
                            
                            // Color accents for the funnel tiers
                            const bgColors = [
                                "bg-primary/15 border-primary/30 text-primary",
                                "bg-blue-500/15 border-blue-500/30 text-blue-500",
                                "bg-indigo-500/15 border-indigo-500/30 text-indigo-500",
                                "bg-violet-500/15 border-violet-500/30 text-violet-500",
                                "bg-success/15 border-success/30 text-success"
                            ];

                            const barColors = [
                                "bg-primary",
                                "bg-blue-500",
                                "bg-indigo-500",
                                "bg-violet-500",
                                "bg-success"
                            ];

                            const colorClass = bgColors[index % bgColors.length];
                            const barColorClass = barColors[index % barColors.length];

                            return (
                                <div key={item.stage} className="relative">
                                    {!isFirst && (
                                        <div className="flex justify-center my-1">
                                            <div className="flex items-center gap-1.5 bg-muted/80 px-2.5 py-0.5 rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
                                                <ArrowDown className="h-3 w-3 text-destructive animate-bounce" />
                                                <span>Drop-off: {dropoff}%</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 rounded-xl border ${colorClass} transition-all duration-200 hover:shadow-sm`}>
                                        <div className="flex items-center gap-3 w-full md:w-1/3">
                                            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-card border border-border shadow-xs">
                                                <span className="text-xs font-bold text-foreground">{index + 1}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">{item.stage}</h4>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {item.count.toLocaleString("en-IN")} users
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-1/2 mt-3 md:mt-0 flex items-center gap-4">
                                            <div className="relative flex-1 h-3 bg-muted rounded-full overflow-hidden border border-border/25">
                                                <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-16 text-right">
                                                <span className="text-sm font-bold text-foreground flex items-center justify-end gap-0.5">
                                                    {item.percentage}
                                                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    {isFirst ? "Baseline" : "Conversion"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
