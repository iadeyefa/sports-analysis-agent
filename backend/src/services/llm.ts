import { ChatOllama } from '@langchain/ollama'
import { OllamaEmbeddings } from '@langchain/ollama'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { config } from '../config/env'

// Initialize local Mistral 7B via Ollama
export const ollama = new ChatOllama({
    baseUrl: config.ollama.baseUrl,
    model: config.ollama.model,
    temperature: 0.3, // Lower for factual sports analysis
    numCtx: 2048, // Context window
})

// Initialize embeddings (also via Ollama)
export const embeddings = new OllamaEmbeddings({
    baseUrl: config.ollama.baseUrl,
    model: config.ollama.embeddingsModel,
})

// Sports analysis prompt template
export const sportsAnalysisPrompt = PromptTemplate.fromTemplate(`
You are an expert sports analyst specializing in {sport}.
Provide detailed, data-driven analysis based on game statistics and context.

Context (recent games and stats):
{context}

User Question: {question}

Provide a comprehensive analysis with specific statistics and insights:
`)

// Create the analysis chain
export const analysisChain = sportsAnalysisPrompt
    .pipe(ollama)
    .pipe(new StringOutputParser())

// Test function to verify Ollama is working
export const testOllamaConnection = async (): Promise<boolean> => {
    try {
        const response = await ollama.invoke('Test connection. Reply with one word: working')
        console.log('Ollama connection successful')
        return true
    } catch (error) {
        console.error('Ollama connection failed:', error)
        return false
    }
}