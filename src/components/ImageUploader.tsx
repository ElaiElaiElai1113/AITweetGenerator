import { useState, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { fileToBase64, extractMultipleVideoFrames } from "@/lib/vision";

const MAX_IMAGE_FILES = 6;

export interface UploadedMedia {
  files: File[];
  type: "image" | "video";
  previews: string[];
  base64?: string;
  images?: string[];
  isVideo?: boolean;
}

interface ImageUploaderProps {
  media: UploadedMedia | null;
  onMediaChange: (media: UploadedMedia | null) => void;
  loading?: boolean;
}

function revokePreviewUrls(previews: string[]) {
  previews.forEach((preview) => {
    URL.revokeObjectURL(preview);
  });
}

export function ImageUploader({ media, onMediaChange, loading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setNewMedia = useCallback(
    (nextMedia: UploadedMedia) => {
      if (media?.previews?.length) {
        revokePreviewUrls(media.previews);
      }
      onMediaChange(nextMedia);
    },
    [media, onMediaChange],
  );

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (videoFiles.length > 0) {
      if (files.length > 1) {
        alert("Please upload one video at a time. For multiple submissions, upload multiple images.");
        return;
      }

      const videoFile = videoFiles[0];
      try {
        const images = await extractMultipleVideoFrames(videoFile);
        const preview = URL.createObjectURL(videoFile);
        setNewMedia({
          files: [videoFile],
          type: "video",
          previews: [preview],
          base64: images[0],
          images,
          isVideo: true,
        });
      } catch (error) {
        console.error("Failed to extract video frames:", error);
        alert("Failed to process video. Please try an image file.");
      }
      return;
    }

    if (imageFiles.length === 0) {
      alert("Please upload an image or video file.");
      return;
    }

    const selectedImages = imageFiles.slice(0, MAX_IMAGE_FILES);
    if (imageFiles.length > MAX_IMAGE_FILES) {
      alert(`Only the first ${MAX_IMAGE_FILES} images will be used.`);
    }

    const base64Images = await Promise.all(selectedImages.map((file) => fileToBase64(file)));
    const previews = selectedImages.map((file) => URL.createObjectURL(file));

    setNewMedia({
      files: selectedImages,
      type: "image",
      previews,
      base64: base64Images[0],
      images: base64Images,
      isVideo: false,
    });
  }, [setNewMedia]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      void handleFiles(files);
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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFiles(Array.from(files));
      }
    },
    [handleFiles]
  );

  const handleRemove = useCallback(() => {
    if (media?.previews?.length) {
      revokePreviewUrls(media.previews);
    }
    onMediaChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [media, onMediaChange]);

  const totalSizeMb = media
    ? media.files.reduce((total, file) => total + file.size, 0) / 1024 / 1024
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {media ? "Uploaded Media" : "Upload Media (Optional)"}
        </h3>
        {media && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {!media ? (
        <Card
          className={`border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag & drop images or a video here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" /> Up to {MAX_IMAGE_FILES} images
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" /> 1 video
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WEBP, MP4, MOV, WEBM
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={handleFileInput}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {media.type === "video" ? (
            <div className="relative aspect-video bg-black">
              <video
                src={media.previews[0]}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : media.previews.length === 1 ? (
            <div className="relative aspect-video bg-black">
              <img
                src={media.previews[0]}
                alt="Uploaded"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-muted/20">
              {media.previews.map((preview, index) => (
                <div key={preview} className="relative aspect-square bg-black/5 rounded overflow-hidden">
                  <img
                    src={preview}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="p-3 flex items-center justify-between bg-muted/50">
            <span className="text-xs text-muted-foreground truncate max-w-[220px]">
              {media.files.length === 1
                ? media.files[0].name
                : `${media.files.length} images selected`}
            </span>
            <span className="text-xs text-muted-foreground">
              {totalSizeMb.toFixed(2)} MB
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
