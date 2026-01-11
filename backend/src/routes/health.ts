import { Router, Request, Response } from 'express'
import { testOllamaConnection } from '../services/llm'
import { testPineconeConnection } from '../services/pinecone'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        // Test all services
        const ollamaHealthy = await testOllamaConnection()
        const pineconeHealthy = await testPineconeConnection()

        const allHealthy = ollamaHealthy && pineconeHealthy

        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            services: {
                ollama: ollamaHealthy ? 'healthy' : 'unhealthy',
                pinecone: pineconeHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
            },
        })
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})

export default router