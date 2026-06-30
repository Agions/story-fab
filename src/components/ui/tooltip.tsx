import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from '@/shared/utils/cn'

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

/**
 * Tooltip component supporting two patterns:
 *
 * 1. Simple API (with `title` prop):
 *    <Tooltip title="Save"><button>Click</button></Tooltip>
 *
 * 2. Compound API (with TooltipTrigger + TooltipContent):
 *    <Tooltip>
 *      <TooltipTrigger render={<button />} />
 *      <TooltipContent>Save</TooltipContent>
 *    </Tooltip>
 */
function Tooltip({ title, children, ...props }: TooltipPrimitive.Root.Props & { title?: React.ReactNode }) {
  const childArray = React.Children.toArray(children as React.ReactNode)
  const hasCompoundTrigger = childArray.some(
    (child) => React.isValidElement(child) && (child.type as { displayName?: string } | undefined)?.displayName === 'TooltipTrigger'
  )
  const hasCompoundContent = childArray.some(
    (child) => React.isValidElement(child) && (child.type as { displayName?: string } | undefined)?.displayName === 'TooltipContent'
  )

  // Compound API: children contain TooltipTrigger and/or TooltipContent
  if (hasCompoundTrigger || hasCompoundContent) {
    return (
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        {children as React.ReactNode}
      </TooltipPrimitive.Root>
    )
  }

  // Simple API: render internal trigger + popup from `title`
  return (
    <TooltipPrimitive.Root data-slot="tooltip" {...props}>
      <TooltipPrimitive.Trigger render={<span />}>
        {children as React.ReactNode}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner sideOffset={4}>
          <div className="z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
            {title}
          </div>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

Tooltip.displayName = 'Tooltip'

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}
TooltipTrigger.displayName = 'TooltipTrigger'

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
