"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Budget, Subscription, SubscriptionCategory } from "@/types/subscription";
import { apiClient } from "@/lib/api-client";

interface BudgetManagerProps {
  subscriptions: Subscription[];
}

export function BudgetManager({ subscriptions }: BudgetManagerProps) {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    period: "monthly" as "monthly" | "yearly",
    category: "" as SubscriptionCategory | "",
  });

  // Load budgets from database
  useEffect(() => {
    const loadBudgets = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await apiClient.getBudgets();
        const budgets = data.map((budget: any) => ({
          ...budget,
          createdAt: new Date(budget.createdAt),
          updatedAt: new Date(budget.updatedAt),
        }));
        setBudgets(budgets);
      } catch (error) {
        console.error('Error loading budgets:', error);
        // Fallback to localStorage if database fails
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
      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, [session]);

  // Don't save to localStorage anymore since we're using database

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !session?.user) return;

    try {
      const budgetData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        period: formData.period,
        category: formData.category || undefined,
      };

      const newBudget = await apiClient.createBudget(budgetData);
      
      const formattedBudget: Budget = {
        ...newBudget,
        createdAt: new Date(newBudget.createdAt),
        updatedAt: new Date(newBudget.updatedAt),
      };

      setBudgets(prev => [...prev, formattedBudget]);
      setFormData({ name: "", amount: "", period: "monthly", category: "" });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  };

  const deleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?") || !session?.user) return;
    
    try {
      await apiClient.deleteBudget(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget. Please try again.');
    }
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
      {/* Show loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading budgets...</span>
        </div>
      )}

      {/* Show authentication prompt */}
      {!session?.user && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to manage budgets</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create and track spending limits for your subscriptions
            </p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main content for authenticated users */}
      {session?.user && !loading && (
        <>
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
          }          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
