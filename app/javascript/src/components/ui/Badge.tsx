import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:  "bg-primary/10 text-primary",
        accent:   "bg-accent/10 text-accent",
        success:  "bg-green-500/10 text-green-600",
        warning:  "bg-yellow-500/10 text-yellow-600",
        error:    "bg-destructive/10 text-destructive",
        muted:    "bg-card text-muted-foreground border border-border",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
