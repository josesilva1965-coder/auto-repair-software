import React from 'react';
import { XMarkIcon, TrashIcon } from '../Icon';
import type { Photo } from '../types';
import { useLocalization } from '../services/localization';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoData: { vehicleId: string; photo: Photo } | null;
  onDelete: (vehicleId: string, photoId: string) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ isOpen, onClose, photoData, onDelete }) => {
  const { t } = useLocalization();

  if (!isOpen || !photoData) return null;

  const { vehicleId, photo } = photoData;

  const handleDelete = () => {
    if (window.confirm(t('deletePhotoConfirm'))) {
      onDelete(vehicleId, photo.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 dark:bg-opacity-90 z-50 flex justify-center items-center p-4 animate-fade-in" 
      aria-modal="true" 
      role="dialog"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <img src={photo.dataUrl} alt="Vehicle Detail" className="w-full h-full object-contain rounded-lg shadow-2xl" />
        
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
          aria-label={t('closePhotoViewer')}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <button
          onClick={handleDelete}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          aria-label={t('deletePhotoButton')}
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          {t('deletePhotoButton')}
        </button>
      </div>
    </div>
  );
};