import { Router, Request, Response } from 'express'
import prisma from '../services/prisma'

const router = Router()


// GET /api/teams/:userId
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const teams = await prisma.team.findMany({
            where: { userId: parseInt(userId as string) },
            include: {
                games: { take: 5, orderBy: { date: 'desc' } },
            },
        })

        res.json(teams)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teams' })
    }
})

// POST /api/teams
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, teamName, sport } = req.body

        if (!userId || !teamName || !sport) {
            return res.status(400).json({ error: 'Missing required fields' })
        }

        // Check if team already exists for this user
        const existing = await prisma.team.findUnique({
            where: {
                userId_teamName_sport: { userId, teamName, sport },
            },
        })

        if (existing) {
            return res.status(400).json({ error: 'Team already added' })
        }

        // Create new team
        const team = await prisma.team.create({
            data: { userId, teamName, sport },
        })

        res.status(201).json(team)
    } catch (error) {
        res.status(500).json({ error: 'Failed to add team' })
    }
})

// DELETE /api/teams/:teamId
router.delete('/:teamId', async (req: Request, res: Response) => {
    try {
        const { teamId } = req.params

        await prisma.team.delete({
            where: { id: parseInt(teamId as string) },
        })

        res.json({ message: 'Team removed' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove team' })
    }
})

export default router