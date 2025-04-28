export interface Product {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Quote {
  id: string;
  customerName: string;
  products: Product[];
  total: number;
  date: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes?: string;
}

export interface QuoteInput {
  customerName: string;
  products: Product[];
  date?: string;
  total?: number;
  status?: Quote['status'];
  notes?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}
