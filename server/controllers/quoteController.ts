import { Request, Response, NextFunction } from 'express';
import { QuoteModel, Quote } from '../models/quote';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class QuoteController {
  constructor(private quoteModel: QuoteModel) {}

  async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await this.quoteModel.create(req.body);
      logger.info('Created new quote', { quoteId: quote.id });
      res.status(201).json(quote);
    } catch (error) {
      next(error);
    }
  }

  async getQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await this.quoteModel.findById(req.params.id);
      if (!quote) {
        throw new AppError(404, 'Quote not found');
      }
      res.json(quote);
    } catch (error) {
      next(error);
    }
  }

  async getAllQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const quotes = await this.quoteModel.findAll();
      res.json(quotes);
    } catch (error) {
      next(error);
    }
  }

  async updateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await this.quoteModel.update(req.params.id, req.body);
      if (!quote) {
        throw new AppError(404, 'Quote not found');
      }
      logger.info('Updated quote', { quoteId: quote.id });
      res.json(quote);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await this.quoteModel.delete(req.params.id);
      if (!success) {
        throw new AppError(404, 'Quote not found');
      }
      logger.info('Deleted quote', { quoteId: req.params.id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
} 