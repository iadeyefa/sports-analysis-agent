import { Pinecone } from '@pinecone-database/pinecone'
import { embeddings } from './llm'
import { config } from '../config/env'

// Initialize Pinecone
const pc = new Pinecone({
    apiKey: config.pinecone.apiKey,
})

// Get index
export const pineconeIndex = pc.Index(config.pinecone.indexName)

// Function to store game data in Pinecone
export const storeGameData = async (
    gameId: string,
    gameData: string,
    metadata: any
): Promise<void> => {
    try {
        // Create embedding from game data
        const vector = await embeddings.embedQuery(gameData)

        // Store in Pinecone
        await pineconeIndex.upsert([
            {
                id: gameId,
                values: vector,
                metadata: {
                    ...metadata,
                    text: gameData,
                },
            },
        ])

        console.log(`Stored game data for ${gameId}`)
    } catch (error) {
        console.error('Error storing in Pinecone:', error)
        throw error
    }
}

// Function to retrieve similar games
export const retrieveSimilarGames = async (
    query: string,
    topK: number = 5
): Promise<any[]> => {
    try {
        // Create embedding from query
        const queryVector = await embeddings.embedQuery(query)

        // Search Pinecone
        const results = await pineconeIndex.query({
            vector: queryVector,
            topK,
            includeMetadata: true,
        })

        return results.matches.map((match) => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata,
        }))
    } catch (error) {
        console.error('Error querying Pinecone:', error)
        throw error
    }
}

// Function to test Pinecone connection
export const testPineconeConnection = async (): Promise<boolean> => {
    try {
        // Try to get index stats
        const stats = await pineconeIndex.describeIndexStats()
        console.log('Pinecone connection successful')
        console.log(`Index stats:`, stats)
        return true
    } catch (error) {
        console.error('Pinecone connection failed:', error)
        return false
    }
}