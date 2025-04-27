require('dotenv').config();
const express = require("express")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")
const winston = require("winston")
const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const { z } = require("zod")

const app = express()
const PORT = process.env.BACKEND_PORT || 3001
const HOST = process.env.BACKEND_HOST || 'localhost'
const isDevelopment = process.env.NODE_ENV === 'development'

// Get the appropriate frontend URL based on environment
const frontendUrl = isDevelopment 
  ? `http://${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`
  : process.env.PROD_FRONTEND_URL

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
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
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
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

// API routes
app.get("/api/quotes", (req, res) => {
  res.json(quotes)
})

app.get("/api/quotes/:id", (req, res) => {
  logger.info(`Fetching quote with ID: ${req.params.id}`)
  const quote = quotes.find((q) => q.id === req.params.id)
  
  if (!quote) {
    logger.warn(`Quote not found with ID: ${req.params.id}`)
    return res.status(404).json({ message: "Quote not found" })
  }
  
  logger.info(`Found quote: ${JSON.stringify(quote)}`)
  res.json(quote)
})

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

// Catch-all route for invalid paths
app.use((req, res) => {
  res.status(404).json({
    message: "Not Found",
    error: "The requested resource was not found"
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error:", err)
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    })
  }
  res.status(500).json({
    message: "Internal server error",
    error: isDevelopment ? err.message : undefined
  })
})

// Start the server
app.listen(PORT, HOST, () => {
  const backendUrl = isDevelopment 
    ? `http://${HOST}:${PORT}`
    : process.env.PROD_BACKEND_URL
  logger.info(`Server running in ${process.env.NODE_ENV} mode at ${backendUrl}`)
})
