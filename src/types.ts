export interface Person {
  id: string;
  name: string;
  color: string; // Tailwind color classes, e.g. 'bg-blue-500', etc.
  avatar?: string; // base64 camera image
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // List of Person IDs
}

export interface ReceiptState {
  items: ReceiptItem[];
  people: Person[];
  tax: number;
  tip: number;
  tipType: 'percentage' | 'fixed';
  currencyRate: number;      // exchange rate (default 2038 FC for 1 USD)
  primaryCurrency: 'USD' | 'CDF'; // active display/input currency
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
