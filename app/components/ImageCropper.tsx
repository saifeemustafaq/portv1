import { useState, useRef } from 'react';
import Image from 'next/image';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  onCroppedImage: (croppedImage: string) => void;
  onCancel: () => void;
  imageFile: File;
}

export default function ImageCropper({ onCroppedImage, onCancel, imageFile }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 300,
    height: 300,
    x: 0,
    y: 0,
  });
  const [imageSrc, setImageSrc] = useState<string>('');
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image when component mounts
  useState(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(imageFile);
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height);
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y,
    });
    
    imageRef.current = e.currentTarget;
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): string => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleCrop = () => {
    if (imageRef.current && crop.width && crop.height) {
      const croppedImage = getCroppedImg(imageRef.current, crop as PixelCrop);
      onCroppedImage(croppedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] p-6 rounded-lg max-w-2xl w-full mx-4">
        <h3 className="text-lg font-medium text-white mb-4">Crop Image</h3>
        <div className="flex justify-center mb-4">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={1}
              className="max-h-[60vh]"
            >
              <Image
                ref={imageRef}
                src={imageSrc}
                alt="Crop me"
                onLoad={onImageLoad}
                className="max-h-[60vh] w-auto"
                width={500}
                height={500}
                style={{ maxHeight: '60vh', width: 'auto' }}
              />
            </ReactCrop>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
} 
