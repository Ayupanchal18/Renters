import { useState, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calculator, IndianRupee, TrendingDown, Percent, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";
import { calculateEMI } from "@shared/utils/emi";

function formatCurrency(amount) {
    if (!amount && amount !== 0) return "—";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${new Intl.NumberFormat("en-IN").format(Math.round(amount))}`;
}

function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
}

// Custom tooltip for the pie chart
function PieTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-card border border-border shadow-lg rounded-rt-md px-3 py-2 text-sm">
            <p className="font-semibold text-foreground">{payload[0].name}</p>
            <p className="text-muted-foreground">{formatINR(payload[0].value)}</p>
            <p className="text-xs text-muted-foreground">
                {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
            </p>
        </div>
    );
}

export default function EmiCalculator({ propertyPrice = 0 }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    // Input state
    const [price, setPrice] = useState(propertyPrice || 0);
    const [downPaymentMode, setDownPaymentMode] = useState("percent"); // "percent" | "amount"
    const [downPaymentPct, setDownPaymentPct] = useState(20); // 20% default
    const [downPaymentAmt, setDownPaymentAmt] = useState(
        propertyPrice ? Math.round(propertyPrice * 0.2) : 0
    );
    const [tenure, setTenure] = useState(20); // years
    const [interestRate, setInterestRate] = useState(8.5); // %

    // Derived principal
    const downPayment =
        downPaymentMode === "percent"
            ? Math.round((price * downPaymentPct) / 100)
            : downPaymentAmt;
    const principal = Math.max(0, price - downPayment);

    // EMI calculation
    const { emi, totalInterest, totalAmount } = useMemo(
        () => calculateEMI(principal, interestRate, tenure),
        [principal, interestRate, tenure]
    );

    // Pie chart data
    const pieData = useMemo(() => {
        const total = principal + totalInterest;
        return [
            { name: "Principal", value: principal, total },
            { name: "Interest", value: totalInterest, total },
        ];
    }, [principal, totalInterest]);

    const PIE_COLORS = isDark
        ? ["hsl(228 100% 65%)", "hsl(1 100% 77%)"]
        : ["hsl(228 100% 58%)", "hsl(1 100% 70%)"];

    // Input handlers
    const handlePriceChange = useCallback((e) => {
        const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
        setPrice(val);
        if (downPaymentMode === "percent") {
            setDownPaymentAmt(Math.round((val * downPaymentPct) / 100));
        }
    }, [downPaymentMode, downPaymentPct]);

    const handleDownPctChange = useCallback((vals) => {
        const pct = vals[0];
        setDownPaymentPct(pct);
        setDownPaymentAmt(Math.round((price * pct) / 100));
    }, [price]);

    const handleDownAmtChange = useCallback((e) => {
        const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
        setDownPaymentAmt(val);
        setDownPaymentPct(price > 0 ? Math.round((val / price) * 100) : 0);
    }, [price]);

    const handleTenureChange = useCallback((vals) => setTenure(vals[0]), []);

    const handleRateChange = useCallback((e) => {
        const val = parseFloat(e.target.value) || 0;
        setInterestRate(Math.min(30, Math.max(0, val)));
    }, []);

    const toggleDownPaymentMode = useCallback(() => {
        setDownPaymentMode((m) => (m === "percent" ? "amount" : "percent"));
    }, []);

    return (
        <Card variant="glass" className="w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-rt-md bg-primary/10 flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-primary" />
                    </div>
                    EMI / Mortgage Calculator
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                    Estimate your monthly payment before making a decision
                </p>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ── Left Column: Inputs ── */}
                    <div className="space-y-5">
                        {/* Property Price */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5" />
                                Property Price
                            </label>
                            <Input
                                type="number"
                                value={price || ""}
                                onChange={handlePriceChange}
                                placeholder="Enter property price"
                                className="h-10"
                            />
                            <p className="text-xs text-muted-foreground">{price > 0 ? formatCurrency(price) : ""}</p>
                        </div>

                        {/* Down Payment */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    Down Payment
                                </label>
                                <button
                                    onClick={toggleDownPaymentMode}
                                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-0.5 rounded-full border border-primary/20 hover:bg-primary/5"
                                >
                                    Switch to {downPaymentMode === "percent" ? "₹ Amount" : "% Percent"}
                                </button>
                            </div>
                            {downPaymentMode === "percent" ? (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-foreground">{downPaymentPct}%</span>
                                        <span className="text-muted-foreground text-xs">{formatCurrency(downPayment)}</span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={90}
                                        step={1}
                                        value={[downPaymentPct]}
                                        onValueChange={handleDownPctChange}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>0%</span><span>90%</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Input
                                        type="number"
                                        value={downPaymentAmt || ""}
                                        onChange={handleDownAmtChange}
                                        placeholder="Enter down payment amount"
                                        className="h-10"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {downPaymentPct}% of property price
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Loan Tenure */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Loan Tenure
                            </label>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-foreground">{tenure} Years</span>
                                <span className="text-muted-foreground text-xs">{tenure * 12} months</span>
                            </div>
                            <Slider
                                min={5}
                                max={30}
                                step={1}
                                value={[tenure]}
                                onValueChange={handleTenureChange}
                                className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>5 yrs</span><span>30 yrs</span>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <Percent className="w-3.5 h-3.5" />
                                Interest Rate (% per annum)
                            </label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="30"
                                value={interestRate}
                                onChange={handleRateChange}
                                className="h-10"
                            />
                        </div>

                        {/* Loan Amount */}
                        <div className="bg-primary/5 border border-primary/15 rounded-rt-md p-3">
                            <p className="text-xs text-muted-foreground mb-0.5">Loan Amount</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(principal)}</p>
                        </div>
                    </div>

                    {/* ── Right Column: Results + Chart ── */}
                    <div className="space-y-4 flex flex-col">
                        {/* Monthly EMI — prominent */}
                        <div className={cn(
                            "rounded-rt-lg p-4 text-center",
                            emi > 0
                                ? "bg-gradient-to-br from-primary to-primary/80 text-white"
                                : "bg-muted text-muted-foreground"
                        )}>
                            <p className="text-xs font-medium opacity-80 mb-1">Monthly EMI</p>
                            <p className={cn(
                                "text-3xl font-black",
                                emi > 0 ? "text-white" : "text-muted-foreground"
                            )}>
                                {emi > 0 ? formatINR(emi) : "—"}
                            </p>
                            {emi > 0 && (
                                <p className="text-xs opacity-75 mt-1">per month for {tenure} years</p>
                            )}
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/50 rounded-rt-md p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Interest</p>
                                <p className="text-sm font-bold text-secondary">
                                    {totalInterest > 0 ? formatCurrency(totalInterest) : "—"}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-rt-md p-3 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Payable</p>
                                <p className="text-sm font-bold text-foreground">
                                    {totalAmount > 0 ? formatCurrency(totalAmount) : "—"}
                                </p>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        {emi > 0 && (
                            <div className="flex-1 min-h-[180px]" key={resolvedTheme}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="45%"
                                            outerRadius="70%"
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                                <span className="text-xs font-medium text-muted-foreground">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <p className="text-[10px] text-muted-foreground/70 text-center leading-relaxed">
                            * Indicative calculation only. Actual EMI may vary based on lender terms, processing fees, and credit score.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
