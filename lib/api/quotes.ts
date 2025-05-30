import type { Quote, QuoteInput } from '@/types';
import { z } from 'zod';

// Use relative path for API requests
const API_BASE_URL = '/api';

// Helper function to ensure we're using the correct URL format
function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  console.log('Making API request to:', fullUrl);
  return fullUrl;
}

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
      console.log('Making request to:', url);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      }).catch(error => {
        console.error('Fetch network error:', error);
        throw new APIError(
          'Unable to connect to the server. Please ensure the server is running.',
          503,
          { error }
        );
      });

      console.log('Response status:', response.status);
      
      // Handle 204 No Content response
      if (response.status === 204) {
        console.log('Received 204 No Content response');
        return null as T;
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      // Check if we got HTML instead of JSON
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE')) {
        console.error('Received HTML instead of JSON. Server might be on wrong port or path.');
        throw new APIError(
          'Invalid server response. Please check server configuration.',
          500,
          { receivedHtml: true }
        );
      }

      // Don't try to parse empty responses
      if (!text.trim()) {
        console.log('Received empty response');
        return null as T;
      }

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new APIError(
          'Invalid JSON response from server',
          500,
          { responseText: text }
        );
      }

      if (!response.ok) {
        throw new APIError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      console.log('Received data:', data);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      if (error instanceof APIError) {
        throw error;
      }
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        500,
        { error }
      );
    }
  }

  private validateQuoteInput(data: QuoteInput): QuoteInput {
    return QuoteInputSchema.parse(data);
  }

  async getAllQuotes(): Promise<Quote[]> {
    const cacheKey = 'quotes:all';
    const cached = this.cache.get<Quote[]>(cacheKey);
    if (cached) return cached;

    const quotes = await this.fetchWithRetry<Quote[]>(getApiUrl('quotes'));
    this.cache.set(cacheKey, quotes);
    return quotes;
  }

  async getQuoteById(id: string): Promise<Quote> {
    console.log('Getting quote by ID:', id);
    const cacheKey = `quotes:${id}`;
    const cached = this.cache.get<Quote>(cacheKey);
    if (cached) {
      console.log('Returning cached quote:', cached);
      return cached;
    }

    const url = getApiUrl(`quotes/${id}`);
    console.log('Fetching from URL:', url);
    const quote = await this.fetchWithRetry<Quote>(url);
    this.cache.set(cacheKey, quote);
    return quote;
  }

  async createQuote(quoteData: QuoteInput): Promise<Quote> {
    const validatedData = this.validateQuoteInput(quoteData);
    const quote = await this.fetchWithRetry<Quote>(getApiUrl('quotes'), {
      method: 'POST',
      body: JSON.stringify(validatedData),
    });
    
    this.cache.delete('quotes:all');
    return quote;
  }

  async updateQuote(id: string, quoteData: QuoteInput): Promise<Quote> {
    const validatedData = this.validateQuoteInput(quoteData);
    const quote = await this.fetchWithRetry<Quote>(getApiUrl(`quotes/${id}`), {
      method: 'PUT',
      body: JSON.stringify(validatedData),
    });
    
    this.cache.delete(`quotes:${id}`);
    this.cache.delete('quotes:all');
    return quote;
  }

  async deleteQuote(id: string): Promise<void> {
    await this.fetchWithRetry<void>(getApiUrl(`quotes/${id}`), {
      method: 'DELETE',
    });
    
    this.cache.delete(`quotes:${id}`);
    this.cache.delete('quotes:all');
  }
}

export const quoteService = QuoteService.getInstance(); 