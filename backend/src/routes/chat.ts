import { Router, Request, Response } from 'express'
import { analysisChain } from '../services/llm'
import { retrieveSimilarGames } from '../services/pinecone'
import prisma from '../services/prisma'

const router = Router()

interface ChatRequest {
    message: string
    userId: number
    teamId?: number
}

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
    try {
        const { message, userId, teamId } = req.body as ChatRequest

        // Validate input
        if (!message || !userId) {
            return res.status(400).json({ error: 'Missing required fields' })
        }

        // Get team info if provided
        let teamContext = ''
        if (teamId) {
            const team = await prisma.team.findUnique({
                where: { id: teamId },
                include: { games: { take: 5, orderBy: { date: 'desc' } } },
            })

            if (team) {
                teamContext = `Team: ${team.teamName} (${team.sport})\nRecent games: ${
                    team.games.map((g: any) => `${team.teamName} ${g.score}-${g.opponentScore} vs ${g.opponent}`).join(', ')
                }`
            }
        }

        // Retrieve context from Pinecone (RAG)
        const similarGames = await retrieveSimilarGames(message, 5)
        const context = similarGames
            .map(game => game.metadata?.text || '')
            .filter(Boolean)
            .join('\n\n')

        // Setup streaming response
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        try {
            // Stream response from LangChain
            const stream = await analysisChain.stream({
                context: context || teamContext || 'No specific game data available',
                question: message,
                sport: 'NBA', // TODO: Make dynamic based on team
            })

            let fullResponse = ''

            for await (const chunk of stream as any) {
                fullResponse += chunk
                // Send chunk as Server-Sent Event
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            }

            // Send completion signal
            res.write('data: [DONE]\n\n')
            res.end()

            // Save to database (async, don't wait)
            prisma.analysis
                .create({
                    data: {
                        userId,
                        teamId,
                        question: message,
                        response: fullResponse,
                    },
                })
                .catch((err: any) => console.error('Failed to save analysis:', err))

        } catch (error) {
            res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
            res.end()
        }
    } catch (error) {
        console.error('Chat error:', error)
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        })
    }
})

// GET /api/chat/history/:userId
router.get('/history/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const analyses = await prisma.analysis.findMany({
            where: { userId: parseInt(userId as string) },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        res.json(analyses)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' })
    }
})

export default router