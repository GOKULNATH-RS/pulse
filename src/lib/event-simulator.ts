import { UserEvent, Product } from "./types";
import { v4 as uuidv4 } from "uuid";

const SAMPLE_PRODUCTS: Product[] = [
  { productId: "p1", name: "Wireless Headphones", category: "Electronics", price: 79.99, inventory: 45, imageUrl: "" },
  { productId: "p2", name: "Running Shoes", category: "Footwear", price: 129.99, inventory: 20, imageUrl: "" },
  { productId: "p3", name: "Laptop Stand", category: "Accessories", price: 49.99, inventory: 100, imageUrl: "" },
  { productId: "p4", name: "Coffee Maker", category: "Kitchen", price: 89.99, inventory: 15, imageUrl: "" },
  { productId: "p5", name: "Yoga Mat", category: "Fitness", price: 34.99, inventory: 60, imageUrl: "" },
  { productId: "p6", name: "Bluetooth Speaker", category: "Electronics", price: 59.99, inventory: 30, imageUrl: "" },
  { productId: "p7", name: "Water Bottle", category: "Fitness", price: 24.99, inventory: 200, imageUrl: "" },
  { productId: "p8", name: "Desk Lamp", category: "Accessories", price: 39.99, inventory: 55, imageUrl: "" },
  { productId: "p9", name: "Smartwatch", category: "Electronics", price: 199.99, inventory: 10, imageUrl: "" },
  { productId: "p10", name: "Backpack", category: "Accessories", price: 69.99, inventory: 40, imageUrl: "" },
  { productId: "p11", name: "Protein Powder", category: "Fitness", price: 44.99, inventory: 80, imageUrl: "" },
  { productId: "p12", name: "Phone Case", category: "Electronics", price: 19.99, inventory: 150, imageUrl: "" },
];

interface SimulatedUser {
  userId: string;
  email: string;
  name: string;
  preferredCategories: string[];
  purchaseProbability: number;
  cartProbability: number;
  browsingIntensity: number;
}

let SIMULATED_USERS: SimulatedUser[] = [
  {
    // Gokul – Electronics enthusiast, moderate buyer
    userId: "gokul-1",
    email: "gokulnathrs.personal@gmail.com",
    name: "Gokul",
    preferredCategories: ["Electronics", "Fitness"],
    purchaseProbability: 0.12,
    cartProbability: 0.25,
    browsingIntensity: 0.8,
  },
  {
    // Gokul – Kitchen & home persona, frequent buyer
    userId: "gokul-2",
    email: "gokulnathrs.personal@gmail.com",
    name: "Gokul",
    preferredCategories: ["Kitchen", "Accessories"],
    purchaseProbability: 0.22,
    cartProbability: 0.35,
    browsingIntensity: 0.55,
  },
  {
    // Dhana – Fitness & footwear browser, rarely buys
    userId: "dhana-1",
    email: "dhanaseelanm56@gmail.com",
    name: "Dhana",
    preferredCategories: ["Footwear", "Fitness"],
    purchaseProbability: 0.05,
    cartProbability: 0.18,
    browsingIntensity: 0.9,
  },
  {
    // Dhana – Electronics window-shopper, at-risk of churning
    userId: "dhana-2",
    email: "dhanaseelanm56@gmail.com",
    name: "Dhana",
    preferredCategories: ["Electronics", "Accessories"],
    purchaseProbability: 0.04,
    cartProbability: 0.10,
    browsingIntensity: 0.35,
  },
  {
    // Dhana – Deal seeker, buys only with discounts
    userId: "dhana-3",
    email: "dhanaseelanm56@gmail.com",
    name: "Dhana",
    preferredCategories: ["Kitchen", "Fitness"],
    purchaseProbability: 0.18,
    cartProbability: 0.30,
    browsingIntensity: 0.65,
  },
];

export function getSimulatedUsers(): SimulatedUser[] {
  return SIMULATED_USERS;
}

export function setSimulatedUsers(users: SimulatedUser[]): void {
  SIMULATED_USERS = users;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomProduct(): Product {
  return SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
}

function randomUser() {
  return SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
}

export function generateEvent(): UserEvent {
  const user = randomUser();
  const product = randomProduct();
  const rand = Math.random();

  let eventType: UserEvent["eventType"];
  if (rand < 0.35) eventType = "page_view";
  else if (rand < 0.60) eventType = "product_view";
  else if (rand < 0.75) eventType = "add_to_cart";
  else if (rand < 0.80) eventType = "remove_from_cart";
  else if (rand < 0.88) eventType = "purchase";
  else if (rand < 0.95) eventType = "search";
  else eventType = "wishlist";

  const event: UserEvent = {
    eventId: uuidv4(),
    userId: user.userId,
    eventType,
    timestamp: Date.now(),
    data: {
      sessionId: `session-${user.userId}-${Math.floor(Date.now() / 3600000)}`,
    },
  };

  // Add product data for relevant event types
  if (["product_view", "add_to_cart", "remove_from_cart", "purchase", "wishlist"].includes(eventType)) {
    event.data.productId = product.productId;
    event.data.productName = product.name;
    event.data.productCategory = product.category;
    event.data.productPrice = product.price;
    event.data.quantity = Math.ceil(Math.random() * 3);
  }

  if (eventType === "search") {
    const queries = ["headphones", "running gear", "gifts", "laptop accessories", "fitness", "kitchen gadgets"];
    event.data.searchQuery = queries[Math.floor(Math.random() * queries.length)];
  }

  if (eventType === "page_view") {
    const pages = ["/", "/products", "/categories", "/deals", "/about", "/cart"];
    event.data.pageUrl = pages[Math.floor(Math.random() * pages.length)];
  }

  return event;
}

export function generateBatch(count: number): UserEvent[] {
  return Array.from({ length: count }, () => generateEvent());
}

export { SIMULATED_USERS };
