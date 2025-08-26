import type { Card } from "@/types/poker"

interface PlayingCardProps {
  card: Card
  hidden?: boolean
}

export function PlayingCard({ card, hidden = false }: PlayingCardProps) {
  if (hidden) {
    return (
      <div className="w-16 h-24 bg-blue-900 border-2 border-blue-700 rounded-lg flex items-center justify-center">
        <div className="text-blue-300 text-xs">🂠</div>
      </div>
    )
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥"
      case "diamonds":
        return "♦"
      case "clubs":
        return "♣"
      case "spades":
        return "♠"
      default:
        return ""
    }
  }

  const getSuitColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-black"
  }

  return (
    <div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 shadow-md">
      <div className={`text-sm font-bold ${getSuitColor(card.suit)}`}>{card.rank}</div>
      <div className={`text-2xl ${getSuitColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
      <div className={`text-sm font-bold ${getSuitColor(card.suit)} rotate-180`}>{card.rank}</div>
    </div>
  )
}
