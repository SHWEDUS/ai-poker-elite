import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { BettingAction } from "@/lib/poker-engine"

interface BettingHistoryProps {
  history: BettingAction[]
  players: { id: string; name: string }[]
}

export function BettingHistory({ history, players }: BettingHistoryProps) {
  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || playerId
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "raise":
      case "all-in":
        return <TrendingUp className="h-3 w-3" />
      case "fold":
        return <TrendingDown className="h-3 w-3" />
      case "call":
      case "check":
        return <Minus className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "raise":
        return "bg-orange-500"
      case "all-in":
        return "bg-red-500"
      case "call":
        return "bg-green-500"
      case "check":
        return "bg-blue-500"
      case "fold":
        return "bg-gray-500"
      default:
        return "bg-muted"
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "fold":
        return "Сброс"
      case "call":
        return "Колл"
      case "raise":
        return "Рейз"
      case "check":
        return "Чек"
      case "all-in":
        return "Ва-банк"
      default:
        return action
    }
  }

  if (history.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            История ставок
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">История ставок пуста</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          История ставок
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {history.slice(-10).map((action, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${getActionColor(action.action)} text-white flex items-center gap-1 px-2 py-1`}
                  >
                    {getActionIcon(action.action)}
                    {getActionText(action.action)}
                  </Badge>
                  <span className="text-sm font-medium">{getPlayerName(action.playerId)}</span>
                </div>
                <div className="text-right">
                  {action.amount > 0 && <span className="text-sm font-semibold text-primary">${action.amount}</span>}
                  <div className="text-xs text-muted-foreground capitalize">{action.phase}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
