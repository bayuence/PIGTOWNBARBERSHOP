import * as React from "react"
import { cn } from "@/lib/utils"

const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full overflow-x-auto rounded-md border", className)}
    {...props}
  />
))
ResponsiveTable.displayName = "ResponsiveTable"

const ResponsiveTableWrapper = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full caption-bottom text-sm min-w-[600px]", className)}
    {...props}
  />
))
ResponsiveTableWrapper.displayName = "ResponsiveTableWrapper"

export { ResponsiveTable, ResponsiveTableWrapper }
