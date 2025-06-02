"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, Trash2, Pause, Play, Archive, Download, Check } from "lucide-react";
import { Subscription } from "@/types/subscription";

interface BulkActionsProps {
  subscriptions: Subscription[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

export function BulkActions({ 
  subscriptions, 
  selectedIds, 
  onSelectionChange, 
  onBulkAction 
}: BulkActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: string; label: string } | null>(null);

  const selectedSubscriptions = subscriptions.filter(sub => selectedIds.includes(sub.id));
  const allSelected = subscriptions.length > 0 && selectedIds.length === subscriptions.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < subscriptions.length;

  const handleSelectAll = () => {
    if (allSelected || someSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(subscriptions.map(sub => sub.id));
    }
  };

  const handleBulkAction = (action: string, label: string, requiresConfirmation = true) => {
    if (selectedIds.length === 0) return;

    if (requiresConfirmation && (action === 'delete' || action === 'cancel')) {
      setPendingAction({ action, label });
      setShowConfirmDialog(true);
    } else {
      onBulkAction(action, selectedIds);
      onSelectionChange([]);
    }
  };

  const confirmAction = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.action, selectedIds);
      onSelectionChange([]);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const getSelectedStats = () => {
    const totalAmount = selectedSubscriptions.reduce((sum, sub) => {
      let monthlyAmount = sub.amount;
      if (sub.billingFrequency === 'yearly') monthlyAmount /= 12;
      if (sub.billingFrequency === 'quarterly') monthlyAmount /= 3;
      if (sub.billingFrequency === 'weekly') monthlyAmount *= 4.33;
      return sum + monthlyAmount;
    }, 0);

    const statusCounts = selectedSubscriptions.reduce((counts, sub) => {
      counts[sub.status] = (counts[sub.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return { totalAmount, statusCounts };
  };

  if (subscriptions.length === 0) return null;

  const { totalAmount, statusCounts } = getSelectedStats();
  const activeCount = statusCounts.active || 0;
  const pausedCount = statusCounts.paused || 0;
  const cancelledCount = statusCounts.cancelled || 0;

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              ref={(ref) => {
                if (ref) {
                  (ref as any).indeterminate = someSelected;
                }
              }}
            />
            <span className="text-sm font-medium">
              {selectedIds.length === 0 
                ? `Select all (${subscriptions.length})`
                : `${selectedIds.length} of ${subscriptions.length} selected`
              }
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                ~${totalAmount.toFixed(2)}/mo
              </Badge>
              {activeCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {activeCount} active
                </Badge>
              )}
              {pausedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pausedCount} paused
                </Badge>
              )}
              {cancelledCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {cancelledCount} cancelled
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedIds.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {activeCount > 0 && (
                    <DropdownMenuItem onClick={() => handleBulkAction('pause', 'Pause subscriptions', false)}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Selected ({activeCount})
                    </DropdownMenuItem>
                  )}
                  {pausedCount > 0 && (
                    <DropdownMenuItem onClick={() => handleBulkAction('activate', 'Activate subscriptions', false)}>
                      <Play className="h-4 w-4 mr-2" />
                      Activate Selected ({pausedCount})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('export', 'Export subscriptions', false)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction('delete', 'Delete subscriptions')}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="text-muted-foreground"
              >
                Clear Selection
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to {pendingAction?.label.toLowerCase()} the following {selectedIds.length} subscription{selectedIds.length > 1 ? 's' : ''}?
            </p>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {selectedSubscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">{sub.name}</span>
                  <Badge variant="outline" className="text-xs">
                    ${sub.amount}/{sub.billingFrequency.slice(0, 1)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Total monthly impact:</span>
              <span className="font-medium">${totalAmount.toFixed(2)}/month</span>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant={pendingAction?.action === 'delete' ? 'destructive' : 'default'}
                onClick={confirmAction}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm {pendingAction?.label}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
