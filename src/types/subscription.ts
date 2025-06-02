export interface Subscription {
  id: string;
  name: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  nextBillingDate: Date;
  lastBillingDate?: Date;
  description?: string;
  website?: string;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionCategory = 
  | 'entertainment'
  | 'productivity'
  | 'fitness'
  | 'food'
  | 'education'
  | 'news'
  | 'music'
  | 'gaming'
  | 'shopping'
  | 'other';

export type BillingFrequency = 
  | 'monthly'
  | 'yearly'
  | 'weekly'
  | 'quarterly';

export type SubscriptionStatus = 
  | 'active'
  | 'cancelled'
  | 'paused';

export interface SubscriptionFormData {
  name: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billingFrequency: BillingFrequency;
  nextBillingDate: string;
  description?: string;
  website?: string;
}
