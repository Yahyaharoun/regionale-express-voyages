"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ImageUploadPickerProps {
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export function ImageUploadPicker({ onSelectCamera, onSelectGallery }: ImageUploadPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCamera = () => {
    setIsOpen(false);
    onSelectCamera();
  };

  const handleGallery = () => {
    setIsOpen(false);
    onSelectGallery();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full h-14 border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-all flex flex-col items-center justify-center gap-1"
        onClick={() => setIsOpen(true)}
      >
        <ImagePlus className="w-6 h-6" />
        <span className="text-sm font-medium">Ajouter un justificatif photo</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Source de l'image</DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez ajouter le justificatif.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-primary/20 hover:bg-primary/5 shadow-sm"
              onClick={handleCamera}
            >
              <Camera className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">Prendre photo</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-primary/20 hover:bg-primary/5 shadow-sm"
              onClick={handleGallery}
            >
              <ImageIcon className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium">Galerie / Fichier</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
