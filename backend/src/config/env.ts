import * as dotenv from 'dotenv'

dotenv.config()

export const config = {
    database: {
        url: process.env.DATABASE_URL!,
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'mistral',
        embeddingsModel: process.env.EMBEDDINGS_MODEL || 'nomic-embed-text',
    },
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY!,
        indexName: process.env.PINECONE_INDEX_NAME || 'sports-analysis',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret',
    },
    server: {
        port: parseInt(process.env.PORT || '3000'),
        env: process.env.NODE_ENV || 'development',
    },
}