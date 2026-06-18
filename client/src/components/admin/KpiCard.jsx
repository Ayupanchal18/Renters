import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Inline SVG sparkline — zero dependencies.
 * Takes an array of numbers and renders a path as a mini line chart.
 */
function Sparkline({ data = [], color = '#6366f1', height = 40, className }) {
  if (!data || data.length < 2) return null;

  const width = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  // Area fill path
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaD}
        fill={`url(#spark-grad-${color.replace('#', '')})`}
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

/**
 * KpiCard — Enhanced KPI card with sparkline chart.
 *
 * Props:
 *  label           — metric name
 *  value           — formatted display value (string or number)
 *  delta           — change string, e.g. "+12%" or "-3"
 *  deltaDirection  — 'up' | 'down' | 'neutral' (derived from delta if not provided)
 *  sparklineData   — array of numbers (7 points)
 *  icon            — lucide icon component
 *  color           — accent hex color (default indigo)
 *  onClick         — optional click handler
 *  loading         — show skeleton
 */
export default function KpiCard({
  label,
  value,
  delta,
  deltaDirection,
  sparklineData,
  icon: Icon,
  color = '#6366f1',
  onClick,
  loading = false,
}) {
  // Derive direction from delta string if not explicitly provided
  const direction = deltaDirection || (
    typeof delta === 'string'
      ? delta.startsWith('+') ? 'up' : delta.startsWith('-') ? 'down' : 'neutral'
      : 'neutral'
  );

  const deltaColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-500 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  const DeltaIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 text-left transition-all duration-200 group w-full',
        onClick && 'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        !onClick && 'cursor-default'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-foreground mb-1">
        {value ?? '—'}
      </div>

      {/* Delta */}
      {delta !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium mb-3', deltaColors[direction])}>
          <DeltaIcon className="h-3.5 w-3.5" />
          <span>{delta}</span>
          <span className="text-muted-foreground font-normal">vs last week</span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparklineData} color={color} height={36} />
        </div>
      )}
    </button>
  );
}
