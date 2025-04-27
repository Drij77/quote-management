import type { Quote, QuoteInput } from '@/types';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Validation schemas
const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

const QuoteInputSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  products: z.array(ProductSchema).min(1, 'At least one product is required'),
  date: z.string().optional(),
  total: z.number().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional(),
  notes: z.string().optional(),
});

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Cache implementation
class Cache {
  private static instance: Cache;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

class QuoteService {
  private static instance: QuoteService;
  private cache: Cache;
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor() {
    this.cache = Cache.getInstance();
  }

  static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = this.retryCount
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new APIError(
          error.message || `HTTP error! status: ${response.status}`,
          response.status,
          error
        );
      }

      return response.json();
    } catch (error) {
      if (retries > 0 && error instanceof APIError && error.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  private validateQuoteInput(data: QuoteInput): QuoteInput {
    return QuoteInputSchema.parse(data);
  }

  async getAllQuotes(): Promise<Quote[]> {
    const cacheKey = 'quotes:all';
    const cached = this.cache.get<Quote[]>(cacheKey);
    if (cached) return cached;

    const quotes = await this.fetchWithRetry<Quote[]>(`${API_BASE_URL}/quotes`);
    this.cache.set(cacheKey, quotes);
    return quotes;
  }

  async getQuoteById(id: string): Promise<Quote> {
    const cacheKey = `quotes:${id}`;
    const cached = this.cache.get<Quote>(cacheKey);
    if (cached) return cached;

    const quote = await this.fetchWithRetry<Quote>(`${API_BASE_URL}/quotes/${id}`);
    this.cache.set(cacheKey, quote);
    return quote;
  }

  async createQuote(quoteData: QuoteInput): Promise<Quote> {
    const validatedData = this.validateQuoteInput(quoteData);
    const quote = await this.fetchWithRetry<Quote>(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
    
    this.cache.delete('quotes:all');
    return quote;
  }

  async updateQuote(id: string, quoteData: QuoteInput): Promise<Quote> {
    const validatedData = this.validateQuoteInput(quoteData);
    const quote = await this.fetchWithRetry<Quote>(`${API_BASE_URL}/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(validatedData),
    });
    
    this.cache.delete(`quotes:${id}`);
    this.cache.delete('quotes:all');
    return quote;
  }

  async deleteQuote(id: string): Promise<void> {
    await this.fetchWithRetry<void>(`${API_BASE_URL}/quotes/${id}`, {
      method: 'DELETE',
    });
    
    this.cache.delete(`quotes:${id}`);
    this.cache.delete('quotes:all');
  }
}

export const quoteService = QuoteService.getInstance(); 