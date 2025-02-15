import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  onCroppedImage: (croppedImage: string) => void;
  onCancel: () => void;
  imageFile: File;
  onError?: (error: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function ImageCropper({ onCroppedImage, onCancel, imageFile, onError }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 400,
    height: 300,
    x: 0,
    y: 0,
  });
  const [imageSrc, setImageSrc] = useState<string>('');
  const [error, setError] = useState<string>('');
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Validate file before processing
  useEffect(() => {
    try {
      if (!imageFile) {
        throw new Error('No image file provided');
      }

      if (!ALLOWED_TYPES.includes(imageFile.type)) {
        throw new Error('Invalid file type. Please use JPEG, PNG, or GIF images.');
      }

      if (imageFile.size > MAX_FILE_SIZE) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const reader = new FileReader();
      
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setError('');
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };

      reader.readAsDataURL(imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load image';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [imageFile, onError]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const { width, height } = e.currentTarget;
      
      if (width < 100 || height < 100) {
        throw new Error('Image dimensions too small. Minimum size is 100x100 pixels.');
      }

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
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): string => {
    try {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to create image context');
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to crop image';
      setError(errorMessage);
      onError?.(errorMessage);
      return '';
    }
  };

  const handleCrop = () => {
    try {
      if (!imageRef.current) {
        throw new Error('No image loaded');
      }

      if (!crop.width || !crop.height) {
        throw new Error('Invalid crop selection');
      }

      const croppedImage = getCroppedImg(imageRef.current, crop as PixelCrop);
      if (!croppedImage) {
        throw new Error('Failed to generate cropped image');
      }

      onCroppedImage(croppedImage);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save cropped image';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] p-6 rounded-lg max-w-2xl w-full mx-4">
        <h3 className="text-lg font-medium text-white mb-4">Crop Image</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-4">
          {imageSrc && !error && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={4/3}
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
            disabled={!!error || !imageSrc}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              error || !imageSrc
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500'
            } text-white transition-colors`}
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
} 
