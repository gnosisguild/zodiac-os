import { getMessariApiKey } from '@zodiac/env'
import axios from 'axios'

export interface MessariCopilotRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  verbosity?: 'concise' | 'verbose'
  response_format?: 'markdown' | 'text'
  inline_citations?: boolean
  stream?: boolean
  generate_related_questions?: number
}

export interface MessariCopilotResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  metadata?: {
    status: string
    trace_id: string
    sources?: Array<{
      title: string
      url: string
      description?: string
    }>
    charts?: Array<{
      citationId: number
      entities: Array<{
        entityType: string
        entityId: string
      }>
      dataset: string
      metric: string
      start: string
      end: string
      tier: string
      granularity: string
      metricTimeseries: {
        point_schema: Array<{
          id: string
          name: string
          slug: string
          description: string
          is_timestamp: boolean
          format: string
        }>
        series: Array<{
          key: string
          entity: {
            id: string
            name: string
            symbol: string
            slug: string
          }
          points: Array<Array<number>>
        }>
      }
    }>
  }
}

export interface EnhancedMessariResponse {
  content: string
  sources: Array<{
    title: string
    url: string
    description?: string
  }>
  charts: Array<{
    citationId: number
    entities: Array<{
      entityType: string
      entityId: string
    }>
    dataset: string
    metric: string
    start: string
    end: string
    tier: string
    granularity: string
    metricTimeseries: {
      point_schema: Array<{
        id: string
        name: string
        slug: string
        description: string
        is_timestamp: boolean
        format: string
      }>
      series: Array<{
        key: string
        entity: {
          id: string
          name: string
          symbol: string
          slug: string
        }
        points: Array<Array<number>>
      }>
    }
  }>
}

class MessariClient {
  private baseURL = 'https://api.messari.io/ai/openai'
  private apiKey: string

  constructor() {
    try {
      this.apiKey = getMessariApiKey()
    } catch (error) {
      this.apiKey = ''
      console.warn('MESSARI_API_KEY not found in environment variables')
    }
  }

  private getHeaders() {
    return {
      'x-messari-api-key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  async chatCompletions(
    request: MessariCopilotRequest,
  ): Promise<MessariCopilotResponse> {
    const requestPayload = {
      messages: request.messages,
      verbosity: request.verbosity || 'verbose',
      response_format: request.response_format || 'markdown',
      inline_citations: request.inline_citations !== false,
      stream: request.stream || false,
      generate_related_questions: request.generate_related_questions || 0,
    }

    console.log('🔄 Messari API Request:', {
      url: `${this.baseURL}/chat/completions`,
      payload: requestPayload,
      timestamp: new Date().toISOString(),
    })

    try {
      const startTime = Date.now()

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestPayload,
        {
          headers: this.getHeaders(),
          timeout: 60000, // 60 second timeout
        },
      )

      const duration = Date.now() - startTime

      console.log('✅ Messari API Success:', {
        status: response.status,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(response.data).length,
        tokensUsed: response.data.usage,
        hasMetadata: !!response.data.metadata,
        metadata: response.data.metadata,
        fullResponse: response.data,
        timestamp: new Date().toISOString(),
      })

      return response.data
    } catch (error) {
      console.error('❌ Messari API Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) {
          throw new Error(
            'Messari API authentication failed. Check your API key.',
          )
        }
        if (status === 429) {
          throw new Error(
            'Messari API rate limit exceeded. Please try again later.',
          )
        }
        if (status && status >= 500) {
          throw new Error(
            'Messari API is currently unavailable. Please try again later.',
          )
        }
        if (status === 404) {
          throw new Error(
            'Messari Copilot API endpoint not found. The API may have changed.',
          )
        }
      }

      throw new Error(
        `Messari Copilot request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // Additional utility method for market insights
  async getMarketInsights(token: string): Promise<string> {
    const response = await this.chatCompletions({
      messages: [
        {
          role: 'system',
          content:
            'You are a crypto market analysis expert. Provide comprehensive, data-driven insights.',
        },
        {
          role: 'user',
          content: `Provide comprehensive market analysis and insights for ${token}, including recent price movements, fundamentals, and market sentiment.`,
        },
      ],
    })
    return response.choices[0]?.message?.content || 'No response received'
  }

  // Method for comparing tokens
  async compareTokens(token1: string, token2: string): Promise<string> {
    const response = await this.chatCompletions({
      messages: [
        {
          role: 'system',
          content:
            'You are a crypto analyst specialized in comparative analysis. Provide detailed, factual comparisons.',
        },
        {
          role: 'user',
          content: `Compare ${token1} and ${token2} across key metrics including performance, fundamentals, adoption, and market outlook.`,
        },
      ],
    })
    return response.choices[0]?.message?.content || 'No response received'
  }

  // Method for protocol analysis
  async analyzeProtocol(protocol: string): Promise<string> {
    const response = await this.chatCompletions({
      messages: [
        {
          role: 'system',
          content:
            'You are a DeFi protocol analyst. Provide in-depth analysis of protocol fundamentals, metrics, and competitive positioning.',
        },
        {
          role: 'user',
          content: `Analyze ${protocol} protocol including its fundamentals, adoption metrics, recent developments, and competitive position.`,
        },
      ],
    })
    return response.choices[0]?.message?.content || 'No response received'
  }

  // General copilot query method with enhanced response
  async query(
    question: string,
    context?: string,
  ): Promise<EnhancedMessariResponse> {
    const systemMessage =
      context ||
      'You are a crypto market expert. Provide accurate, insightful analysis based on current market data.'

    const response = await this.chatCompletions({
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    })

    return {
      content: response.choices[0]?.message?.content || 'No response received',
      sources: response.metadata?.sources || [],
      charts: response.metadata?.charts || [],
    }
  }

  // Legacy method for backward compatibility
  async querySimple(question: string, context?: string): Promise<string> {
    const response = await this.query(question, context)
    return response.content
  }
}

export default new MessariClient()
