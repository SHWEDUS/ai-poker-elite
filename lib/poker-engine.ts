import type { GameState } from "@/types/poker"
import { createDeck, evaluateHand, getHandStrength } from "@/lib/poker-utils"

export interface BettingAction {
  playerId: string
  action: "fold" | "call" | "raise" | "check" | "all-in"
  amount: number
  phase: string
  timestamp: number
}

export class PokerEngine {
  private gameState: GameState
  private bettingHistory: BettingAction[] = []
  private lastRaiseAmount = 0

  constructor(initialState: GameState) {
    this.gameState = { ...initialState }
  }

  getGameState(): GameState {
    return { ...this.gameState }
  }

  getBettingHistory(): BettingAction[] {
    return [...this.bettingHistory]
  }

  startNewGame(): GameState {
    const deck = createDeck()
    this.bettingHistory = []
    this.lastRaiseAmount = this.gameState.bigBlind

    // Сброс игроков
    this.gameState.players = this.gameState.players.map((player) => ({
      ...player,
      hand: [],
      currentBet: 0,
      folded: false,
    }))

    this.gameState.players[0].hand = [deck[0], deck[1]]
    this.gameState.players[1].hand = [deck[2], deck[3]]

    // Установка блайндов
    this.gameState.players[0].currentBet = this.gameState.smallBlind
    this.gameState.players[0].chips -= this.gameState.smallBlind
    this.gameState.players[1].currentBet = this.gameState.bigBlind
    this.gameState.players[1].chips -= this.gameState.bigBlind

    this.bettingHistory.push({
      playerId: this.gameState.players[0].id,
      action: "check",
      amount: this.gameState.smallBlind,
      phase: "pre-flop",
      timestamp: Date.now(),
    })

    this.bettingHistory.push({
      playerId: this.gameState.players[1].id,
      action: "check",
      amount: this.gameState.bigBlind,
      phase: "pre-flop",
      timestamp: Date.now(),
    })

    this.gameState.pot = this.gameState.smallBlind + this.gameState.bigBlind
    this.gameState.communityCards = []
    this.gameState.gamePhase = "pre-flop"
    this.gameState.deck = deck.slice(4)
    this.gameState.currentPlayerIndex = 0

    return this.getGameState()
  }

  // Выполнить действие игрока
  playerAction(action: "fold" | "call" | "raise" | "check", raiseAmount?: number): GameState {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    const opponent = this.gameState.players[1 - this.gameState.currentPlayerIndex]

    if (!this.canPlayerAct()) {
      return this.getGameState()
    }

    let actualAction = action
    let betAmount = 0

    switch (action) {
      case "fold":
        currentPlayer.folded = true
        this.addBettingAction(currentPlayer.id, "fold", 0)
        this.endHand()
        break

      case "call":
        const callAmount = opponent.currentBet - currentPlayer.currentBet
        if (callAmount > 0) {
          if (callAmount >= currentPlayer.chips) {
            // All-in call
            betAmount = currentPlayer.chips
            currentPlayer.currentBet += currentPlayer.chips
            this.gameState.pot += currentPlayer.chips
            currentPlayer.chips = 0
            actualAction = "all-in"
          } else {
            betAmount = callAmount
            currentPlayer.chips -= callAmount
            currentPlayer.currentBet += callAmount
            this.gameState.pot += callAmount
          }
          this.addBettingAction(currentPlayer.id, actualAction, betAmount)
          this.nextPlayer()
        } else {
          this.addBettingAction(currentPlayer.id, "check", 0)
          this.nextPlayer()
        }
        break

      case "raise":
        if (raiseAmount && raiseAmount > 0) {
          const minRaise = Math.max(this.lastRaiseAmount, this.gameState.bigBlind)
          const totalBet = opponent.currentBet + Math.max(raiseAmount, minRaise)
          const additionalAmount = totalBet - currentPlayer.currentBet

          if (additionalAmount >= currentPlayer.chips) {
            // All-in raise
            betAmount = currentPlayer.chips
            currentPlayer.currentBet += currentPlayer.chips
            this.gameState.pot += currentPlayer.chips
            currentPlayer.chips = 0
            actualAction = "all-in"
          } else {
            betAmount = additionalAmount
            currentPlayer.chips -= additionalAmount
            currentPlayer.currentBet = totalBet
            this.gameState.pot += additionalAmount
            this.lastRaiseAmount = raiseAmount
          }
        }
        this.addBettingAction(currentPlayer.id, actualAction, betAmount)
        this.nextPlayer()
        break

      case "check":
        if (currentPlayer.currentBet === opponent.currentBet) {
          this.addBettingAction(currentPlayer.id, "check", 0)
          this.nextPlayer()
        }
        break
    }

    return this.getGameState()
  }

