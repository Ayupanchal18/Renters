import React from 'react';
import { cn } from "@/lib/utils";

function Skeleton({ className, shimmer = false, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        shimmer && "shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
