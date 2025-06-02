"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Subscription } from "@/types/subscription";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

interface CalendarViewProps {
  subscriptions: Subscription[];
}

export function CalendarView({ subscriptions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSubscriptionsForDate = (date: Date) => {
    return subscriptions.filter(sub => isSameDay(sub.nextBillingDate, date));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      entertainment: "bg-purple-100 text-purple-800 border-purple-200",
      productivity: "bg-blue-100 text-blue-800 border-blue-200",
      fitness: "bg-green-100 text-green-800 border-green-200",
      food: "bg-orange-100 text-orange-800 border-orange-200",
      education: "bg-indigo-100 text-indigo-800 border-indigo-200",
      news: "bg-gray-100 text-gray-800 border-gray-200",
      music: "bg-pink-100 text-pink-800 border-pink-200",
      gaming: "bg-red-100 text-red-800 border-red-200",
      shopping: "bg-yellow-100 text-yellow-800 border-yellow-200",
      other: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Billing Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map(date => {
            const daySubscriptions = getSubscriptionsForDate(date);
            const totalAmount = daySubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
            
            return (
              <div
                key={date.toISOString()}
                className={`min-h-[80px] p-1 border rounded-md ${
                  isToday(date) 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday(date) ? 'text-blue-600 dark:text-blue-400' : ''
                }`}>
                  {format(date, 'd')}
                </div>
                
                {daySubscriptions.length > 0 && (
                  <div className="space-y-1">
                    {daySubscriptions.slice(0, 2).map(sub => (
                      <div
                        key={sub.id}
                        className={`text-xs p-1 rounded border ${getCategoryColor(sub.category)}`}
                        title={`${sub.name} - $${sub.amount}`}
                      >
                        <div className="truncate">{sub.name}</div>
                        <div className="font-semibold">${sub.amount}</div>
                      </div>
                    ))}
                    
                    {daySubscriptions.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{daySubscriptions.length - 2} more
                      </div>
                    )}
                    
                    {totalAmount > 0 && (
                      <div className="text-xs font-bold text-right">
                        Total: ${totalAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(subscriptions.map(s => s.category))).map(category => (
              <Badge key={category} className={getCategoryColor(category)}>
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
