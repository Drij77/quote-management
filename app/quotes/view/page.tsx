"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { quoteService } from '@/lib/api/quotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ProductForm } from '@/components/quotes/ProductForm';
import type { Quote, Product } from '@/types';

export default function QuoteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) {
      setError('Quote ID is required');
      setLoading(false);
      return;
    }

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const data = await quoteService.getQuoteById(id);
        setQuote(data);
        setCustomerName(data.customerName);
        setProducts(data.products);
        setError(null);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  // ... rest of the component code stays the same ...
} 