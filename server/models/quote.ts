import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  quantity: z.number().min(1, 'Quantity must be at least 1')
});

export const QuoteStatusSchema = z.enum(['draft', 'sent', 'accepted', 'rejected']);

export const QuoteSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string().min(1, 'Customer name is required'),
  products: z.array(ProductSchema).min(1, 'At least one product is required'),
  date: z.string().datetime().optional(),
  total: z.number().min(0).optional(),
  status: QuoteStatusSchema.default('draft'),
  notes: z.string().optional()
});

export type Product = z.infer<typeof ProductSchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type Quote = z.infer<typeof QuoteSchema>;

export class QuoteModel {
  private quotes: Quote[] = [];

  async create(data: Omit<Quote, 'id' | 'date' | 'total' | 'status'>): Promise<Quote> {
    const quote: Quote = {
      id: crypto.randomUUID(),
      ...data,
      date: new Date().toISOString(),
      total: data.products.reduce((sum, product) => sum + (product.price * product.quantity), 0),
      status: 'draft'
    };
    this.quotes.push(quote);
    return quote;
  }

  async findById(id: string): Promise<Quote | undefined> {
    return this.quotes.find(quote => quote.id === id);
  }

  async findAll(): Promise<Quote[]> {
    return this.quotes;
  }

  async update(id: string, data: Partial<Omit<Quote, 'id'>>): Promise<Quote | undefined> {
    const index = this.quotes.findIndex(quote => quote.id === id);
    if (index === -1) return undefined;

    const updatedQuote = {
      ...this.quotes[index],
      ...data,
      total: data.products 
        ? data.products.reduce((sum, product) => sum + (product.price * product.quantity), 0)
        : this.quotes[index].total
    };

    this.quotes[index] = updatedQuote;
    return updatedQuote;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.quotes.findIndex(quote => quote.id === id);
    if (index === -1) return false;
    this.quotes.splice(index, 1);
    return true;
  }
} 