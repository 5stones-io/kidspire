import { User, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import type { Child } from "@/types"

interface ChildCardProps {
  child: Child
  onRemove?: (id: number) => void
}

function isComplete(child: Child) {
  return !!(child.birthdate && child.grade !== null)
}

export function ChildCard({ child, onRemove }: ChildCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User size={20} />
      </div>

      <CardContent className="flex-1 p-0">
        <p className="font-semibold text-foreground">{child.full_name}</p>

        <div className="mt-1 flex flex-wrap gap-1.5">
          {child.grade_display && <Badge variant="default">{child.grade_display} grade</Badge>}
          {child.age != null    && <Badge variant="muted">{child.age} yrs</Badge>}
        </div>

        {child.notes && (
          <p className="mt-1.5 text-xs text-muted-foreground">{child.notes}</p>
        )}

        {!isComplete(child) && (
          <Link
            to="/portal/profile"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
          >
            ⚠ Complete profile — add birthdate &amp; grade
          </Link>
        )}
      </CardContent>

      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(child.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </Card>
  )
}
