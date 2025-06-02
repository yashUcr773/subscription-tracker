"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Merge, X, Eye } from "lucide-react";
import { Subscription } from "@/types/subscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DuplicateDetectorProps {
  subscriptions: Subscription[];
  onMerge: (keepId: string, removeId: string) => void;
}

interface DuplicateGroup {
  key: string;
  subscriptions: Subscription[];
  similarity: number;
  reason: string;
}

// Helper functions moved outside component to avoid useCallback dependencies
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.toLowerCase();
  }
};

const calculateSimilarity = (sub1: Subscription, sub2: Subscription) => {
  let score = 0;
  const reasons = [];

  // Name similarity (Levenshtein distance)
  const nameSimilarity = 1 - (levenshteinDistance(
    sub1.name.toLowerCase(), 
    sub2.name.toLowerCase()
  ) / Math.max(sub1.name.length, sub2.name.length));
  
  if (nameSimilarity > 0.8) {
    score += 0.4;
    reasons.push('Similar names');
  }

  // Exact amount match
  if (Math.abs(sub1.amount - sub2.amount) < 0.01) {
    score += 0.3;
    reasons.push('Same amount');
  }

  // Same category
  if (sub1.category === sub2.category) {
    score += 0.2;
    reasons.push('Same category');
  }

  // Same billing frequency
  if (sub1.billingFrequency === sub2.billingFrequency) {
    score += 0.1;
    reasons.push('Same billing frequency');
  }

  // Website similarity
  if (sub1.website && sub2.website) {
    const domain1 = extractDomain(sub1.website);
    const domain2 = extractDomain(sub2.website);
    if (domain1 === domain2) {
      score += 0.3;
      reasons.push('Same website');
    }
  }

  return { score, reasons };
};

const determineDuplicateReason = (sub1: Subscription, sub2: Subscription): string => {
  const similarity = calculateSimilarity(sub1, sub2);
  return similarity.reasons.join(', ');
};

export function DuplicateDetector({ subscriptions, onMerge }: DuplicateDetectorProps) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [dismissedDuplicates, setDismissedDuplicates] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('subscriptionTracker_dismissedDuplicates');
    if (saved) {
      setDismissedDuplicates(new Set(JSON.parse(saved)));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('subscriptionTracker_dismissedDuplicates', JSON.stringify([...dismissedDuplicates]));
  }, [dismissedDuplicates]);

  const detectDuplicates = useCallback(() => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    subscriptions.forEach((sub1, i) => {
      if (processed.has(sub1.id)) return;

      const similarSubs = [sub1];
      
      subscriptions.forEach((sub2, j) => {
        if (i >= j || processed.has(sub2.id)) return;

        const similarity = calculateSimilarity(sub1, sub2);
        if (similarity.score > 0.7) {
          similarSubs.push(sub2);
          processed.add(sub2.id);
        }
      });

      if (similarSubs.length > 1) {
        const key = similarSubs.map(s => s.id).sort().join('-');
        if (!dismissedDuplicates.has(key)) {
          groups.push({
            key,
            subscriptions: similarSubs,
            similarity: 0.8, // Average similarity
            reason: determineDuplicateReason(similarSubs[0], similarSubs[1])
          });
        }
      }
      
      processed.add(sub1.id);
    });

    setDuplicates(groups);
  }, [subscriptions, dismissedDuplicates]);
  useEffect(() => {
    detectDuplicates();
  }, [detectDuplicates]);

  const handleMerge = (keepId: string, removeId: string) => {
    onMerge(keepId, removeId);
    // Remove the group that contained these subscriptions
    setDuplicates(prev => prev.filter(group => 
      !group.subscriptions.some(sub => sub.id === removeId)
    ));
  };

  const handleDismiss = (group: DuplicateGroup) => {
    setDismissedDuplicates(prev => new Set([...prev, group.key]));
  };

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Potential Duplicates Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 dark:text-orange-300 mb-4">
            We found {duplicates.length} potential duplicate subscription{duplicates.length > 1 ? 's' : ''}. 
            Review them to avoid double charges.
          </p>
          <div className="space-y-3">
            {duplicates.map((group) => (
              <div key={group.key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">
                      {group.subscriptions.map(sub => sub.name).join(' & ')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {(group.similarity * 100).toFixed(0)}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{group.reason}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(group)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Potential Duplicates</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These subscriptions appear to be duplicates based on: {selectedGroup.reason}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {selectedGroup.subscriptions.map((sub) => (
                  <Card key={sub.id} className="relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{sub.name}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {sub.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <p><strong>Amount:</strong> ${sub.amount} / {sub.billingFrequency}</p>
                        <p><strong>Next billing:</strong> {sub.nextBillingDate.toLocaleDateString()}</p>
                        {sub.website && <p><strong>Website:</strong> {sub.website}</p>}
                        {sub.description && <p><strong>Description:</strong> {sub.description}</p>}
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const otherSub = selectedGroup.subscriptions.find(s => s.id !== sub.id);
                            if (otherSub) {
                              handleMerge(sub.id, otherSub.id);
                              setSelectedGroup(null);
                            }
                          }}
                        >
                          <Merge className="h-4 w-4 mr-1" />
                          Keep This
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    if (selectedGroup) {
                      handleDismiss(selectedGroup);
                      setSelectedGroup(null);
                    }
                  }}
                >
                  Not Duplicates
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
