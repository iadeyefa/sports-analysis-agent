import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { config } from './config/env'
import prisma from './services/prisma'

// Routes
import chatRoutes from './routes/chat'
import teamsRoutes from './routes/teams'
import healthRoutes from './routes/health'
import gamesRoutes from './routes/games'

const app: Express = express()

console.log('Initializing Prisma...')

console.log('Setting up middleware...')
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

console.log('Setting up routes...')
// Routes
app.use('/api/health', healthRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/games', gamesRoutes)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    })
})

// Start server
const PORT = config.server.port
console.log(`Attempting to start server on port ${PORT}...`)
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`)
    console.log(` Ollama: ${config.ollama.baseUrl}`)
    console.log(` Pinecone Index: ${config.pinecone.indexName}`)
}).on('error', (err: any) => {
    console.error('Server error:', err)
    process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n Shutting down...')
    await prisma.$disconnect()
    process.exit(0)
})