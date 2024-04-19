import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/src/renderer/components/shadcn/lib/utils';

type RangeSliderProps = {
  thumb1Label?: string;
  thumb2Label?: string;
};

const RangeSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & RangeSliderProps>(({ className, thumb1Label, thumb2Label, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn('relative flex w-full touch-none select-none items-center', className)} {...props}>
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="flex justify-center items-start h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
      {thumb1Label && <div className="mt-4 text-xs">{thumb1Label}</div>}
    </SliderPrimitive.Thumb>
    <SliderPrimitive.Thumb className="flex justify-center items-start h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
      {thumb2Label && <div className="mt-4 text-xs">{thumb2Label}</div>}
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));
RangeSlider.displayName = SliderPrimitive.Root.displayName;

export { RangeSlider };
