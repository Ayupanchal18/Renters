import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

const Slider = React.forwardRef(({ className, ...props }, ref) => {
    const value = props.value || props.defaultValue || [0];
    const thumbsCount = Array.isArray(value) ? value.length : 1;
    
    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn("relative flex w-full touch-none select-none items-center cursor-pointer", className)}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted border border-border/10">
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            {Array.from({ length: thumbsCount }).map((_, i) => (
                <SliderPrimitive.Thumb
                    key={i}
                    className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 active:scale-90 cursor-grab active:cursor-grabbing"
                />
            ))}
        </SliderPrimitive.Root>
    );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
