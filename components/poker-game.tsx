"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { GameState } from "@/types/poker"
import { PokerEngine } from "@/lib/poker-engine"
import { PlayingCard } from "@/components/playing-card"
import { AIThinking } from "@/components/ai-thinking"
import { BettingHistory } from "@/components/betting-history"
import { Coins, Crown, TrendingUp } from "lucide-react"
import { HandEvaluation } from "@/components/hand-evaluation"

interface AIDecision {
  action: "fold" | "call" | "raise"
  raiseAmount?: number
  reasoning: string
  handStrength: number
  confidence: number
}

export function PokerGame() {
  const [engine, setEngine] = useState<PokerEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [raiseAmount, setRaiseAmount] = useState<number>(0)
  const [gameMessage, setGameMessage] = useState<string>("")
  const [aiThinking, setAiThinking] = useState<boolean>(false)
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null)
  
  useEffect(() => {
    initializeGame()
  }, [])
  
  const initializeGame = () => {
    const initialState: GameState = {
      players: [
        {
          id: "human",
          name: "Вы",
          chips: 1000,
          hand: [],
          currentBet: 0,
          folded: false,
          isAI: false,
        },
        {
          id: "ai",
          name: "ИИ Противник",
          chips: 1000,
          hand: [],
          currentBet: 0,
          folded: false,
          isAI: true,
        },
      ],
      communityCards: [],
      pot: 0,
      currentPlayerIndex: 0,
      gamePhase: "pre-flop",
      deck: [],
      smallBlind: 10,
      bigBlind: 20,
    }
    
    const newEngine = new PokerEngine(initialState)
    const newGameState = newEngine.startNewGame()
    
    setEngine(newEngine)
    setGameState(newGameState)
    setGameMessage("Новая игра началась! Ваш ход.")
  }
  
  const handlePlayerAction = (action: "fold" | "call" | "raise" | "check") => {
    if (!engine || !gameState) return
    
    if (action === "raise") {
      const minRaise = engine.getMinimumRaise()
      if (raiseAmount < minRaise) {
        setGameMessage(`Минимальный рейз: $${minRaise}`)
        return
      }
    }
    
    let newGameState: GameState
    
    if (action === "raise" && raiseAmount > 0) {
      newGameState = engine.playerAction("raise", raiseAmount)
      setGameMessage(`Вы повысили на $${raiseAmount}`)
    } else {
      newGameState = engine.playerAction(action)
      setGameMessage(`Вы сделали: ${getActionText(action)}`)
    }
    
    console.log("[v0] After player action:", {
      action,
      gamePhase: newGameState.gamePhase,
      currentPlayerIndex: newGameState.currentPlayerIndex,
      humanPlayer: newGameState.players[0],
      aiPlayer: newGameState.players[1],
      pot: newGameState.pot,
    })
    
    setGameState(newGameState)
    setRaiseAmount(0)
    setAiDecision(null)
    
    const shouldAIPlay =
      !newGameState.players[0].folded &&
      !newGameState.players[1].folded &&
      newGameState.gamePhase !== "showdown" &&
      newGameState.currentPlayerIndex === 1 && // AI's turn
      newGameState.players[1].chips > 0 // AI has chips to act
    
    const playerWentAllIn =
      newGameState.players[0].chips === 0 && newGameState.players[0].currentBet > newGameState.players[1].currentBet
    const shouldAIPlayAfterAllIn =
      playerWentAllIn && !newGameState.players[1].folded && newGameState.gamePhase !== "showdown"
    
    console.log("[v0] Should AI play?", shouldAIPlay || shouldAIPlayAfterAllIn)
    console.log("[v0] Player went all-in?", playerWentAllIn)
    
    if (shouldAIPlay || shouldAIPlayAfterAllIn) {
      setTimeout(() => handleAITurn(newGameState), 1000)
    }
  }
  
  const handleAITurn = async (currentState: GameState) => {
    if (!engine) return
    
    setAiThinking(true)
    setGameMessage("ИИ анализирует ситуацию...")
    
    try {
      const aiPlayer = currentState.players[1]
      const humanPlayer = currentState.players[0]
      
      const response = await fetch("/api/ai-poker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameState: currentState,
          playerCards: aiPlayer.hand,
          communityCards: currentState.communityCards,
          currentBet: humanPlayer.currentBet - aiPlayer.currentBet,
          playerChips: aiPlayer.chips,
        }),
      })
      
      const decision: AIDecision = await response.json()
      setAiDecision(decision)
      setAiThinking(false)
      
      const newGameState = engine.playerAction(
        decision.action,
        decision.action === "raise" ? decision.raiseAmount : undefined,
      )
      
      setGameState(newGameState)
      setGameMessage(
        `ИИ: ${getActionText(decision.action)}${decision.action === "raise" ? ` на $${decision.raiseAmount}` : ""}`,
      )
    } catch (error) {
      console.error("AI Error:", error)
      setAiThinking(false)
      
      const availableActions = engine.getAvailableActions()
      const aiAction = availableActions.includes("call") ? "call" : "check"
      const newGameState = engine.playerAction(aiAction)
      setGameState(newGameState)
      setGameMessage(`ИИ: ${getActionText(aiAction)} (резервное решение)`)
    }
  }
  
  const getActionText = (action: string): string => {
    switch (action) {
      case "fold":
        return "Сброс"
      case "call":
        return "Колл"
      case "raise":
        return "Рейз"
      case "check":
        return "Чек"
      default:
        return action
    }
  }
  
  const getPhaseText = (phase: string): string => {
    switch (phase) {
      case "pre-flop":
        return "Префлоп"
      case "flop":
        return "Флоп"
      case "turn":
        return "Терн"
      case "river":
        return "Ривер"
      case "showdown":
        return "Вскрытие"
      default:
        return phase
    }
  }
  
  if (!gameState || !engine) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <div className="text-white">Загрузка игры...</div>
      </div>
    )
  }
  
  const humanPlayer = gameState.players[0]
  const aiPlayer = gameState.players[1]
  const isPlayerTurn = gameState.currentPlayerIndex === 0 && gameState.gamePhase !== "showdown"
  const availableActions = engine.getAvailableActions()
  const minRaise = engine.getMinimumRaise()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-poker-table)] via-[var(--color-poker-felt)] to-[var(--color-poker-table)] p-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-3">
            <AIThinking
              reasoning={aiDecision?.reasoning || ""}
              handStrength={aiDecision?.handStrength || 0}
              confidence={aiDecision?.confidence || 0}
              isThinking={aiThinking}
            />
            <BettingHistory
              history={engine.getBettingHistory()}
              players={gameState.players.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
          
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="relative overflow-hidden bg-card/95 backdrop-blur-sm border-2 border-[var(--color-poker-gold)]/20 shadow-2xl">
              <div className="relative bg-gradient-to-r from-[var(--color-poker-gold)]/10 to-primary bg-clip-text text-transparent p-4 border-b border-[var(--color-poker-gold)]/20">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="h-6 w-6 text-[var(--color-poker-gold)]" />
                    <h1 className="text-2xl font-bold">AI Poker Elite</h1>
                    <Crown className="h-6 w-6 text-[var(--color-poker-gold)]" />
                  </div>
                  <div className="flex items-center justify-center gap-4 text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 px-3 py-1 border-[var(--color-poker-gold)]/30"
                    >
                      <Coins className="h-3 w-3 text-[var(--color-poker-gold)]" />
                      Банк: ${gameState.pot}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 border-primary/30">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {getPhaseText(gameState.gamePhase)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-6 text-center">
                  <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-card to-muted/50 border border-border/50 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">AI</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground text-sm">{aiPlayer.name}</h3>
                        <p className="text-xs text-muted-foreground">Фишки: ${aiPlayer.chips}</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-2 mb-3">
                      {aiPlayer.hand.map((card, index) => (
                        <div key={index} className="card-deal">
                          <PlayingCard card={card} hidden={gameState.gamePhase !== "showdown"} />
                        </div>
                      ))}
                    </div>
                    <Badge
                      variant="secondary"
                      className="chip-stack bg-[var(--color-poker-chip-blue)] text-white text-xs"
                    >
                      Ставка: ${aiPlayer.currentBet}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Общие карты</h3>
                  <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-[var(--color-poker-felt)]/20 to-[var(--color-poker-table)]/20 border-2 border-[var(--color-poker-gold)]/20">
                    <div className="flex justify-center gap-3">
                      {gameState.communityCards.map((card, index) => (
                        <div key={index} className="card-deal" style={{ animationDelay: `${index * 0.1}s` }}>
                          <PlayingCard card={card} />
                        </div>
                      ))}
                      {Array.from({ length: 5 - gameState.communityCards.length }).map((_, index) => (
                        <div
                          key={`placeholder-${index}`}
                          className="w-12 h-18 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center"
                        >
                          <span className="text-muted-foreground/50 text-xs">?</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6 text-center">
                  <div className="inline-block p-4 rounded-xl bg-gradient-to-br from-card to-muted/50 border border-border/50 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                        <span className="text-secondary-foreground font-bold text-sm">Вы</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground text-sm">{humanPlayer.name}</h3>
                        <p className="text-xs text-muted-foreground">Фишки: ${humanPlayer.chips}</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-2 mb-3">
                      {humanPlayer.hand.map((card, index) => (
                        <div key={index} className="card-deal">
                          <PlayingCard card={card} />
                        </div>
                      ))}
                    </div>
                    <Badge
                      variant="secondary"
                      className="chip-stack bg-[var(--color-poker-chip-green)] text-white text-xs"
                    >
                      Ставка: ${humanPlayer.currentBet}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-poker-gold)]/10 to-primary/10 border border-[var(--color-poker-gold)]/20">
                    <p className="font-medium text-card-foreground text-sm">{gameMessage}</p>
                  </div>
                </div>
                
                {isPlayerTurn && (
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {availableActions.includes("fold") && (
                      <Button
                        onClick={() => handlePlayerAction("fold")}
                        variant="destructive"
                        size="default"
                        className="min-w-20 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Сброс
                      </Button>
                    )}
                    {availableActions.includes("check") && (
                      <Button
                        onClick={() => handlePlayerAction("check")}
                        variant="outline"
                        size="default"
                        className="min-w-20 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Чек
                      </Button>
                    )}
                    {availableActions.includes("call") && (
                      <Button
                        onClick={() => handlePlayerAction("call")}
                        variant="default"
                        size="default"
                        className="min-w-20 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Колл (${aiPlayer.currentBet - humanPlayer.currentBet})
                      </Button>
                    )}
                    {availableActions.includes("raise") && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={raiseAmount}
                          onChange={(e) => setRaiseAmount(Number(e.target.value))}
                          placeholder={`Мин: ${minRaise}`}
                          className="w-28 shadow-lg"
                          min={minRaise}
                          max={humanPlayer.chips}
                        />
                        <Button
                          onClick={() => handlePlayerAction("raise")}
                          variant="secondary"
                          size="default"
                          disabled={raiseAmount < minRaise}
                          className="min-w-20 bg-secondary hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Рейз
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-center">
                  <Button
                    onClick={initializeGame}
                    variant="outline"
                    size="default"
                    className="px-6 py-2 border-[var(--color-poker-gold)] text-[var(--color-poker-gold)] hover:bg-[var(--color-poker-gold)] hover:text-black shadow-lg hover:shadow-xl transition-all duration-200 bg-transparent"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Новая игра
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-1 order-3 lg:order-3">
            <HandEvaluation playerCards={humanPlayer.hand} communityCards={gameState.communityCards} />
          </div>
        </div>
      </div>
    </div>
  )
}
