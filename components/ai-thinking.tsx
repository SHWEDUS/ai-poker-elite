import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, Target } from "lucide-react"

interface AIThinkingProps {
  reasoning: string
  handStrength: number
  confidence: number
  isThinking: boolean
}

export function AIThinking({ reasoning, handStrength, confidence, isThinking }: AIThinkingProps) {
  if (isThinking) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 animate-pulse" />
            ИИ думает...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!reasoning) return null

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          Рассуждения ИИ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{reasoning}</p>

        <div className="flex gap-2 flex-col">
          <Badge variant="outline" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Сила руки: {handStrength}/10
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Уверенность: {confidence}/10
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
