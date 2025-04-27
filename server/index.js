const express = require("express")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  next()
})

// In-memory storage for quotes
const quotes = []

// Routes
// Get all quotes
app.get("/api/quotes", (req, res) => {
  console.log("GET /api/quotes - Sending quotes:", quotes)
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
app.post("/api/quotes", (req, res) => {
  const { customerName, products, date, total } = req.body

  if (!customerName || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Customer name and products are required" })
  }

  const newQuote = {
    id: uuidv4(),
    customerName,
    products,
    date,
    total,
  }

  quotes.push(newQuote)
  res.status(201).json(newQuote)
})

// Update a quote
app.put("/api/quotes/:id", (req, res) => {
  const { customerName, products, date, total } = req.body
  const quoteIndex = quotes.findIndex((q) => q.id === req.params.id)

  if (quoteIndex === -1) {
    return res.status(404).json({ message: "Quote not found" })
  }

  if (!customerName || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Customer name and products are required" })
  }

  quotes[quoteIndex] = {
    ...quotes[quoteIndex],
    customerName,
    products,
    date,
    total,
  }

  res.json(quotes[quoteIndex])
})

// Delete a quote
app.delete("/api/quotes/:id", (req, res) => {
  const quoteIndex = quotes.findIndex((q) => q.id === req.params.id)

  if (quoteIndex === -1) {
    return res.status(404).json({ message: "Quote not found" })
  }

  quotes.splice(quoteIndex, 1)
  res.status(204).send()
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
