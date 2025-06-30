import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Edit, Trash2 } from "lucide-react";
import type { Memory } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface MemoryCardProps {
  memory: Memory;
  onPlay?: (memory: Memory) => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  showActions?: boolean;
}

export function MemoryCard({ 
  memory, 
  onPlay, 
  onEdit, 
  onDelete, 
  showActions = true 
}: MemoryCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "personal":
        return "bg-blue-100 text-blue-800";
      case "social":
        return "bg-green-100 text-green-800";
      case "educational":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEmotionColor = (emotion: number) => {
    if (emotion >= 8) return "bg-green-100 text-green-800";
    if (emotion >= 6) return "bg-yellow-100 text-yellow-800";
    if (emotion >= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-neutral-800 line-clamp-1">
                {memory.title}
              </h3>
              <Badge className={getTypeColor(memory.type)}>
                {memory.type}
              </Badge>
              <Badge className={getEmotionColor(memory.emotion)}>
                {memory.emotion}/10
              </Badge>
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
              {memory.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-neutral-500">
              <span>
                {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
              </span>
              {memory.location && <span>{memory.location}</span>}
              <span>
                Next review: {formatDistanceToNow(new Date(memory.nextReview), { addSuffix: true })}
              </span>
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col space-y-2 ml-4">
              {onPlay && (
                <Button size="sm" variant="ghost" onClick={() => onPlay(memory)}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(memory)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onDelete(memory)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      {memory.tags && memory.tags.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {memory.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
