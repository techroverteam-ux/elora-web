// hooks/useImageService.js
import { useState, useCallback } from 'react';
import imageService from '../utils/imageService';

export const useImageService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processStoreImages = useCallback((store) => {
    return imageService.processStoreImages(store);
  }, []);

  const getAllImages = useCallback(async (store, format = 'url') => {
    setLoading(true);
    setError(null);
    
    try {
      const images = await imageService.getAllStoreImages(store, format);
      return images;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getImageAsBase64 = useCallback(async (imageUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      const base64 = await imageService.getImageAsBase64(imageUrl);
      return base64;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    processStoreImages,
    getAllImages,
    getImageAsBase64,
    getFullImageUrl: imageService.getFullImageUrl.bind(imageService),
    parseImagePath: imageService.parseImagePath.bind(imageService)
  };
};