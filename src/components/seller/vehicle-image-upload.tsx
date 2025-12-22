'use client';

import { useState, useCallback, useRef } from 'react';
import { VehicleImage } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  X,
  Star,
  Trash2,
  Loader2,
  ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleImageUploadProps {
  vehicleId: string;
  initialImages: VehicleImage[];
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function VehicleImageUpload({
  vehicleId,
  initialImages,
}: VehicleImageUploadProps) {
  const [images, setImages] = useState<VehicleImage[]>(initialImages);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<VehicleImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = MAX_IMAGES - images.length - uploading.length;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Allowed: JPEG, PNG, WebP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum 5MB allowed';
    }
    return null;
  };

  const uploadFile = async (file: File, uploadId: string) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/seller/vehicles/${vehicleId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const newImage = await response.json();

      // Update uploading status
      setUploading((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: 100, status: 'success' } : u
        )
      );

      // Add to images list after a short delay
      setTimeout(() => {
        setImages((prev) => [...prev, newImage]);
        setUploading((prev) => prev.filter((u) => u.id !== uploadId));
      }, 500);
    } catch (error) {
      setUploading((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : u
        )
      );
    }
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: { file: File; id: string }[] = [];

      for (const file of fileArray) {
        if (validFiles.length >= remainingSlots) {
          break;
        }

        const error = validateFile(file);
        if (error) {
          // Show error briefly in uploading state
          const id = `${Date.now()}-${Math.random()}`;
          setUploading((prev) => [
            ...prev,
            { id, file, progress: 0, status: 'error', error },
          ]);
          setTimeout(() => {
            setUploading((prev) => prev.filter((u) => u.id !== id));
          }, 3000);
        } else {
          validFiles.push({ file, id: `${Date.now()}-${Math.random()}` });
        }
      }

      // Add valid files to uploading state and start uploads
      for (const { file, id } of validFiles) {
        setUploading((prev) => [
          ...prev,
          { id, file, progress: 30, status: 'uploading' },
        ]);
        uploadFile(file, id);
      }
    },
    [remainingSlots, vehicleId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSetPrimary = async (imageId: string) => {
    setSettingPrimary(imageId);
    try {
      const response = await fetch(
        `/api/seller/vehicles/${vehicleId}/images/${imageId}`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }

      // Update local state
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }))
      );
    } catch (error) {
      console.error('Set primary error:', error);
    } finally {
      setSettingPrimary(null);
    }
  };

  const handleDeleteClick = (image: VehicleImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/seller/vehicles/${vehicleId}/images/${imageToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remove from local state
      setImages((prev) => {
        const remaining = prev.filter((img) => img.id !== imageToDelete.id);
        // If deleted was primary and there are remaining images, first one becomes primary
        if (imageToDelete.isPrimary && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        return remaining;
      });
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  // Sort images: primary first, then by order
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.order - b.order;
  });

  // Check if there are multiple primaries (data corruption case)
  const primaryCount = images.filter((img) => img.isPrimary).length;
  const hasMultiplePrimaries = primaryCount > 1;

  // Determine the "true" primary - first in sorted list
  const truePrimaryId = sortedImages.length > 0 ? sortedImages[0].id : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vehicle Images</span>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} / {MAX_IMAGES} images
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Dropzone */}
        {remainingSlots > 0 && (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP up to 5MB ({remainingSlots} remaining)
            </p>
          </div>
        )}

        {/* Uploading Progress */}
        {uploading.length > 0 && (
          <div className="space-y-2">
            {uploading.map((upload) => (
              <div
                key={upload.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  upload.status === 'error'
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-muted'
                )}
              >
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {upload.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : upload.status === 'error' ? (
                    <X className="h-5 w-5 text-destructive" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {upload.file.name}
                  </p>
                  {upload.status === 'error' ? (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  ) : (
                    <Progress value={upload.progress} className="h-1 mt-1" />
                  )}
                </div>
                {upload.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setUploading((prev) =>
                        prev.filter((u) => u.id !== upload.id)
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Image Grid */}
        {sortedImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  'relative group rounded-lg overflow-hidden border-2 aspect-[4/3]',
                  image.id === truePrimaryId ? 'border-primary' : 'border-transparent'
                )}
              >
                <img
                  src={image.url}
                  alt="Vehicle"
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge - only show on the "true" primary (first in list) */}
                {image.id === truePrimaryId && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Show Set Primary button if not the true primary, or if there are multiple primaries */}
                  {(image.id !== truePrimaryId || hasMultiplePrimaries) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={settingPrimary === image.id}
                    >
                      {settingPrimary === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Set Primary
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClick(image)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : uploading.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No images uploaded yet</p>
            <p className="text-sm">
              Upload images to showcase your vehicle to buyers
            </p>
          </div>
        ) : null}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete image?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this image? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            {imageToDelete && (
              <div className="my-4">
                <img
                  src={imageToDelete.url}
                  alt="To delete"
                  className="w-full max-h-48 object-contain rounded"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
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
      </CardContent>
    </Card>
  );
}

