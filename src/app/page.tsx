"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { BulkActions } from "@/components/bulk-actions";
import { DuplicateDetector } from "@/components/duplicate-detector";
import { BudgetManager } from "@/components/budget-manager";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTheme } from "@/components/theme-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, TrendingUp, Bell, AlertTriangle, Grid3X3, BarChart3, CalendarDays, Search, Filter, Download, HelpCircle } from "lucide-react";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionForm } from "@/components/subscription-form";
import { Analytics } from "@/components/analytics";
import { CalendarView } from "@/components/calendar-view";
import { Notifications } from "@/components/notifications";
import { Subscription, SubscriptionFormData } from "@/types/subscription";
import { apiClient, migrateLocalStorageData } from "@/lib/api-client";

export default function Home() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load subscriptions from database on component mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        setLoading(false);
        return;
      }

      try {
        // Try to migrate localStorage data first
        await migrateLocalStorageData();
        
        // Load subscriptions from database
        const data = await apiClient.getSubscriptions();
        
        // Convert date strings back to Date objects
        const subscriptions = data.map((sub: any) => ({
          ...sub,
          nextBillingDate: new Date(sub.nextBillingDate),
          lastBillingDate: sub.lastBillingDate ? new Date(sub.lastBillingDate) : undefined,
          createdAt: new Date(sub.createdAt),
          updatedAt: new Date(sub.updatedAt),
        }));
        
        setSubscriptions(subscriptions);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        // Fallback to localStorage if database fails
        const savedSubscriptions = localStorage.getItem('subscriptionTracker');
        if (savedSubscriptions) {
          const parsed = JSON.parse(savedSubscriptions);
          const subscriptions = parsed.map((sub: any) => ({
            ...sub,
            nextBillingDate: new Date(sub.nextBillingDate),
            lastBillingDate: sub.lastBillingDate ? new Date(sub.lastBillingDate) : undefined,
            createdAt: new Date(sub.createdAt),
            updatedAt: new Date(sub.updatedAt),
          }));
          setSubscriptions(subscriptions);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [status]);

  // Export functionality
  const handleExportData = () => {
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `subscription-tracker-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Filter subscriptions based on search and filter criteria
  const filteredSubscriptions = subscriptions.filter((sub: Subscription) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || sub.category === filterCategory;
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Keyboard shortcuts setup
  useKeyboardShortcuts({
    onNewSubscription: () => setShowForm(true),
    onToggleSearch: () => searchInputRef.current?.focus(),
    onToggleTheme: () => {
      // Cycle through themes: light -> dark -> system
      const currentTheme = localStorage.getItem('theme') || 'system';
      const nextTheme = currentTheme === 'light' ? 'dark' : 
                       currentTheme === 'dark' ? 'system' : 'light';
      setTheme(nextTheme);
    },
    onSelectAll: () => {
      if (selectedIds.length === filteredSubscriptions.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(filteredSubscriptions.map((sub: Subscription) => sub.id));
      }
    },
    onClearSelection: () => setSelectedIds([]),
    onDeleteSelected: () => handleBulkAction('delete', selectedIds),
    onExport: handleExportData,
    onTabChange: setActiveTab,
    onShowShortcuts: () => setShowKeyboardShortcuts(true),
    onEscape: () => {
      setSelectedIds([]);
      setShowForm(false);
      setEditingSubscription(null);
      setShowKeyboardShortcuts(false);
    },
  });

  const handleAddSubscription = async (data: SubscriptionFormData) => {
    try {
      const subscriptionData = {
        name: data.name,
        amount: data.amount,
        billingFrequency: data.billingFrequency,
        nextBillingDate: data.nextBillingDate,
        category: data.category,
        description: data.description,
        currency: data.currency,
        website: data.website,
        status: 'active'
      };

      const newSubscription = await apiClient.createSubscription(subscriptionData);
      
      // Convert to frontend format
      const formattedSubscription: Subscription = {
        ...newSubscription,
        nextBillingDate: new Date(newSubscription.nextBillingDate),
        lastBillingDate: newSubscription.lastBillingDate ? new Date(newSubscription.lastBillingDate) : undefined,
        createdAt: new Date(newSubscription.createdAt),
        updatedAt: new Date(newSubscription.updatedAt),
      };

      setSubscriptions(prev => [...prev, formattedSubscription]);
      setShowForm(false);
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Failed to add subscription. Please try again.');
    }
  };

  const handleEditSubscription = async (data: SubscriptionFormData) => {
    if (!editingSubscription) return;

    try {
      const subscriptionData = {
        name: data.name,
        amount: data.amount,
        billingFrequency: data.billingFrequency,
        nextBillingDate: data.nextBillingDate,
        category: data.category,
        description: data.description,
        currency: data.currency,
        website: data.website,
        status: editingSubscription.status
      };

      const updatedSubscription = await apiClient.updateSubscription(editingSubscription.id, subscriptionData);
      
      // Convert to frontend format
      const formattedSubscription: Subscription = {
        ...updatedSubscription,
        nextBillingDate: new Date(updatedSubscription.nextBillingDate),
        lastBillingDate: updatedSubscription.lastBillingDate ? new Date(updatedSubscription.lastBillingDate) : undefined,
        createdAt: new Date(updatedSubscription.createdAt),
        updatedAt: new Date(updatedSubscription.updatedAt),
      };

      setSubscriptions(prev => 
        prev.map(sub => sub.id === editingSubscription.id ? formattedSubscription : sub)
      );
      setEditingSubscription(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (confirm("Are you sure you want to delete this subscription?")) {
      try {
        await apiClient.deleteSubscription(id);
        setSubscriptions(prev => prev.filter(sub => sub.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      } catch (error) {
        console.error('Error deleting subscription:', error);
        alert('Failed to delete subscription. Please try again.');
      }
    }
  };

  // Bulk actions handler
  const handleBulkAction = async (action: string, ids: string[]) => {
    try {
      switch (action) {
        case 'delete':
          await Promise.all(ids.map(id => apiClient.deleteSubscription(id)));
          setSubscriptions(prev => prev.filter(sub => !ids.includes(sub.id)));
          break;
        case 'pause':
          const pausePromises = ids.map(async (id) => {
            const sub = subscriptions.find(s => s.id === id);
            if (sub) {
              const updateData = {
                name: sub.name,
                amount: sub.amount,
                billingFrequency: sub.billingFrequency,
                nextBillingDate: sub.nextBillingDate.toISOString(),
                category: sub.category,
                description: sub.description,
                currency: sub.currency,
                website: sub.website,
                status: 'paused'
              };
              return apiClient.updateSubscription(id, updateData);
            }
          });
          await Promise.all(pausePromises);
          setSubscriptions(prev => prev.map(sub => 
            ids.includes(sub.id) ? { ...sub, status: 'paused' as const, updatedAt: new Date() } : sub
          ));
          break;
        case 'activate':
          const activatePromises = ids.map(async (id) => {
            const sub = subscriptions.find(s => s.id === id);
            if (sub) {
              const updateData = {
                name: sub.name,
                amount: sub.amount,
                billingFrequency: sub.billingFrequency,
                nextBillingDate: sub.nextBillingDate.toISOString(),
                category: sub.category,
                description: sub.description,
                currency: sub.currency,
                website: sub.website,
                status: 'active'
              };
              return apiClient.updateSubscription(id, updateData);
            }
          });
          await Promise.all(activatePromises);
          setSubscriptions(prev => prev.map(sub => 
            ids.includes(sub.id) ? { ...sub, status: 'active' as const, updatedAt: new Date() } : sub
          ));
          break;
        case 'export':
          const selectedSubs = subscriptions.filter(sub => ids.includes(sub.id));
          const dataStr = JSON.stringify(selectedSubs, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = `selected-subscriptions-${new Date().toISOString().split('T')[0]}.json`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          break;
      }
      setSelectedIds([]);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      alert(`Failed to ${action} subscriptions. Please try again.`);
    }
  };

  // Duplicate detection handlers
  const handleMergeDuplicates = (keepId: string, removeId: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== removeId));
    setSelectedIds(prev => prev.filter(id => id !== removeId));
  };

  const totalMonthlySpend = subscriptions.reduce((total: number, sub: Subscription) => {
    const monthlyAmount = sub.billingFrequency === "yearly" ? sub.amount / 12 :
                         sub.billingFrequency === "quarterly" ? sub.amount / 3 :
                         sub.billingFrequency === "weekly" ? sub.amount * 4 :
                         sub.amount;
    return total + monthlyAmount;
  }, 0);

  const upcomingCharges = subscriptions.filter((sub: Subscription) => {
    const daysUntilBilling = Math.ceil(
      (sub.nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilBilling <= 7 && daysUntilBilling >= 0;
  });

  // Show loading state
  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Subscription Tracker</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your subscriptions
          </p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (showForm || editingSubscription) {
    return (
      <div className="container mx-auto p-6">
        <SubscriptionForm
          onSubmit={editingSubscription ? handleEditSubscription : handleAddSubscription}
          onCancel={() => {
            setShowForm(false);
            setEditingSubscription(null);
          }}
          initialData={editingSubscription ? {
            name: editingSubscription.name,
            category: editingSubscription.category,
            amount: editingSubscription.amount,
            currency: editingSubscription.currency,
            billingFrequency: editingSubscription.billingFrequency,
            nextBillingDate: editingSubscription.nextBillingDate.toISOString().split('T')[0],
            description: editingSubscription.description,
            website: editingSubscription.website,
          } : undefined}
          isEditing={!!editingSubscription}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Subscription Tracker</h1>
          <p className="text-muted-foreground">
            Manage and track all your recurring subscriptions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowKeyboardShortcuts(true)}
            className="hidden sm:flex"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <ThemeToggle />
          <Button 
            onClick={handleExportData} 
            variant="outline" 
            className="flex-1 sm:flex-none"
            disabled={subscriptions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isMobile ? "Export" : "Export"}
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? "Add" : "Add Subscription"}
          </Button>
        </div>
      </div>

      {/* Duplicate Detection */}
      <DuplicateDetector
        subscriptions={subscriptions}
        onMerge={handleMergeDuplicates}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          subscriptions={subscriptions}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkAction={handleBulkAction}
        />
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions.length} active subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Charges</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCharges.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalMonthlySpend * 12).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated yearly cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            {!isMobile && "Overview"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {!isMobile && "Analytics"}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {!isMobile && "Calendar"}
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {!isMobile && "Budget"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {!isMobile && "Alerts"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filteredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
                  <p className="text-muted-foreground mb-4">
                    {subscriptions.length === 0 
                      ? "Get started by adding your first subscription"
                      : "Try adjusting your search or filter criteria"
                    }
                  </p>
                  {subscriptions.length === 0 && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSubscriptions.map((subscription) => (
                <div key={subscription.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedIds.includes(subscription.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(prev => [...prev, subscription.id]);
                        } else {
                          setSelectedIds(prev => prev.filter(id => id !== subscription.id));
                        }
                      }}
                    />
                  </div>
                  <SubscriptionCard
                    subscription={subscription}
                    onEdit={() => setEditingSubscription(subscription)}
                    onDelete={() => handleDeleteSubscription(subscription.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManager subscriptions={subscriptions} />
        </TabsContent>

        <TabsContent value="notifications">
          <Notifications subscriptions={subscriptions} />
        </TabsContent>
      </Tabs>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        open={showKeyboardShortcuts} 
        onOpenChange={setShowKeyboardShortcuts} 
      />
    </div>
  );
}
