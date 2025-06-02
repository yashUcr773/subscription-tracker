import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, ExternalLink,  Edit, Trash2 } from "lucide-react";
import { Subscription } from "@/types/subscription";
import { format } from "date-fns";

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (id: string) => void;
}

export function SubscriptionCard({ 
  subscription, 
  onEdit, 
  onDelete 
}: SubscriptionCardProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      productivity: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      fitness: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      food: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      education: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      news: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      music: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      gaming: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      shopping: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      other: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getFrequencyText = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const getDaysUntilBilling = () => {
    const today = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilBilling = getDaysUntilBilling();
  const isUpcoming = daysUntilBilling <= 7 && daysUntilBilling >= 0;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isUpcoming ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {subscription.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={getCategoryColor(subscription.category)}>
            {subscription.category}
          </Badge>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onEdit?.(subscription)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={() => onDelete?.(subscription.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {formatAmount(subscription.amount, subscription.currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {getFrequencyText(subscription.billingFrequency)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={isUpcoming ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
            Next billing: {format(subscription.nextBillingDate, 'MMM d, yyyy')}
            {isUpcoming && ` (${daysUntilBilling} day${daysUntilBilling !== 1 ? 's' : ''})`}
          </span>
        </div>

        {subscription.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {subscription.description}
          </p>
        )}

        {subscription.website && (
          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href={subscription.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Visit Website
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
