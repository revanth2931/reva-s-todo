import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Utility to create a generic HTMLImageElement from a URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Utility to extract the cropped portion as a base64 string
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Target 512x512 for the final image to keep size low but quality good
  canvas.width = 512;
  canvas.height = 512;

  // Draw the cropped image area to the 512x512 canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    512,
    512
  );

  // Return Base64 string at 0.7 quality to fit Firestore limits nicely
  return canvas.toDataURL('image/jpeg', 0.7);
}

export default function ImageCropper({ imageSrc, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedBase64);
    } catch (e) {
      console.error(e);
      // If error occurs, maybe cancel or handle gracefully
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-zinc-100">Adjust Profile Picture</h2>
          <p className="text-xs text-zinc-400 mt-1">Drag to reposition. Use the slider or pinch to zoom.</p>
        </div>

        <div className="relative w-full h-64 sm:h-72 bg-zinc-900 rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="w-full accent-violet-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-5 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
