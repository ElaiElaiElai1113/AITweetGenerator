import { useState, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { fileToBase64, extractVideoFrame } from "@/lib/vision";

export interface UploadedMedia {
  file: File;
  type: "image" | "video";
  preview: string;
  base64?: string;
}

interface ImageUploaderProps {
  media: UploadedMedia | null;
  onMediaChange: (media: UploadedMedia | null) => void;
  loading?: boolean;
}

export function ImageUploader({ media, onMediaChange, loading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      // Handle image
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      onMediaChange({
        file,
        type: "image",
        preview,
        base64,
      });
    } else if (fileType.startsWith("video/")) {
      // Handle video - extract first frame
      try {
        const base64 = await extractVideoFrame(file);
        const preview = URL.createObjectURL(file);
        onMediaChange({
          file,
          type: "video",
          preview,
          base64,
        });
      } catch (error) {
        console.error("Failed to extract video frame:", error);
        alert("Failed to process video. Please try an image file.");
      }
    } else {
      alert("Please upload an image or video file.");
    }
  }, [onMediaChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
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
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (media?.preview) {
      URL.revokeObjectURL(media.preview);
    }
    onMediaChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [media, onMediaChange]);

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
                Drag & drop an image or video here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" /> JPG, PNG, WEBP
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" /> MP4, MOV, WEBM
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Requires Gemini or OpenAI API key for vision analysis
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileInput}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            {media.type === "image" ? (
              <img
                src={media.preview}
                alt="Uploaded"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={media.preview}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="p-3 flex items-center justify-between bg-muted/50">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {media.file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {(media.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
