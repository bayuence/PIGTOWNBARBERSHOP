/**
 * Branch Card Component
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, MapPin, Phone, Clock } from "lucide-react"
import { formatBranchStatus, getStatusColor, formatTime } from "@/lib/utils/branch-helpers"
import type { Branch } from "@/components/branches/types"

export interface BranchCardProps {
  branch: Branch
  onViewDetail: () => void
  onEdit: () => void
  onDelete: () => void
}

export function BranchCard({ branch, onViewDetail, onEdit, onDelete }: BranchCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{branch.name}</h3>
            <p className="text-sm text-muted-foreground">Manager: {branch.manager || "-"}</p>
          </div>
          <Badge className={getStatusColor(branch.status)}>
            {formatBranchStatus(branch.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">{branch.address || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{branch.phone || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(branch.openTime)} - {formatTime(branch.closeTime)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onViewDetail} className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Detail
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1">
            <Trash2 className="h-3 w-3 mr-1" />
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
