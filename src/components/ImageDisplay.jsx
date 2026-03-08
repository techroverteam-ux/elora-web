// components/ImageDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useImageService } from '../hooks/useImageService';

const ImageDisplay = ({ store, showType = 'all' }) => {
  const { processStoreImages, getAllImages, loading, error } = useImageService();
  const [images, setImages] = useState({ initial: [], recce: [], installation: [] });

  useEffect(() => {
    if (store) {
      loadImages();
    }
  }, [store]);

  const loadImages = async () => {
    try {
      const allImages = await getAllImages(store, 'url');
      setImages(allImages);
    } catch (err) {
      console.error('Failed to load images:', err);
    }
  };

  const renderImageSection = (title, imageList) => {
    if (!imageList.length) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageList.map((imageUrl, index) => (
            <div key={index} className="relative">
              <img
                src={imageUrl}
                alt={`${title} ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-md"
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-4">Loading images...</div>;
  if (error) return <div className="text-red-500 py-4">Error: {error}</div>;

  return (
    <div className="p-4">
      {(showType === 'all' || showType === 'initial') && 
        renderImageSection('Initial Photos', images.initial)}
      
      {(showType === 'all' || showType === 'recce') && 
        renderImageSection('Recce Photos', images.recce)}
      
      {(showType === 'all' || showType === 'installation') && 
        renderImageSection('Installation Photos', images.installation)}
    </div>
  );
};

export default ImageDisplay;