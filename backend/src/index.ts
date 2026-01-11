import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { config } from './config/env'
import { PrismaClient } from '@prisma/client'

// Routes
import chatRoutes from './routes/chat'
import teamsRoutes from './routes/teams'
import healthRoutes from './routes/health'

const app: Express = express()
const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : process.env.FRONTEND_URL,
    credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/teams', teamsRoutes)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    })
})

// Start server
const PORT = config.server.port
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Ollama: ${config.ollama.baseUrl}`)
    console.log(`Pinecone Index: ${config.pinecone.indexName}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...')
    await prisma.$disconnect()
    process.exit(0)
})