"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PokerGame } from "@/components/poker-game"

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center bg-green-800/20 border-green-600">
          <h1 className="text-4xl font-bold text-white mb-4">AI Poker</h1>
          <p className="text-green-100 mb-6">
            Играйте в покер против ИИ-противника, который думает и рассуждает о каждом ходе
          </p>
          <Button
            onClick={() => setGameStarted(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Начать игру
          </Button>
        </Card>
      </div>
    )
  }

  return <PokerGame />
}
