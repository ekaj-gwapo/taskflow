'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

const Root = ProgressPrimitive.Root as any
const Indicator = ProgressPrimitive.Indicator as any

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number | null }
>(({ className, value, ...props }, ref) => (
  <Root
    asChild
    value={value || 0}
  >
    <div
      ref={ref}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
      {...props}
    >
      <Indicator
        asChild
      >
        <div 
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </Indicator>
    </div>
  </Root>
))
Progress.displayName = "Progress"

export { Progress }
