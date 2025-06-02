"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Budget, Subscription, SubscriptionCategory } from "@/types/subscription";

interface BudgetManagerProps {
  subscriptions: Subscription[];
}

export function BudgetManager({ subscriptions }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
    category: "" as SubscriptionCategory | "",
  });
  // Load budgets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('subscriptionTracker_budgets');
    if (saved) {
      const parsed = JSON.parse(saved) as (Omit<Budget, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
      })[];
      setBudgets(parsed.map((budget) => ({
        ...budget,
        createdAt: new Date(budget.createdAt),
        updatedAt: new Date(budget.updatedAt),
      })));
    }
  }, []);

  // Save budgets to localStorage
  useEffect(() => {
    localStorage.setItem('subscriptionTracker_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const calculateSpending = (budget: Budget) => {
    const relevantSubs = subscriptions.filter(sub => 
      sub.status === 'active' && 
      (!budget.category || sub.category === budget.category)
    );

    const monthlySpending = relevantSubs.reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      if (sub.billingFrequency === 'yearly') monthlyAmount /= 12;
      if (sub.billingFrequency === 'quarterly') monthlyAmount /= 3;
      if (sub.billingFrequency === 'weekly') monthlyAmount *= 4.33;
      return total + monthlyAmount;
    }, 0);

    const budgetAmount = budget.period === 'yearly' ? budget.amount / 12 : budget.amount;
    const percentage = (monthlySpending / budgetAmount) * 100;
    
    return {
      spending: monthlySpending,
      budgetAmount,
      percentage,
      isOverBudget: percentage > 100,
      isNearLimit: percentage > 80 && percentage <= 100
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const newBudget: Budget = {
      id: crypto.randomUUID(),
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      category: formData.category || undefined,
      userId: "local", // Will be replaced with actual user ID when auth is implemented
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setBudgets(prev => [...prev, newBudget]);
    setFormData({ name: "", amount: "", period: "monthly", category: "" });
    setShowForm(false);
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const getStatusColor = (budget: Budget) => {
    const { isOverBudget, isNearLimit } = calculateSpending(budget);
    if (isOverBudget) return "destructive";
    if (isNearLimit) return "secondary";
    return "default";
  };

  const getStatusIcon = (budget: Budget) => {
    const { isOverBudget, isNearLimit } = calculateSpending(budget);
    if (isOverBudget) return <AlertTriangle className="h-4 w-4" />;
    if (isNearLimit) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const categories: SubscriptionCategory[] = [
    'entertainment', 'productivity', 'fitness', 'food', 'education', 
    'news', 'music', 'gaming', 'shopping', 'other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-muted-foreground">Set spending limits and track your progress</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Budget Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Entertainment Budget"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value as "monthly" | "yearly" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category (Optional)</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as SubscriptionCategory }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Budget</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first budget to start tracking your spending limits
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const { spending, budgetAmount, percentage, isOverBudget, isNearLimit } = calculateSpending(budget);
            
            return (
              <Card key={budget.id} className={isOverBudget ? "border-destructive" : isNearLimit ? "border-orange-500" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base font-medium">{budget.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {budget.category ? budget.category.charAt(0).toUpperCase() + budget.category.slice(1) : "All categories"} • {budget.period}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(budget)} className="flex items-center space-x-1">
                      {getStatusIcon(budget)}
                      <span>{percentage.toFixed(0)}%</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBudget(budget.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Spent</span>
                      <span className={isOverBudget ? "text-destructive font-medium" : ""}>
                        ${spending.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Budget</span>
                      <span>${budgetAmount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? "bg-destructive" : isNearLimit ? "bg-orange-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <p className="text-sm text-destructive">
                        Over budget by ${(spending - budgetAmount).toFixed(2)}
                      </p>
                    )}
                    {isNearLimit && !isOverBudget && (
                      <p className="text-sm text-orange-600">
                        Remaining: ${(budgetAmount - spending).toFixed(2)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
