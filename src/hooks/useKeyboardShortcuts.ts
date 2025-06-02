"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardShortcutsProps {
  onNewSubscription: () => void;
  onToggleSearch: () => void;
  onToggleTheme: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onTabChange: (tab: string) => void;
  onShowShortcuts: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts({
  onNewSubscription,
  onToggleSearch,
  onToggleTheme,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onExport,
  onTabChange,
  onShowShortcuts,
  onEscape,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useRef((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === "true"
    ) {
      // Allow escape to work even in inputs
      if (event.key === "Escape") {
        onEscape();
        (event.target as HTMLElement).blur();
      }
      return;
    }

    // Prevent default for our shortcuts
    const shortcuts = [
      "n", "s", "f", "t", "a", "d", "?", "1", "2", "3", "4", "5", 
      "Delete", "Escape", "Enter"
    ];
    
    if (shortcuts.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case "?":
        onShowShortcuts();
        break;
      case "n":
        onNewSubscription();
        break;
      case "s":
        onToggleSearch();
        break;
      case "t":
        onToggleTheme();
        break;
      case "a":
        onSelectAll();
        break;
      case "Escape":
        onEscape();
        break;
      case "d":
        onExport();
        break;
      case "Delete":
        onDeleteSelected();
        break;
      case "1":
        onTabChange("overview");
        break;
      case "2":
        onTabChange("analytics");
        break;
      case "3":
        onTabChange("calendar");
        break;
      case "4":
        onTabChange("notifications");
        break;
      case "5":
        onTabChange("budgets");
        break;
    }
  });

  useEffect(() => {
    const handler = handleKeyDown.current;
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    onNewSubscription,
    onToggleSearch,
    onToggleTheme,
    onSelectAll,
    onClearSelection,
    onDeleteSelected,
    onExport,
    onTabChange,
    onShowShortcuts,
    onEscape,
  ]);
}
