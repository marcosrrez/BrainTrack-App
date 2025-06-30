import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium touch-target apple-focus relative overflow-hidden transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94) disabled:pointer-events-none disabled:opacity-50 transform active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "apple-button text-white shadow-lg hover:shadow-xl",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 hover:-translate-y-[1px]",
        outline:
          "border border-neutral-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-primary/30 hover:shadow-md magnetic-element",
        secondary:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-[1px]",
        ghost: "hover:bg-neutral-100/80 hover:backdrop-blur-sm magnetic-element",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 color-moment-primary",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }