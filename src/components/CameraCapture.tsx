"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallback?: () => void;
  title?: string;
}

export function CameraCapture({ isOpen, onClose, onCapture, title = "Ajouter une photo" }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>
            Choisissez la méthode pour ajouter votre document ou photo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          <Button 
            variant="outline" 
            className="h-32 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            onClick={() => cameraInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Appareil Photo</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-32 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-border hover:border-muted-foreground/50 transition-all group"
            onClick={() => galleryInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="font-semibold text-foreground">Galerie</span>
          </Button>

          {/* Inputs natifs invisibles */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={cameraInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={galleryInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
