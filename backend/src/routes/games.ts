import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/games/:teamId
router.get('/:teamId', async (req: Request, res: Response) => {
    try {
        const { teamId } = req.params

        const games = await prisma.game.findMany({
            where: { teamId: parseInt(teamId as string) },
            include: { playerStats: true },
            orderBy: { date: 'desc' },
        })

        res.json(games)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch games' })
    }
})

// POST /api/games
router.post('/', async (req: Request, res: Response) => {
    try {
        const { teamId, opponent, score, opponentScore, date, venue, gameStatus } = req.body

        if (!teamId || !opponent || score === undefined || opponentScore === undefined) {
            return res.status(400).json({ error: 'Missing required fields' })
        }

        const game = await prisma.game.create({
            data: {
                teamId,
                opponent,
                score,
                opponentScore,
                date: new Date(date),
                venue,
                gameStatus,
            },
        })

        res.status(201).json(game)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create game' })
    }
})

// DELETE /api/games/:gameId
router.delete('/:gameId', async (req: Request, res: Response) => {
    try {
        const { gameId } = req.params

        await prisma.game.delete({
            where: { id: parseInt(gameId as string) },
        })

        res.json({ message: 'Game removed' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete game' })
    }
})

export default router