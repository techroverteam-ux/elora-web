// components/ImageGallery.jsx
import React, { useState } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

const ImageGallery = ({ images, title, darkMode = false }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {title && (
          <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title} ({images.length})
          </h4>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, idx) => (
            <div key={idx} className="relative group">
              <img
                src={image}
                alt={`${title || 'Image'} ${idx + 1}`}
                className="w-full aspect-square object-cover rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage({ url: image, index: idx })}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.url}
              alt={`${title || 'Image'} ${selectedImage.index + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => downloadImage(selectedImage.url, `${title || 'image'}_${selectedImage.index + 1}.jpg`)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;