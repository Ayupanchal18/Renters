import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AlertCircle, TrendingUp } from "lucide-react";

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);
};

export default function RevenueChart({ data, period, onPeriodChange, loading, error }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    // Compute theme-reactive colors from CSS custom properties
    const gridColor = isDark ? "hsl(217 33% 17%)" : "hsl(214 32% 91%)";
    const axisColor = isDark ? "hsl(215 20% 65%)" : "hsl(215 16% 40%)";
    const tooltipBg = isDark ? "hsl(222 47% 11%)" : "hsl(0 0% 100%)";
    const tooltipBorder = isDark ? "hsl(217 33% 17%)" : "hsl(214 32% 91%)";

    return (
        <Card className="col-span-4 shadow-sm border border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Revenue Breakdown
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Stacked daily earnings by transaction category
                    </p>
                </div>
                <div className="flex items-center gap-1.5 bg-muted p-1 rounded-md self-end sm:self-auto">
                    {["30d", "60d", "90d"].map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? "default" : "ghost"}
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => onPeriodChange(p)}
                        >
                            {p.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                {loading ? (
                    <div className="h-[350px] w-full flex items-center justify-center bg-muted/30 rounded-md animate-pulse">
                        <span className="text-sm text-muted-foreground">Loading chart metrics...</span>
                    </div>
                ) : error ? (
                    <div className="h-[350px] w-full flex flex-col items-center justify-center bg-destructive/5 rounded-md border border-destructive/15">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <span className="text-sm font-medium text-destructive">Failed to load revenue data</span>
                        <span className="text-xs text-muted-foreground mt-1">{error}</span>
                    </div>
                ) : (
                    <div className="h-[350px] w-full font-sans" key={resolvedTheme}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="colorList" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="colorBoost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    style={{ fontSize: "11px", fill: axisColor }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tickFormatter={(val) => `₹${val}`}
                                    style={{ fontSize: "11px", fill: axisColor }}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const totalVal = payload.reduce((acc, curr) => acc + curr.value, 0);
                                            return (
                                                <div style={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }} className="shadow-lg rounded-lg p-3 space-y-1.5 font-sans">
                                                    <p className="text-xs font-bold text-muted-foreground">{label}</p>
                                                    <div className="space-y-1">
                                                        {payload.map((item) => (
                                                            <div key={item.name} className="flex items-center justify-between gap-6 text-xs">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        className="h-2 w-2 rounded-full"
                                                                        style={{ backgroundColor: item.color }}
                                                                    />
                                                                    <span className="text-muted-foreground capitalize">
                                                                        {item.name.replace("_", " ")}
                                                                    </span>
                                                                </div>
                                                                <span className="font-semibold text-foreground">
                                                                    {formatCurrency(item.value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="border-t border-border pt-1.5 flex items-center justify-between text-xs font-bold text-foreground">
                                                        <span>Total Revenue</span>
                                                        <span>{formatCurrency(totalVal)}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span className="text-xs font-medium text-muted-foreground capitalize">
                                            {value.replace("_", " ")}
                                        </span>
                                    )}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="subscription"
                                    stackId="1"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorSub)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="listing_fee"
                                    stackId="1"
                                    stroke="hsl(var(--success))"
                                    fillOpacity={1}
                                    fill="url(#colorList)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="featured_boost"
                                    stackId="1"
                                    stroke="hsl(var(--warning))"
                                    fillOpacity={1}
                                    fill="url(#colorBoost)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
