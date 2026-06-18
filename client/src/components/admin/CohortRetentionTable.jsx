import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Grid, HelpCircle } from "lucide-react";

export default function CohortRetentionTable({ data, loading, error }) {
    // Helper to get heat map cell color class based on percentage value
    const getCellColor = (pct) => {
        if (pct === null || pct === undefined) return "bg-muted/15 border-border/10 text-muted-foreground/30";
        if (pct === 100) return "bg-primary text-primary-foreground border-primary/20";
        if (pct >= 80) return "bg-primary/80 text-primary-foreground border-primary/30";
        if (pct >= 60) return "bg-primary/65 text-primary-foreground border-primary/20";
        if (pct >= 40) return "bg-primary/45 text-foreground border-primary/15";
        if (pct >= 20) return "bg-primary/25 text-foreground border-primary/10";
        if (pct >= 10) return "bg-primary/15 text-foreground border-primary/5";
        return "bg-primary/5 text-muted-foreground/80 border-border/10";
    };

    return (
        <Card className="col-span-8 shadow-sm border border-border">
            <CardHeader className="pb-4 border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <Grid className="h-5 w-5 text-primary" />
                            Weekly Cohort Retention
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Percentage of newly registered users active over subsequent weeks
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-muted/60 border border-border px-3 py-1.5 rounded-full text-muted-foreground font-semibold">
                        <HelpCircle className="h-3.5 w-3.5 text-primary" />
                        <span>Blends actual activity and decay baseline</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="h-[320px] w-full flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
                        <span className="text-sm text-muted-foreground">Computing cohort retention matrix...</span>
                    </div>
                ) : error ? (
                    <div className="h-[320px] w-full flex flex-col items-center justify-center bg-destructive/5 rounded-md border border-destructive/15">
                        <span className="text-sm font-medium text-destructive">Failed to calculate cohorts</span>
                        <span className="text-xs text-muted-foreground mt-1">{error}</span>
                    </div>
                ) : (
                    <div className="space-y-6 font-sans">
                        {/* Scrollable grid container */}
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="p-3.5 font-bold text-foreground">Cohort (Week of)</th>
                                        <th className="p-3.5 font-bold text-foreground flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-muted-foreground" /> Size
                                        </th>
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <th key={i} className="p-3.5 font-bold text-foreground text-center">
                                                Wk {i}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.map((row, index) => (
                                        <tr key={row.cohort + index} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                            <td className="p-3.5 font-bold text-foreground">{row.cohort}</td>
                                            <td className="p-3.5 font-semibold text-muted-foreground">
                                                {row.size} users
                                            </td>
                                            {row.retention?.map((pct, i) => (
                                                <td key={i} className="p-1">
                                                    <div
                                                        className={`h-9 w-full rounded-md flex items-center justify-center font-bold text-xs border transition-all duration-150 ${getCellColor(pct)}`}
                                                        title={pct !== null ? `Week ${i}: ${pct}% retention` : `Week ${i}: N/A`}
                                                    >
                                                        {pct !== null ? `${pct}%` : "-"}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Density indicator key / legend */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground pt-2">
                            <span>Retention Rate Key:</span>
                            <div className="flex items-center gap-1">
                                <div className="h-4 w-8 rounded bg-primary/5 border border-border/10" />
                                <span>0 - 19%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-4 w-8 rounded bg-primary/25 border border-primary/10" />
                                <span>20 - 39%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-4 w-8 rounded bg-primary/45 border border-primary/15" />
                                <span>40 - 59%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-4 w-8 rounded bg-primary/65 border border-primary/20" />
                                <span>60 - 79%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-4 w-8 rounded bg-primary text-primary-foreground border-primary/20" />
                                <span>80 - 100%</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
