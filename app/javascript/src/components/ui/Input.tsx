import { cn } from "@/lib/cn"
import type { InputHTMLAttributes, LabelHTMLAttributes } from "react"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-foreground mb-1", className)}
      {...props}
    />
  )
}

export function FormField({
  label, id, error, children,
}: {
  label: string; id: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
