import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (jsonMatch) {
    return jsonMatch[1]
  }
  
  // If no code blocks, try to find JSON object directly
  const directJsonMatch = text.match(/\{[\s\S]*\}/)
  if (directJsonMatch) {
    return directJsonMatch[0]
  }
  
  return text
}

function getFallbackAIDecision(requestData: any) {
  const { gameState, playerCards, communityCards, currentBet, playerChips } = requestData
  
  // Simple AI logic based on hand strength
  const hasHighCard = playerCards.some((card: any) => ["A", "K", "Q", "J"].includes(card.rank))
  
  const hasPair = playerCards[0].rank === playerCards[1].rank
  
  const potOdds = currentBet / (gameState.pot + currentBet)
  const chipRatio = currentBet / playerChips
  
  let action = "fold"
  let reasoning = "Использую базовую логику (Groq API недоступен). "
  
  if (hasPair) {
    action = chipRatio < 0.3 ? "call" : "fold"
    reasoning += "У меня пара, принимаю консервативное решение."
  } else if (hasHighCard && potOdds < 0.3) {
    action = "call"
    reasoning += "Высокая карта и хорошие pot odds."
  } else if (currentBet === 0) {
    action = "call"
    reasoning += "Бесплатно посмотреть следующую карту."
  } else {
    reasoning += "Слабая рука, лучше сбросить."
  }
  
  return NextResponse.json({
    action,
    raiseAmount: 0,
    reasoning,
    handStrength: hasPair ? 7 : hasHighCard ? 5 : 3,
    confidence: 4,
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("[v0] GROQ_API_KEY not found, using fallback AI logic")
      return getFallbackAIDecision(await request.json())
    }
    
    const { gameState, playerCards, communityCards, currentBet, playerChips } = await request.json()
    
    const prompt = `
Ты профессиональный игрок в покер. Проанализируй текущую игровую ситуацию и прими решение.

ТВОИ КАРТЫ: ${playerCards.map((card: any) => `${card.rank}${card.suit}`).join(", ")}
ОБЩИЕ КАРТЫ: ${communityCards.map((card: any) => `${card.rank}${card.suit}`).join(", ")}
ТЕКУЩАЯ СТАВКА: ${currentBet}
ТВОИ ФИШКИ: ${playerChips}
ФАЗА ИГРЫ: ${gameState.phase}
БАНК: ${gameState.pot}

Проанализируй:
1. Силу твоей руки (текущие комбинации и потенциал)
2. Математические шансы (pot odds, implied odds)
3. Позицию и действия противника
4. Размер ставки относительно банка
5. Стратегические соображения

Ответь ТОЛЬКО в формате JSON без markdown:
{
  "action": "fold|call|raise",
  "raiseAmount": число (если action = "raise"),
  "reasoning": "подробное объяснение твоих рассуждений на русском языке",
  "handStrength": "оценка силы руки от 1 до 10",
  "confidence": "уверенность в решении от 1 до 10"
}

Будь логичным, но не слишком консервативным. Иногда блефуй, если ситуация подходящая.
`
    
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.7,
    })
    
    const cleanedText = extractJsonFromMarkdown(text.trim())
    console.log("[v0] AI Response:", text)
    console.log("[v0] Cleaned JSON:", cleanedText)
    
    const aiDecision = JSON.parse(cleanedText)
    
    return NextResponse.json(aiDecision)
  } catch (error) {
    console.error("AI Poker Error:", error)
    return getFallbackAIDecision(await request.json())
  }
}
