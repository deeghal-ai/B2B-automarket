'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { BulkAction } from '@/types/inventory';

interface BulkActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedIds,
  onActionComplete,
  onClearSelection,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const count = selectedIds.length;

  if (count === 0) return null;

  const performBulkAction = async (action: BulkAction) => {
    setLoading(true);
    try {
      const response = await fetch('/api/seller/vehicles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, vehicleIds: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      onClearSelection();
      onActionComplete();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
        <span className="text-sm font-medium">
          {count} selected:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => performBulkAction('publish')}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Publish
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => performBulkAction('unpublish')}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
          Unpublish
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          Clear
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {count} vehicles?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. These vehicles will be permanently deleted
              from your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => performBulkAction('delete')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

