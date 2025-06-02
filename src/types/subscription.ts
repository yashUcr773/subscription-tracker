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
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  category?: SubscriptionCategory;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  duplicateDetection: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  subscriptionId?: string;
  createdAt: Date;
}

export interface PriceHistory {
  id: string;
  amount: number;
  previousAmount: number;
  changeDate: Date;
  subscriptionId: string;
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
