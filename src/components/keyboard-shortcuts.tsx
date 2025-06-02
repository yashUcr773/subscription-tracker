"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: "?", description: "Show keyboard shortcuts" },
    { key: "n", description: "Add new subscription" },
    { key: "s", description: "Focus search" },
    { key: "f", description: "Toggle filters" },
    { key: "t", description: "Switch theme" },
    { key: "1", description: "Go to Overview tab" },
    { key: "2", description: "Go to Analytics tab" },
    { key: "3", description: "Go to Calendar tab" },
    { key: "4", description: "Go to Notifications tab" },
    { key: "5", description: "Go to Budgets tab" },
    { key: "a", description: "Select all subscriptions" },
    { key: "Escape", description: "Clear selection/close dialogs" },
    { key: "d", description: "Download/export data" },
    { key: "Delete", description: "Delete selected items" },
    { key: "Enter", description: "Confirm action" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Keyboard Shortcuts
            <Badge variant="secondary" className="ml-2">
              Press ? to toggle
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm">{shortcut.description}</span>
              <Kbd>{shortcut.key}</Kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Most shortcuts work globally throughout the app. Some shortcuts may require focus on specific elements.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
