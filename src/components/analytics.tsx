"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Subscription } from "@/types/subscription";
import { PieChart, BarChart, TrendingUp, AlertCircle } from "lucide-react";

interface AnalyticsProps {
  subscriptions: Subscription[];
}

export function Analytics({ subscriptions }: AnalyticsProps) {
  // Calculate spending by category
  const spendingByCategory = subscriptions.reduce((acc, sub) => {
    const monthlyAmount = sub.billingFrequency === "yearly" ? sub.amount / 12 :
                         sub.billingFrequency === "quarterly" ? sub.amount / 3 :
                         sub.billingFrequency === "weekly" ? sub.amount * 4 :
                         sub.amount;
    
    acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  // Sort categories by spending
  const sortedCategories = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Find most expensive subscription
  const mostExpensive = subscriptions.reduce((max, sub) => {
    const monthlyAmount = sub.billingFrequency === "yearly" ? sub.amount / 12 :
                         sub.billingFrequency === "quarterly" ? sub.amount / 3 :
                         sub.billingFrequency === "weekly" ? sub.amount * 4 :
                         sub.amount;
    
    const maxMonthly = max.billingFrequency === "yearly" ? max.amount / 12 :
                       max.billingFrequency === "quarterly" ? max.amount / 3 :
                       max.billingFrequency === "weekly" ? max.amount * 4 :
                       max.amount;
    
    return monthlyAmount > maxMonthly ? sub : max;
  }, subscriptions[0]);

  // Calculate potential savings suggestions
  const suggestions = [];
  
  // Check for expensive entertainment subscriptions
  const entertainmentSubs = subscriptions.filter(s => s.category === 'entertainment');
  if (entertainmentSubs.length > 2) {
    const totalEntertainment = entertainmentSubs.reduce((sum, sub) => {
      const monthly = sub.billingFrequency === "yearly" ? sub.amount / 12 :
                     sub.billingFrequency === "quarterly" ? sub.amount / 3 :
                     sub.billingFrequency === "weekly" ? sub.amount * 4 :
                     sub.amount;
      return sum + monthly;
    }, 0);
    
    if (totalEntertainment > 50) {
      suggestions.push({
        type: "reduce",
        message: `Consider reducing entertainment subscriptions. You're spending $${totalEntertainment.toFixed(2)}/month.`,
        savings: Math.round(totalEntertainment * 0.3)
      });
    }
  }

  // Check for yearly vs monthly billing opportunities
  const monthlyBilled = subscriptions.filter(s => s.billingFrequency === 'monthly' && s.amount > 10);
  if (monthlyBilled.length > 0) {
    suggestions.push({
      type: "optimize",
      message: `Switch to yearly billing for ${monthlyBilled.length} subscription${monthlyBilled.length > 1 ? 's' : ''} to save ~15%`,
      savings: Math.round(monthlyBilled.reduce((sum, sub) => sum + sub.amount, 0) * 12 * 0.15)
    });
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      entertainment: "bg-purple-100 text-purple-800",
      productivity: "bg-blue-100 text-blue-800",
      fitness: "bg-green-100 text-green-800",
      food: "bg-orange-100 text-orange-800",
      education: "bg-indigo-100 text-indigo-800",
      news: "bg-gray-100 text-gray-800",
      music: "bg-pink-100 text-pink-800",
      gaming: "bg-red-100 text-red-800",
      shopping: "bg-yellow-100 text-yellow-800",
      other: "bg-slate-100 text-slate-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart className="h-6 w-6" />
        Analytics & Insights
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedCategories.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(category)}>
                    {category}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Expensive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostExpensive && (
              <div className="space-y-2">
                <div className="font-semibold text-lg">{mostExpensive.name}</div>
                <Badge className={getCategoryColor(mostExpensive.category)}>
                  {mostExpensive.category}
                </Badge>
                <div className="text-2xl font-bold">
                  ${mostExpensive.amount.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {mostExpensive.billingFrequency}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {mostExpensive.description || "No description"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Savings Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex-1">
                  <p className="text-sm">{suggestion.message}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Potential savings: ${suggestion.savings}/year
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