  // Переход к следующему игроку или фазе
  private nextPlayer(): void {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    const opponent = this.gameState.players[1 - this.gameState.currentPlayerIndex]

    const bothPlayersActed = this.hasBothPlayersActedThisRound()
    const betsAreEqual = currentPlayer.currentBet === opponent.currentBet
    const currentPlayerAllIn = currentPlayer.chips === 0
    const opponentAllIn = opponent.chips === 0

    // If current player went all-in, opponent must get a chance to respond
    if (currentPlayerAllIn && !bothPlayersActed) {
      this.gameState.currentPlayerIndex = 1 - this.gameState.currentPlayerIndex
      return
    }

    // If both players have acted and bets are equal, or both are all-in, go to next phase
    if (bothPlayersActed && (betsAreEqual || (currentPlayerAllIn && opponentAllIn))) {
      this.nextPhase()
    } else if (!bothPlayersActed) {
      // Switch to the other player if they haven't acted yet
      this.gameState.currentPlayerIndex = 1 - this.gameState.currentPlayerIndex
    } else {
      // Both acted but bets not equal - continue betting
      this.gameState.currentPlayerIndex = 1 - this.gameState.currentPlayerIndex
    }
  }

  private hasBothPlayersActedThisRound(): boolean {
    const currentPhaseActions = this.bettingHistory.filter((action) => action.phase === this.gameState.gamePhase)
    const player1Actions = currentPhaseActions.filter((action) => action.playerId === this.gameState.players[0].id)
    const player2Actions = currentPhaseActions.filter((action) => action.playerId === this.gameState.players[1].id)

    return player1Actions.length > 0 && player2Actions.length > 0
  }

  // Переход к следующей фазе игры
  private nextPhase(): void {
    const bothPlayersActed = this.hasBothPlayersActedThisRound()
    const someoneAllIn = this.gameState.players.some((player) => player.chips === 0)

    if (someoneAllIn && bothPlayersActed && this.gameState.gamePhase !== "river") {
      // Deal all remaining community cards and go to showdown
      while (this.gameState.communityCards.length < 5 && this.gameState.deck.length > 0) {
        this.gameState.communityCards.push(this.gameState.deck[0])
        this.gameState.deck = this.gameState.deck.slice(1)
      }
      this.gameState.gamePhase = "showdown"
      this.determineWinner()
      return
    }

    if (!someoneAllIn) {
      // Reset bets for new phase only if no one is all-in
      this.gameState.players.forEach((player) => {
        player.currentBet = 0
      })
    }

    this.lastRaiseAmount = this.gameState.bigBlind

    switch (this.gameState.gamePhase) {
      case "pre-flop":
        // Флоп - 3 карты
        this.gameState.communityCards = [this.gameState.deck[0], this.gameState.deck[1], this.gameState.deck[2]]
        this.gameState.deck = this.gameState.deck.slice(3)
        this.gameState.gamePhase = "flop"
        this.gameState.currentPlayerIndex = 0 // Игрок с малым блайндом ходит первым
        break

      case "flop":
        // Терн - 4-я карта
        this.gameState.communityCards.push(this.gameState.deck[0])
        this.gameState.deck = this.gameState.deck.slice(1)
        this.gameState.gamePhase = "turn"
        this.gameState.currentPlayerIndex = 0
        break

      case "turn":
        // Ривер - 5-я карта
        this.gameState.communityCards.push(this.gameState.deck[0])
        this.gameState.deck = this.gameState.deck.slice(1)
        this.gameState.gamePhase = "river"
        this.gameState.currentPlayerIndex = 0
        break

      case "river":
        // Вскрытие карт
        this.gameState.gamePhase = "showdown"
        this.determineWinner()
        break
    }
  }

