import type { Card, Suit, Rank, HandEvaluation } from "@/types/poker"

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${rank}-${suit}`,
      })
    }
  }
  return shuffleDeck(deck)
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getRankValue(rank: Rank): number {
  const values: Record<Rank, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  }
  return values[rank]
}

export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    return {
      rank: "high-card",
      value: 0,
      description: "Недостаточно карт",
      cards: [],
    }
  }

  // Сортируем карты по убыванию
  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))

  // Проверяем на флеш
  const isFlush = checkFlush(sortedCards)

  // Проверяем на стрит
  const straightResult = checkStraight(sortedCards)

  // Группируем карты по рангу
  const rankGroups = groupByRank(sortedCards)
  const groupSizes = Object.values(rankGroups)
    .map((group) => group.length)
    .sort((a, b) => b - a)

  // Определяем комбинацию
  if (isFlush && straightResult.isStraight) {
    if (straightResult.highCard === 14) {
      // Ace high straight flush
      return {
        rank: "royal-flush",
        value: 10000,
        description: "Роял-флеш",
        cards: straightResult.cards,
      }
    }
    return {
      rank: "straight-flush",
      value: 9000 + straightResult.highCard,
      description: "Стрит-флеш",
      cards: straightResult.cards,
    }
  }

  if (groupSizes[0] === 4) {
    return {
      rank: "four-of-a-kind",
      value: 8000 + getRankValue(Object.keys(rankGroups).find((rank) => rankGroups[rank].length === 4)! as Rank),
      description: "Каре",
      cards: sortedCards.slice(0, 5),
    }
  }

  if (groupSizes[0] === 3 && groupSizes[1] === 2) {
    return {
      rank: "full-house",
      value: 7000 + getRankValue(Object.keys(rankGroups).find((rank) => rankGroups[rank].length === 3)! as Rank),
      description: "Фулл-хаус",
      cards: sortedCards.slice(0, 5),
    }
  }

  if (isFlush) {
    return {
      rank: "flush",
      value: 6000 + getRankValue(sortedCards[0].rank),
      description: "Флеш",
      cards: sortedCards.slice(0, 5),
    }
  }

  if (straightResult.isStraight) {
    return {
      rank: "straight",
      value: 5000 + straightResult.highCard,
      description: "Стрит",
      cards: straightResult.cards,
    }
  }

  if (groupSizes[0] === 3) {
    return {
      rank: "three-of-a-kind",
      value: 4000 + getRankValue(Object.keys(rankGroups).find((rank) => rankGroups[rank].length === 3)! as Rank),
      description: "Тройка",
      cards: sortedCards.slice(0, 5),
    }
  }

  if (groupSizes[0] === 2 && groupSizes[1] === 2) {
    return {
      rank: "two-pair",
      value: 3000 + getRankValue(sortedCards[0].rank),
      description: "Две пары",
      cards: sortedCards.slice(0, 5),
    }
  }

  if (groupSizes[0] === 2) {
    return {
      rank: "pair",
      value: 2000 + getRankValue(Object.keys(rankGroups).find((rank) => rankGroups[rank].length === 2)! as Rank),
      description: "Пара",
      cards: sortedCards.slice(0, 5),
    }
  }

  return {
    rank: "high-card",
    value: 1000 + getRankValue(sortedCards[0].rank),
    description: "Старшая карта",
    cards: sortedCards.slice(0, 5),
  }
}

function checkFlush(cards: Card[]): boolean {
  const suitCounts: Record<string, number> = {}
  for (const card of cards) {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1
    if (suitCounts[card.suit] >= 5) return true
  }
  return false
}

function checkStraight(cards: Card[]): { isStraight: boolean; highCard: number; cards: Card[] } {
  const uniqueRanks = [...new Set(cards.map((card) => getRankValue(card.rank)))].sort((a, b) => b - a)

  // Проверяем обычный стрит
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    let consecutive = 1
    for (let j = i + 1; j < uniqueRanks.length && consecutive < 5; j++) {
      if (uniqueRanks[j] === uniqueRanks[j - 1] - 1) {
        consecutive++
      } else {
        break
      }
    }
    if (consecutive >= 5) {
      return {
        isStraight: true,
        highCard: uniqueRanks[i],
        cards: cards
          .filter((card) => {
            const value = getRankValue(card.rank)
            return value <= uniqueRanks[i] && value >= uniqueRanks[i] - 4
          })
          .slice(0, 5),
      }
    }
  }

  // Проверяем A-2-3-4-5 стрит
  if (
    uniqueRanks.includes(14) &&
    uniqueRanks.includes(2) &&
    uniqueRanks.includes(3) &&
    uniqueRanks.includes(4) &&
    uniqueRanks.includes(5)
  ) {
    return {
      isStraight: true,
      highCard: 5,
      cards: cards.filter((card) => ["A", "2", "3", "4", "5"].includes(card.rank)).slice(0, 5),
    }
  }

  return { isStraight: false, highCard: 0, cards: [] }
}

function groupByRank(cards: Card[]): Record<string, Card[]> {
  const groups: Record<string, Card[]> = {}
  for (const card of cards) {
    if (!groups[card.rank]) groups[card.rank] = []
    groups[card.rank].push(card)
  }
  return groups
}

export function getHandStrength(playerCards: Card[], communityCards: Card[]): number {
  const allCards = [...playerCards, ...communityCards]
  const evaluation = evaluateHand(allCards)
  return evaluation.value / 10000 // Нормализуем от 0 до 1
}
