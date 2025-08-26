export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

export interface Card {
  suit: Suit
  rank: Rank
  id: string
}

export type HandRank =
  | "high-card"
  | "pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush"
  | "royal-flush"

export interface HandEvaluation {
  rank: HandRank
  value: number
  description: string
  cards: Card[]
}

export interface Player {
  id: string
  name: string
  chips: number
  hand: Card[]
  currentBet: number
  folded: boolean
  isAI: boolean
}

export interface GameState {
  players: Player[]
  communityCards: Card[]
  pot: number
  currentPlayerIndex: number
  gamePhase: "pre-flop" | "flop" | "turn" | "river" | "showdown"
  deck: Card[]
  smallBlind: number
  bigBlind: number
}

export interface AIThought {
  action: "fold" | "call" | "raise" | "check"
  reasoning: string
  confidence: number
  handStrength: number
}
