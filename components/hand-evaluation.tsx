"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Card as PokerCard } from "@/types/poker"
import { evaluateHand } from "@/lib/poker-utils"
import { Target, TrendingUp } from "lucide-react"

interface HandEvaluationProps {
	playerCards: PokerCard[]
	communityCards: PokerCard[]
}

export function HandEvaluation({ playerCards, communityCards }: HandEvaluationProps) {
	const allCards = [...playerCards, ...communityCards]
	const evaluation = evaluateHand(allCards)
	
	const getHandStrengthColor = (rank: string) => {
		switch (rank) {
			case "royal-flush":
			case "straight-flush":
				return "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
			case "four-of-a-kind":
				return "bg-gradient-to-r from-red-500 to-orange-500 text-white"
			case "full-house":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
			case "flush":
				return "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
			case "straight":
				return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
			case "three-of-a-kind":
				return "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
			case "two-pair":
				return "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
			case "pair":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
			default:
				return "bg-gradient-to-r from-gray-400 to-gray-600 text-white"
		}
	}
	
	const getHandStrengthText = (value: number) => {
		if (value >= 9000) return "Очень сильная"
		if (value >= 7000) return "Сильная"
		if (value >= 4000) return "Хорошая"
		if (value >= 2000) return "Средняя"
		return "Слабая"
	}
	
	return (
		<Card className="bg-card/95 backdrop-blur-sm border-2 border-[var(--color-poker-gold)]/20 shadow-lg">
			<div className="p-4">
				<div className="flex items-center gap-2 mb-4">
					<Target className="h-5 w-5 text-[var(--color-poker-gold)]" />
					<h3 className="font-semibold text-card-foreground">Ваша комбинация</h3>
				</div>
				
				<div className="space-y-3">
					<div className="text-center">
						<Badge className={`px-3 py-2 text-sm font-semibold ${getHandStrengthColor(evaluation.rank)}`}>
							{evaluation.description}
						</Badge>
					</div>
					
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Сила руки:</span>
						<div className="flex items-center gap-2">
							<TrendingUp className="h-4 w-4 text-primary" />
							<span className="font-medium text-card-foreground">{getHandStrengthText(evaluation.value)}</span>
						</div>
					</div>
					
					<div className="w-full bg-muted rounded-full h-2">
						<div
							className="bg-gradient-to-r from-[var(--color-poker-gold)] to-primary h-2 rounded-full transition-all duration-500"
							style={{ width: `${Math.min((evaluation.value / 10000) * 100, 100)}%` }}
						/>
					</div>
					
					<div className="text-xs text-muted-foreground text-center">Значение: {evaluation.value}</div>
				</div>
			</div>
		</Card>
	)
}
