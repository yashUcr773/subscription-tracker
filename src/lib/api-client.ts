// Utility functions for migrating from localStorage to database
export const apiClient = {
  // Subscriptions
  async getSubscriptions() {
    const response = await fetch('/api/subscriptions');
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  async createSubscription(subscription: any) {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) throw new Error('Failed to create subscription');
    return response.json();
  },

  async updateSubscription(id: string, subscription: any) {
    const response = await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) throw new Error('Failed to update subscription');
    return response.json();
  },

  async deleteSubscription(id: string) {
    const response = await fetch(`/api/subscriptions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete subscription');
    return response.json();
  },

  // Budgets
  async getBudgets() {
    const response = await fetch('/api/budgets');
    if (!response.ok) throw new Error('Failed to fetch budgets');
    return response.json();
  },

  async createBudget(budget: any) {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget)
    });
    if (!response.ok) throw new Error('Failed to create budget');
    return response.json();
  },

  async updateBudget(budget: any) {
    const response = await fetch('/api/budgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget)
    });
    if (!response.ok) throw new Error('Failed to update budget');
    return response.json();
  },

  async deleteBudget(id: string) {
    const response = await fetch(`/api/budgets?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete budget');
    return response.json();
  },

  // Settings
  async getSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(settings: any) {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  // Notifications
  async getNotifications() {
    const response = await fetch('/api/notifications');
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async createNotification(notification: any) {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  },

  async markNotificationsAsRead(notificationIds: string[]) {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAsRead', notificationIds })
    });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
    return response.json();
  },

  async markAllNotificationsAsRead() {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllAsRead' })
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
  },

  async deleteNotification(id: string) {
    const response = await fetch(`/api/notifications?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete notification');
    return response.json();
  }
};

// Helper function to migrate localStorage data to database
export async function migrateLocalStorageData() {
  try {
    // Migrate subscriptions
    const localSubscriptions = localStorage.getItem('subscriptionTracker');
    if (localSubscriptions) {
      const subscriptions = JSON.parse(localSubscriptions);
      for (const subscription of subscriptions) {
        try {
          await apiClient.createSubscription(subscription);
        } catch (error) {
          console.error('Error migrating subscription:', error);
        }
      }
      localStorage.removeItem('subscriptionTracker');
    }

    // Migrate budgets
    const localBudgets = localStorage.getItem('subscriptionTracker_budgets');
    if (localBudgets) {
      const budgets = JSON.parse(localBudgets);
      for (const budget of budgets) {
        try {
          await apiClient.createBudget(budget);
        } catch (error) {
          console.error('Error migrating budget:', error);
        }
      }
      localStorage.removeItem('subscriptionTracker_budgets');
    }

    // Migrate notification settings
    const notificationSettings = localStorage.getItem('notificationSettings');
    if (notificationSettings) {
      try {
        const settings = JSON.parse(notificationSettings);
        await apiClient.updateSettings(settings);
        localStorage.removeItem('notificationSettings');
      } catch (error) {
        console.error('Error migrating notification settings:', error);
      }
    }

    console.log('localStorage migration completed');
  } catch (error) {
    console.error('Error during localStorage migration:', error);
  }
}
