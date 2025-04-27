import { Router } from 'express';
import { QuoteController } from '../controllers/quoteController';
import { QuoteModel } from '../models/quote';
import { QuoteSchema } from '../models/quote';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const quoteModel = new QuoteModel();
const quoteController = new QuoteController(quoteModel);

// Validation middleware
const validateQuoteInput = validateRequest({
  body: QuoteSchema.omit({ id: true, date: true, total: true, status: true })
});

const validateQuoteUpdate = validateRequest({
  body: QuoteSchema.omit({ id: true }).partial()
});

// Routes
router.get('/', quoteController.getAllQuotes.bind(quoteController));
router.get('/:id', quoteController.getQuote.bind(quoteController));
router.post('/', validateQuoteInput, quoteController.createQuote.bind(quoteController));
router.put('/:id', validateQuoteUpdate, quoteController.updateQuote.bind(quoteController));
router.delete('/:id', quoteController.deleteQuote.bind(quoteController));

export default router; 