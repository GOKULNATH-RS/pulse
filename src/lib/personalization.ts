import { getUserProfile } from "./user-profile";
import { EmailPayload, ProductRecommendation, DiscountOffer, CampaignTrigger, Product } from "./types";
import { getRedis, KEYS } from "./redis";

const SAMPLE_PRODUCTS: Product[] = [
  { productId: "p1", name: "Wireless Headphones", category: "Electronics", price: 79.99, inventory: 45, imageUrl: "/products/headphones.jpg" },
  { productId: "p2", name: "Running Shoes", category: "Footwear", price: 129.99, inventory: 20, imageUrl: "/products/shoes.jpg" },
  { productId: "p3", name: "Laptop Stand", category: "Accessories", price: 49.99, inventory: 100, imageUrl: "/products/stand.jpg" },
  { productId: "p4", name: "Coffee Maker", category: "Kitchen", price: 89.99, inventory: 15, imageUrl: "/products/coffee.jpg" },
  { productId: "p5", name: "Yoga Mat", category: "Fitness", price: 34.99, inventory: 60, imageUrl: "/products/yoga.jpg" },
  { productId: "p6", name: "Bluetooth Speaker", category: "Electronics", price: 59.99, inventory: 30, imageUrl: "/products/speaker.jpg" },
  { productId: "p7", name: "Water Bottle", category: "Fitness", price: 24.99, inventory: 200, imageUrl: "/products/bottle.jpg" },
  { productId: "p8", name: "Desk Lamp", category: "Accessories", price: 39.99, inventory: 55, imageUrl: "/products/lamp.jpg" },
  { productId: "p9", name: "Smartwatch", category: "Electronics", price: 199.99, inventory: 10, imageUrl: "/products/watch.jpg" },
  { productId: "p10", name: "Backpack", category: "Accessories", price: 69.99, inventory: 40, imageUrl: "/products/backpack.jpg" },
];

export async function generatePersonalization(
  trigger: CampaignTrigger
): Promise<EmailPayload | null> {
  const profile = await getUserProfile(trigger.userId);
  if (!profile) return null;

  const redis = getRedis();
  await redis.hincrby(KEYS.METRICS, "emailsPending", 1);

  const recommendations = getRecommendations(profile.recentlyViewed, trigger.triggerType);
  const discount = getDiscount(profile.engagementScore, trigger.triggerType);
  const inventoryAlerts = getInventoryAlerts(recommendations);

  const subjectLines: Record<string, string> = {
    abandoned_cart: `${profile.name}, you left something behind!`,
    browse_abandonment: `${profile.name}, still interested in these?`,
    post_purchase_crosssell: `${profile.name}, you might also like these`,
    re_engagement: `We miss you, ${profile.name}! Come back for a surprise`,
    high_churn_risk: `${profile.name}, here's a special offer just for you`,
  };

  const ctaTexts: Record<string, string> = {
    abandoned_cart: "Complete Your Purchase",
    browse_abandonment: "Shop Now",
    post_purchase_crosssell: "Discover More",
    re_engagement: "Return to Shop",
    high_churn_risk: "Claim Your Offer",
  };

  return {
    to: profile.email,
    userName: profile.name,
    subject: subjectLines[trigger.triggerType] || "Check out what's new!",
    triggerType: trigger.triggerType,
    personalization: {
      greeting: getGreeting(profile.name, trigger.triggerType),
      recommendations,
      discount,
      inventoryAlerts,
      cartReminder: trigger.triggerType === "abandoned_cart" ? profile.cartItems : undefined,
      ctaUrl: "https://shop.example.com",
      ctaText: ctaTexts[trigger.triggerType] || "Shop Now",
    },
  };
}

function getGreeting(name: string, triggerType: string): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const greetings: Record<string, string> = {
    abandoned_cart: `${timeGreeting}, ${name}! It looks like you left some great items in your cart.`,
    browse_abandonment: `${timeGreeting}, ${name}! We noticed you were checking out some products.`,
    post_purchase_crosssell: `${timeGreeting}, ${name}! Thanks for your recent purchase. We think you'll love these too.`,
    re_engagement: `${timeGreeting}, ${name}! It's been a while since your last visit. We have exciting new arrivals!`,
    high_churn_risk: `${timeGreeting}, ${name}! We have a special offer waiting just for you.`,
  };

  return greetings[triggerType] || `${timeGreeting}, ${name}!`;
}

function getRecommendations(
  recentlyViewed: string[],
  triggerType: string
): ProductRecommendation[] {
  const viewedSet = new Set(recentlyViewed);
  const reasons: Record<string, string> = {
    abandoned_cart: "Complements items in your cart",
    browse_abandonment: "Based on your browsing history",
    post_purchase_crosssell: "Customers also bought",
    re_engagement: "Trending right now",
    high_churn_risk: "Specially selected for you",
  };

  // Pick products not recently viewed, prioritizing related categories
  const recommended = SAMPLE_PRODUCTS
    .filter((p) => !viewedSet.has(p.productId) && p.inventory > 0)
    .slice(0, 3)
    .map((p) => ({
      productId: p.productId,
      productName: p.name,
      price: p.price,
      category: p.category,
      reason: reasons[triggerType] || "Recommended for you",
    }));

  return recommended;
}

function getDiscount(engagementScore: number, triggerType: string): DiscountOffer | undefined {
  // Higher discounts for re-engagement and churn risk
  let percentage = 0;
  if (triggerType === "high_churn_risk") percentage = 25;
  else if (triggerType === "re_engagement") percentage = 20;
  else if (triggerType === "abandoned_cart") percentage = 10;
  else if (engagementScore > 50) percentage = 15;
  else return undefined;

  const code = `PULSE${percentage}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  return {
    code,
    percentage,
    validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
    description: `${percentage}% off your next order`,
  };
}

function getInventoryAlerts(recommendations: ProductRecommendation[]): string[] {
  const alerts: string[] = [];
  for (const rec of recommendations) {
    const product = SAMPLE_PRODUCTS.find((p) => p.productId === rec.productId);
    if (product && product.inventory < 20) {
      alerts.push(`${product.name} - Only ${product.inventory} left in stock!`);
    }
  }
  return alerts;
}

export { SAMPLE_PRODUCTS };
