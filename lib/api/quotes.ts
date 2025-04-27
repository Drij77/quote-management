import type { Quote, QuoteInput } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class QuoteService {
  private static instance: QuoteService;
  private constructor() {}

  static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getAllQuotes(): Promise<Quote[]> {
    const response = await fetch(`${API_BASE_URL}/quotes`);
    return this.handleResponse<Quote[]>(response);
  }

  async getQuoteById(id: string): Promise<Quote> {
    const response = await fetch(`${API_BASE_URL}/quotes/${id}`);
    return this.handleResponse<Quote>(response);
  }

  async createQuote(quoteData: QuoteInput): Promise<Quote> {
    const response = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    });
    return this.handleResponse<Quote>(response);
  }

  async updateQuote(id: string, quoteData: QuoteInput): Promise<Quote> {
    const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteData),
    });
    return this.handleResponse<Quote>(response);
  }

  async deleteQuote(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/quotes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete quote: ${response.status}`);
    }
  }
}

export const quoteService = QuoteService.getInstance(); 