"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  X, 
  Settings, 
  Mail, 
  Smartphone, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  Sliders
} from "lucide-react";
import { Subscription } from "@/types/subscription";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { apiClient } from "@/lib/api-client";

interface NotificationsProps {
  subscriptions: Subscription[];
}

interface NotificationItem {
  id: string;
  type: "upcoming" | "today" | "overdue" | "renewed" | "cancelled" | "price_change" | "trial_ending";
  title: string;
  message: string;
  date: Date;
  subscription: Subscription;
  priority: "low" | "medium" | "high" | "critical";
  icon: React.ReactNode;
  actionable?: boolean;
}

interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  daysAhead: number;
  showRenewed: boolean;
  showPriceChanges: boolean;
  enableSound: boolean;
}

export function Notifications({ subscriptions }: NotificationsProps) {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    pushEnabled: false,
    daysAhead: 3,
    showRenewed: true,
    showPriceChanges: true,
    enableSound: false,
  });
  // Load notification settings and dismissed notifications from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        // Load settings from database
        const settings = await apiClient.getSettings();
        if (settings) {
          setNotificationSettings({
            emailEnabled: settings.emailNotifications || false,
            pushEnabled: settings.pushNotifications || false,
            daysAhead: settings.notificationDays || 3,
            showRenewed: settings.showRenewed || true,
            showPriceChanges: settings.showPriceChanges || true,
            enableSound: settings.enableSound || false,
          });
        }

        // Load dismissed notifications
        const notifications = await apiClient.getNotifications();
        const dismissedIds = notifications
          .filter((notif: any) => notif.dismissed)
          .map((notif: any) => notif.id);
        setDismissed(dismissedIds);
      } catch (error) {
        console.error('Error loading notification settings:', error);
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('notificationSettings');
        const savedDismissed = localStorage.getItem('dismissedNotifications');
        
        if (savedSettings) {
          setNotificationSettings(JSON.parse(savedSettings));
        }
        if (savedDismissed) {
          setDismissed(JSON.parse(savedDismissed));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session]);

  // Save notification settings to database
  useEffect(() => {
    const saveSettings = async () => {
      if (!session?.user) return;
      
      try {
        await apiClient.updateSettings({
          emailNotifications: notificationSettings.emailEnabled,
          pushNotifications: notificationSettings.pushEnabled,
          notificationDays: notificationSettings.daysAhead,
          showRenewed: notificationSettings.showRenewed,
          showPriceChanges: notificationSettings.showPriceChanges,
          enableSound: notificationSettings.enableSound,
        });
      } catch (error) {
        console.error('Error saving notification settings:', error);
        // Fallback to localStorage
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      }
    };

    if (!loading) {
      saveSettings();
    }
  }, [notificationSettings, session, loading]);

  // Save dismissed notifications to database
  useEffect(() => {
    const saveDismissed = async () => {
      if (!session?.user || loading) return;
      
      try {
        // Update dismissed status in database
        // This would typically be handled when dismissing individual notifications
        localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
      } catch (error) {
        console.error('Error saving dismissed notifications:', error);
        localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
      }
    };

    saveDismissed();
  }, [dismissed, session, loading]);

  // Generate notification items with enhanced logic
  const notifications: NotificationItem[] = subscriptions
    .map(sub => {
      const daysUntil = differenceInDays(sub.nextBillingDate, new Date());
      const notifications: NotificationItem[] = [];

      // Overdue notifications (critical priority)
      if (daysUntil < 0) {
        notifications.push({
          id: `overdue-${sub.id}`,
          type: "overdue",
          title: "Payment Overdue",
          message: `${sub.name} payment was due ${Math.abs(daysUntil)} days ago`,
          date: new Date(),
          subscription: sub,
          priority: "critical",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          actionable: true,
        });
      }
      // Today's charges (high priority)
      else if (isToday(sub.nextBillingDate)) {
        notifications.push({
          id: `today-${sub.id}`,
          type: "today",
          title: "Charging Today",
          message: `${sub.name} will be charged $${sub.amount} today`,
          date: new Date(),
          subscription: sub,
          priority: "high",
          icon: <DollarSign className="h-4 w-4 text-orange-500" />,
          actionable: true,
        });
      }
      // Tomorrow's charges (high priority)
      else if (isTomorrow(sub.nextBillingDate)) {
        notifications.push({
          id: `tomorrow-${sub.id}`,
          type: "upcoming",
          title: "Charging Tomorrow",
          message: `${sub.name} will be charged $${sub.amount} tomorrow`,
          date: new Date(),
          subscription: sub,
          priority: "high",
          icon: <Clock className="h-4 w-4 text-orange-500" />,
          actionable: true,
        });
      }
      // Upcoming charges (within notification window)
      else if (daysUntil <= notificationSettings.daysAhead && daysUntil > 1) {
        notifications.push({
          id: `upcoming-${daysUntil}-${sub.id}`,
          type: "upcoming",
          title: "Upcoming Charge",
          message: `${sub.name} will be charged $${sub.amount} in ${daysUntil} days`,
          date: new Date(),
          subscription: sub,
          priority: daysUntil <= 2 ? "high" : "medium",
          icon: <Bell className="h-4 w-4 text-blue-500" />,
        });
      }

      // Check for recently renewed subscriptions (last 7 days)
      if (notificationSettings.showRenewed && sub.lastBillingDate && differenceInDays(new Date(), sub.lastBillingDate) <= 7) {
        notifications.push({
          id: `renewed-${sub.id}`,
          type: "renewed",
          title: "Recently Renewed",
          message: `${sub.name} was renewed on ${format(sub.lastBillingDate, 'MMM dd')}`,
          date: sub.lastBillingDate,
          subscription: sub,
          priority: "low",
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
      }

      // Simulate price change notifications (in real app would come from service)
      if (notificationSettings.showPriceChanges && Math.random() > 0.95) {
        notifications.push({
          id: `price-change-${sub.id}`,
          type: "price_change",
          title: "Price Change Alert",
          message: `${sub.name} price increased by $2.00`,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          subscription: sub,
          priority: "medium",
          icon: <TrendingUp className="h-4 w-4 text-yellow-500" />,
          actionable: true,
        });
      }

      return notifications;
    })
    .flat()
    .filter(notification => !dismissed.includes(notification.id))
    .sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.date.getTime() - a.date.getTime();
    });
  const dismissNotification = async (id: string) => {
    setDismissed(prev => [...prev, id]);
    
    // Also save to database
    if (session?.user) {
      try {
        await apiClient.createNotification({
          type: 'dismissed',
          title: 'Dismissed Notification',
          message: `Notification ${id} dismissed`,
          dismissed: true,
          metadata: { originalId: id }
        });
      } catch (error) {
        console.error('Error saving dismissed notification:', error);
      }
    }
  };

  const clearAllNotifications = async () => {
    const notificationIds = notifications.map(n => n.id);
    setDismissed(notificationIds);
    
    // Also save to database
    if (session?.user) {
      try {
        const dismissPromises = notificationIds.map(id => 
          apiClient.createNotification({
            type: 'dismissed',
            title: 'Dismissed Notification',
            message: `Notification ${id} dismissed`,
            dismissed: true,
            metadata: { originalId: id }
          })
        );
        await Promise.all(dismissPromises);
      } catch (error) {
        console.error('Error saving dismissed notifications:', error);
      }
    }
  };
  const updateSettings = (key: keyof NotificationSettings, value: boolean | number) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800";
      case "high":
        return "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-900/20 dark:text-orange-100 dark:border-orange-800";
      case "medium":
        return "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-800";
      case "low":
        return "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800";
      default:
        return "bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-900/20 dark:text-gray-100 dark:border-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };
  return (
    <div className="space-y-6">
      {/* Show loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading notifications...</span>
        </div>
      )}

      {/* Show authentication prompt */}
      {!session?.user && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to manage notifications</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get alerts for upcoming charges and manage your notification preferences
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
          {/* Header */}
          <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {notifications.length} active
          </Badge>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllNotifications}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailEnabled}
                      onCheckedChange={(checked) => updateSettings('emailEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushEnabled}
                      onCheckedChange={(checked) => updateSettings('pushEnabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Content Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-renewed">Show Renewal Confirmations</Label>
                    <Switch
                      id="show-renewed"
                      checked={notificationSettings.showRenewed}
                      onCheckedChange={(checked) => updateSettings('showRenewed', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-price-changes">Show Price Changes</Label>
                    <Switch
                      id="show-price-changes"
                      checked={notificationSettings.showPriceChanges}
                      onCheckedChange={(checked) => updateSettings('showPriceChanges', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-sound">Enable Sound</Label>
                    <Switch
                      id="enable-sound"
                      checked={notificationSettings.enableSound}
                      onCheckedChange={(checked) => updateSettings('enableSound', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="days-ahead">Advance Notice (Days)</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified this many days before charges
                  </p>
                </div>
                <select
                  id="days-ahead"
                  value={notificationSettings.daysAhead}
                  onChange={(e) => updateSettings('daysAhead', parseInt(e.target.value))}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-center">
              No new notifications. We&apos;ll alert you about upcoming charges and important updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 hover:shadow-md ${getPriorityColor(notification.priority)}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 flex-shrink-0">
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm">
                          {notification.title}
                        </h4>
                        <Badge 
                          className={`text-xs px-2 py-1 ${getPriorityBadgeColor(notification.priority)}`}
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {format(notification.date, 'MMM d, yyyy • h:mm a')}
                        </p>
                        {notification.actionable && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:bg-background/60"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.priority === 'critical').length}
                </div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {notifications.filter(n => n.priority === 'medium').length}
                </div>
                <div className="text-sm text-muted-foreground">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.priority === 'low').length}
                </div>
                <div className="text-sm text-muted-foreground">Low</div>
              </div>
            </div>
          </CardContent>        </Card>
      )}
        </>
      )}
    </div>
  );
}
