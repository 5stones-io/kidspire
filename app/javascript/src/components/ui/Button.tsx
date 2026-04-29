import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Link, type LinkProps } from "react-router-dom"
import type { ButtonHTMLAttributes } from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:  "bg-primary text-primary-foreground hover:bg-primary/90",
        accent:   "bg-accent text-accent-foreground hover:bg-accent/90 shadow-playful",
        outline:  "border border-border bg-transparent text-foreground hover:bg-secondary",
        ghost:    "bg-transparent text-foreground hover:bg-secondary",
        danger:   "bg-destructive text-white hover:opacity-90",
      },
      size: {
        sm:   "px-4 py-2 text-sm rounded-full",
        md:   "px-5 py-2.5 text-sm rounded-full",
        lg:   "px-7 py-3 text-base rounded-full",
        icon: "p-2 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}

interface ButtonLinkProps extends LinkProps, VariantProps<typeof buttonVariants> {
  className?: string
}

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
