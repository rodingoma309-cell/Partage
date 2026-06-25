import { ReceiptState } from "../types";

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  state: ReceiptState;
}

export const PRESETS: Preset[] = [
  {
    id: "pizza-party",
    name: "🍕 Soirée Pizza & Bières",
    description: "Dhruv, Sarah, Sue et Alex partagent des pizzas, frites et boissons.",
    icon: "pizza",
    state: {
      people: [
        { id: "1", name: "Dhruv", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
        { id: "2", name: "Sarah", color: "bg-violet-100 text-violet-800 border-violet-300" },
        { id: "3", name: "Sue", color: "bg-amber-100 text-amber-800 border-amber-300" },
        { id: "4", name: "Alex", color: "bg-rose-100 text-rose-800 border-rose-300" },
      ],
      items: [
        { id: "i1", name: "Pizza Margherita (Grande)", price: 16.50, assignedTo: ["2", "3"] },
        { id: "i2", name: "Spaghetti Carbonara", price: 18.00, assignedTo: ["1"] },
        { id: "i3", name: "Frites à la truffe (Entrée)", price: 9.50, assignedTo: [] },
        { id: "i4", name: "Bière IPA Artisanale", price: 7.50, assignedTo: ["1"] },
        { id: "i5", name: "Verre de Vin Rouge", price: 9.00, assignedTo: ["2"] },
        { id: "i6", name: "Moelleux au Chocolat", price: 8.50, assignedTo: [] },
      ],
      tax: 5.40,
      tip: 15,
      tipType: "percentage",
      currencyRate: 2038,
      primaryCurrency: "USD",
    }
  },
  {
    id: "brunch-dimanche",
    name: "🥞 Brunch du Dimanche",
    description: "Sophie, Marc et Léa partagent un brunch gourmand.",
    icon: "coffee",
    state: {
      people: [
        { id: "b1", name: "Sophie", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
        { id: "b2", name: "Marc", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
        { id: "b3", name: "Léa", color: "bg-amber-100 text-amber-800 border-amber-300" },
      ],
      items: [
        { id: "bi1", name: "Avocado Toast & Œuf Poché", price: 14.00, assignedTo: ["b1", "b3"] },
        { id: "bi2", name: "Pancakes Sirop d'Érable", price: 12.50, assignedTo: ["b2"] },
        { id: "bi3", name: "Café Latte Macchiato", price: 4.80, assignedTo: ["b1"] },
        { id: "bi4", name: "Jus d'Orange Pressé", price: 5.00, assignedTo: ["b2", "b3"] },
        { id: "bi5", name: "Brunch Complet Nordique", price: 21.00, assignedTo: ["b3"] },
      ],
      tax: 4.20,
      tip: 10,
      tipType: "percentage",
      currencyRate: 2038,
      primaryCurrency: "USD",
    }
  },
  {
    id: "tapas-bar",
    name: "🍹 Tapas & Cocktails",
    description: "Thomas, Julie, Lucas et Chloé en soirée cocktails et planches à partager.",
    icon: "wine",
    state: {
      people: [
        { id: "t1", name: "Thomas", color: "bg-rose-100 text-rose-800 border-rose-300" },
        { id: "t2", name: "Julie", color: "bg-violet-100 text-violet-800 border-violet-300" },
        { id: "t3", name: "Lucas", color: "bg-teal-100 text-teal-800 border-teal-300" },
        { id: "t4", name: "Chloé", color: "bg-amber-100 text-amber-800 border-amber-300" },
      ],
      items: [
        { id: "ti1", name: "Grande Planche Charcuterie & Fromage", price: 24.50, assignedTo: ["t1", "t2", "t3", "t4"] },
        { id: "ti2", name: "Cocktail Mojito Classique", price: 9.50, assignedTo: ["t1", "t3"] },
        { id: "ti3", name: "Cocktail Passion Fruit Martini", price: 11.00, assignedTo: ["t2"] },
        { id: "ti4", name: "Pintes de Bière Blonde", price: 14.00, assignedTo: ["t3", "t4"] },
        { id: "ti5", name: "Portion de Nachos & Guacamole", price: 8.00, assignedTo: ["t1", "t2", "t4"] },
      ],
      tax: 6.10,
      tip: 2.00,
      tipType: "fixed",
      currencyRate: 2038,
      primaryCurrency: "USD",
    }
  }
];
