// utils/imageService.js
class ImageService {
  constructor() {
    this.baseUrl = 'https://storage.enamorimpex.com/eloraftp';
  }

  /**
   * Convert relative path to full URL
   * @param {string} relativePath - Relative path from API response
   * @returns {string} Full URL for image access
   */
  getFullImageUrl(relativePath) {
    if (!relativePath) return '';
    
    // If already a full URL, return as is
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // Convert relative path to full URL
    return `${this.baseUrl}/${relativePath}`;
  }

  /**
   * Parse relative path to extract components
   * @param {string} relativePath - Relative path from API
   * @returns {object} Parsed components
   */
  parseImagePath(relativePath) {
    if (!relativePath) return null;
    
    // Expected format: CLIENTCODE/STOREID/FOLDERTYPE_USERNAME/FILENAME
    const parts = relativePath.split('/');
    if (parts.length !== 4) return null;
    
    const [clientCode, storeId, folderWithUser, fileName] = parts;
    
    // Split folderType_userName
    const lastUnderscoreIndex = folderWithUser.lastIndexOf('_');
    if (lastUnderscoreIndex === -1) return null;
    
    const folderType = folderWithUser.substring(0, lastUnderscoreIndex);
    const userName = folderWithUser.substring(lastUnderscoreIndex + 1);
    
    return {
      clientCode,
      storeId,
      folderType,
      userName,
      fileName,
      fullUrl: this.getFullImageUrl(relativePath)
    };
  }

  /**
   * Process store data to convert all image paths to full URLs
   * @param {object} store - Store object from API
   * @returns {object} Store object with full image URLs
   */
  processStoreImages(store) {
    if (!store) return store;
    
    const processedStore = { ...store };
    
    // Process initial photos
    if (processedStore.recce?.initialPhotos) {
      processedStore.recce.initialPhotos = processedStore.recce.initialPhotos.map(photo => ({
        relativePath: photo,
        fullUrl: this.getFullImageUrl(photo),
        parsed: this.parseImagePath(photo)
      }));
    }
    
    // Process recce photos
    if (processedStore.recce?.reccePhotos) {
      processedStore.recce.reccePhotos = processedStore.recce.reccePhotos.map(reccePhoto => ({
        ...reccePhoto,
        photo: {
          relativePath: reccePhoto.photo,
          fullUrl: this.getFullImageUrl(reccePhoto.photo),
          parsed: this.parseImagePath(reccePhoto.photo)
        }
      }));
    }
    
    // Process installation photos
    if (processedStore.installation?.photos) {
      processedStore.installation.photos = processedStore.installation.photos.map(installPhoto => ({
        ...installPhoto,
        installationPhoto: {
          relativePath: installPhoto.installationPhoto,
          fullUrl: this.getFullImageUrl(installPhoto.installationPhoto),
          parsed: this.parseImagePath(installPhoto.installationPhoto)
        }
      }));
    }
    
    return processedStore;
  }

  /**
   * Check if image URL is accessible
   * @param {string} imageUrl - Full image URL
   * @returns {Promise<boolean>} True if accessible
   */
  async isImageAccessible(imageUrl) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image accessibility check failed:', error);
      return false;
    }
  }

  /**
   * Get image blob for PDF/PPT generation
   * @param {string} imageUrl - Full image URL
   * @returns {Promise<Blob>} Image blob
   */
  async getImageBlob(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Failed to get image blob:', error);
      throw error;
    }
  }

  /**
   * Get image as base64 for PDF/PPT generation
   * @param {string} imageUrl - Full image URL
   * @returns {Promise<string>} Base64 encoded image
   */
  async getImageAsBase64(imageUrl) {
    try {
      const blob = await this.getImageBlob(imageUrl);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw error;
    }
  }

  /**
   * Batch process images for PPT/PDF generation
   * @param {Array<string>} imageUrls - Array of image URLs
   * @param {string} format - 'base64' or 'blob'
   * @returns {Promise<Array>} Array of processed images
   */
  async batchProcessImages(imageUrls, format = 'base64') {
    const results = [];
    
    for (const url of imageUrls) {
      try {
        if (format === 'base64') {
          const base64 = await this.getImageAsBase64(url);
          results.push({ url, data: base64, success: true });
        } else {
          const blob = await this.getImageBlob(url);
          results.push({ url, data: blob, success: true });
        }
      } catch (error) {
        results.push({ url, error: error.message, success: false });
      }
    }
    
    return results;
  }

  /**
   * Get all images from store for document generation
   * @param {object} store - Store object
   * @param {string} format - 'base64' or 'blob' or 'url'
   * @returns {Promise<object>} Categorized images
   */
  async getAllStoreImages(store, format = 'url') {
    const processedStore = this.processStoreImages(store);
    const images = {
      initial: [],
      recce: [],
      installation: []
    };

    // Collect initial photos
    if (processedStore.recce?.initialPhotos) {
      const urls = processedStore.recce.initialPhotos.map(photo => photo.fullUrl);
      if (format === 'url') {
        images.initial = urls;
      } else {
        images.initial = await this.batchProcessImages(urls, format);
      }
    }

    // Collect recce photos
    if (processedStore.recce?.reccePhotos) {
      const urls = processedStore.recce.reccePhotos.map(photo => photo.photo.fullUrl);
      if (format === 'url') {
        images.recce = urls;
      } else {
        images.recce = await this.batchProcessImages(urls, format);
      }
    }

    // Collect installation photos
    if (processedStore.installation?.photos) {
      const urls = processedStore.installation.photos.map(photo => photo.installationPhoto.fullUrl);
      if (format === 'url') {
        images.installation = urls;
      } else {
        images.installation = await this.batchProcessImages(urls, format);
      }
    }

    return images;
  }

  /**
   * Create image cache for faster access
   * @param {Array<string>} imageUrls - URLs to cache
   * @returns {Promise<Map>} Cache map
   */
  async createImageCache(imageUrls) {
    const cache = new Map();
    const results = await this.batchProcessImages(imageUrls, 'base64');
    
    results.forEach(result => {
      if (result.success) {
        cache.set(result.url, result.data);
      }
    });
    
    return cache;
  }
}

export default new ImageService();