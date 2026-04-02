import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-blue-600 text-white shadow hover:bg-blue-700",
                destructive:
                    "bg-red-500 text-white shadow-sm hover:bg-red-600",
                outline:
                    "border border-gray-200 bg-white shadow-sm hover:bg-gray-100 text-gray-700",
                secondary:
                    "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
                ghost: "hover:bg-gray-100 text-gray-700",
                link: "text-blue-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-12 rounded-md px-8 text-base",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    if (asChild) {
        return (
            <Slot
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                {children}
            </Slot>
        )
    }

    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
