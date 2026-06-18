import React, { useEffect, useState, useRef } from "react";
import { cn } from "../../lib/utils";

export function ScoreGauge({ score = 0, label = "Walk Score", type = "walk" }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    // Circumference of a circle with r = 40 is 2 * PI * 40 = 251.2
    const circumference = 251.2;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    // Qualitative labels
    const getQualitativeData = (scoreValue) => {
        if (type === "walk") {
            if (scoreValue >= 90) return { label: "Walker's Paradise", colorClass: "text-success", strokeClass: "stroke-success" };
            if (scoreValue >= 70) return { label: "Very Walkable", colorClass: "text-success", strokeClass: "stroke-success" };
            if (scoreValue >= 50) return { label: "Somewhat Walkable", colorClass: "text-warning", strokeClass: "stroke-warning" };
            if (scoreValue >= 25) return { label: "Car-Dependent", colorClass: "text-error", strokeClass: "stroke-error" };
            return { label: "Car-Dependent", colorClass: "text-error", strokeClass: "stroke-error" };
        } else {
            if (scoreValue >= 90) return { label: "Rider's Paradise", colorClass: "text-success", strokeClass: "stroke-success" };
            if (scoreValue >= 70) return { label: "Excellent Transit", colorClass: "text-success", strokeClass: "stroke-success" };
            if (scoreValue >= 50) return { label: "Good Transit", colorClass: "text-warning", strokeClass: "stroke-warning" };
            if (scoreValue >= 25) return { label: "Some Transit", colorClass: "text-error", strokeClass: "stroke-error" };
            return { label: "Minimal Transit", colorClass: "text-error", strokeClass: "stroke-error" };
        }
    };

    const qualData = getQualitativeData(score);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isVisible) {
            // Animate score increment
            let start = 0;
            const duration = 1200; // ms
            const stepTime = 16; // ms (~60fps)
            const steps = duration / stepTime;
            const increment = score / steps;

            const timer = setInterval(() => {
                start += increment;
                if (start >= score) {
                    setAnimatedScore(score);
                    clearInterval(timer);
                } else {
                    setAnimatedScore(Math.round(start));
                }
            }, stepTime);

            return () => clearInterval(timer);
        }
    }, [isVisible, score]);

    return (
        <div
            ref={containerRef}
            className="flex flex-col items-center justify-center text-center p-4 bg-muted/15 border border-border/40 rounded-2xl shadow-sm max-w-[180px] w-full"
            aria-label={`${label}: ${score} out of 100, ${qualData.label}`}
        >
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* SVG circular track and fill */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Track */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-muted/30 fill-transparent"
                        strokeWidth="8"
                    />
                    {/* Progress Fill */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className={cn("fill-transparent transition-all duration-300", qualData.strokeClass)}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 1s ease-out-sine" }}
                    />
                </svg>
                {/* Numeric score in center */}
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-foreground leading-none">
                        {animatedScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                        / 100
                    </span>
                </div>
            </div>

            <div className="mt-3.5 space-y-0.5">
                <span className="text-xs font-extrabold text-foreground block uppercase tracking-wide">
                    {label}
                </span>
                <span className={cn("text-[10px] font-bold block", qualData.colorClass)}>
                    {qualData.label}
                </span>
            </div>
        </div>
    );
}
