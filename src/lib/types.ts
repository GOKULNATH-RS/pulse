export interface UserEvent {
  eventId: string;
  userId: string;
  eventType: "page_view" | "product_view" | "add_to_cart" | "remove_from_cart" | "purchase" | "search" | "wishlist";
  timestamp: number;
  data: {
    productId?: string;
    productName?: string;
    productCategory?: string;
    productPrice?: number;
    quantity?: number;
    searchQuery?: string;
    pageUrl?: string;
    sessionId?: string;
  };
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  recentlyViewed: string[];
  cartItems: CartItem[];
  purchaseHistory: PurchaseItem[];
  sessionCount: number;
  engagementScore: number;
  lastActivity: number;
  totalSpent: number;
  churnRisk?: number;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  addedAt: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  purchasedAt: number;
}

export interface CampaignTrigger {
  triggerId: string;
  userId: string;
  triggerType: "abandoned_cart" | "browse_abandonment" | "post_purchase_crosssell" | "re_engagement" | "high_churn_risk";
  triggerData: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "sent" | "failed";
}

export interface EmailPayload {
  to: string;
  userName: string;
  subject: string;
  triggerType: string;
  personalization: {
    greeting: string;
    recommendations: ProductRecommendation[];
    discount?: DiscountOffer;
    inventoryAlerts: string[];
    cartReminder?: CartItem[];
    ctaUrl: string;
    ctaText: string;
  };
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  price: number;
  category: string;
  reason: string;
}

export interface DiscountOffer {
  code: string;
  percentage: number;
  validUntil: number;
  description: string;
}

export interface MetricsSnapshot {
  totalEvents: number;
  eventsPerSecond: number;
  activeUsers: number;
  campaignsTriggered: number;
  emailsPending: number;
  emailsSent: number;
  emailsFailed: number;
  emailSuccessRate: number;
  avgProcessingLatency: number;
  eventsPerMinute: number;
}

export interface Product {
  productId: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  imageUrl: string;
}