  // Определение победителя
  private determineWinner(): void {
    const player1 = this.gameState.players[0]
    const player2 = this.gameState.players[1]

    if (player1.folded) {
      player2.chips += this.gameState.pot
      return
    }

    if (player2.folded) {
      player1.chips += this.gameState.pot
      return
    }

    // Оценка рук
    const player1Hand = evaluateHand([...player1.hand, ...this.gameState.communityCards])
    const player2Hand = evaluateHand([...player2.hand, ...this.gameState.communityCards])

    if (player1Hand.value > player2Hand.value) {
      player1.chips += this.gameState.pot
    } else if (player2Hand.value > player1Hand.value) {
      player2.chips += this.gameState.pot
    } else {
      // Ничья - делим банк
      const halfPot = Math.floor(this.gameState.pot / 2)
      player1.chips += halfPot
      player2.chips += this.gameState.pot - halfPot
    }
  }

  // Завершение раздачи
  private endHand(): void {
    const winner = this.gameState.players.find((p) => !p.folded)
    if (winner) {
      winner.chips += this.gameState.pot
    }
    this.gameState.gamePhase = "showdown"
  }

  // Получить возможные действия для текущего игрока
  getAvailableActions(): string[] {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    const opponent = this.gameState.players[1 - this.gameState.currentPlayerIndex]
    const actions: string[] = ["fold"]

    const callAmount = opponent.currentBet - currentPlayer.currentBet

    if (callAmount > 0) {
      // Opponent has a higher bet, so we can call (even if it means going all-in)
      actions.push("call")
    } else if (callAmount === 0) {
      // Bets are equal, so we can check
      actions.push("check")
    }

    // Can only raise if we have chips left after calling
    if (currentPlayer.chips > callAmount) {
      actions.push("raise")
    }

    return actions
  }

  // Получить минимальную ставку
  getMinimumRaise(): number {
    return Math.max(this.lastRaiseAmount, this.gameState.bigBlind)
  }

  canPlayerAct(): boolean {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex]
    return !currentPlayer.folded && this.gameState.gamePhase !== "showdown"
  }

  getGameInfo() {
    const aiPlayer = this.gameState.players.find((p) => p.isAI)!
    const humanPlayer = this.gameState.players.find((p) => !p.isAI)!

    const handStrength = getHandStrength(aiPlayer.hand, this.gameState.communityCards)
    const potOdds = this.gameState.pot > 0 ? (humanPlayer.currentBet - aiPlayer.currentBet) / this.gameState.pot : 0

    return {
      handStrength,
      potOdds,
      gamePhase: this.gameState.gamePhase,
      communityCards: this.gameState.communityCards.length,
      opponentBet: humanPlayer.currentBet,
      currentBet: aiPlayer.currentBet,
      pot: this.gameState.pot,
      chips: aiPlayer.chips,
    }
  }

  // Добавить запись о действии игрока
  private addBettingAction(playerId: string, action: BettingAction["action"], amount: number): void {
    this.bettingHistory.push({
      playerId,
      action,
      amount,
      phase: this.gameState.gamePhase,
      timestamp: Date.now(),
    })
  }
}
