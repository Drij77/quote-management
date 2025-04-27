const express = require("express")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")
const winston = require("winston")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const { z } = require("zod")

const app = express()
const PORT = process.env.PORT || 3001

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Security middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Validation schemas
const ProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().min(1)
})

const QuoteInputSchema = z.object({
  customerName: z.string().min(1),
  products: z.array(ProductSchema).min(1),
  date: z.string().optional(),
  total: z.number().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).optional(),
  notes: z.string().optional()
})

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error("Error:", err)
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    })
  }

  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  })
}

// In-memory storage for quotes
const quotes = []

// Request logging middleware
const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    body: req.body,
    params: req.params,
    query: req.query
  })
  next()
}

app.use(requestLogger)

// Routes
// Get all quotes
app.get("/api/quotes", (req, res) => {
  res.json(quotes)
})

// Get a specific quote
app.get("/api/quotes/:id", (req, res) => {
  const quote = quotes.find((q) => q.id === req.params.id)

  if (!quote) {
    return res.status(404).json({ message: "Quote not found" })
  }

  res.json(quote)
})

// Create a new quote
app.post("/api/quotes", async (req, res, next) => {
  try {
    const validatedData = QuoteInputSchema.parse(req.body)
    
    const newQuote = {
      id: uuidv4(),
      ...validatedData,
      date: validatedData.date || new Date().toISOString(),
      total: validatedData.total || validatedData.products.reduce(
        (sum, product) => sum + (product.price * product.quantity),
        0
      ),
      status: validatedData.status || "draft"
    }

    quotes.push(newQuote)
    logger.info("Created new quote", { quoteId: newQuote.id })
    
    res.status(201).json(newQuote)
  } catch (error) {
    next(error)
  }
})

// Update a quote
app.put("/api/quotes/:id", async (req, res, next) => {
  try {
    const validatedData = QuoteInputSchema.parse(req.body)
    const quoteIndex = quotes.findIndex((q) => q.id === req.params.id)

    if (quoteIndex === -1) {
      return res.status(404).json({ message: "Quote not found" })
    }

    const updatedQuote = {
      ...quotes[quoteIndex],
      ...validatedData,
      total: validatedData.total || validatedData.products.reduce(
        (sum, product) => sum + (product.price * product.quantity),
        0
      )
    }

    quotes[quoteIndex] = updatedQuote
    logger.info("Updated quote", { quoteId: updatedQuote.id })
    
    res.json(updatedQuote)
  } catch (error) {
    next(error)
  }
})

// Delete a quote
app.delete("/api/quotes/:id", (req, res) => {
  const quoteIndex = quotes.findIndex((q) => q.id === req.params.id)

  if (quoteIndex === -1) {
    return res.status(404).json({ message: "Quote not found" })
  }

  const deletedQuote = quotes[quoteIndex]
  quotes.splice(quoteIndex, 1)
  logger.info("Deleted quote", { quoteId: deletedQuote.id })
  
  res.status(204).send()
})

// Error handling
app.use(errorHandler)

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
