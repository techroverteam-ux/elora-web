import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

interface DownloadButtonProps {
  storeId: string;
  dealerCode: string;
  type: 'recce' | 'installation';
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onDownloadPPT: (storeId: string, dealerCode: string, type: 'recce' | 'installation') => void;
  onDownloadPDF: (storeId: string, dealerCode: string, type: 'recce' | 'installation') => void;
  darkMode: boolean;
  variant?: 'icon' | 'button';
  label?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  storeId,
  dealerCode,
  type,
  isMenuOpen,
  onToggleMenu,
  onDownloadPPT,
  onDownloadPDF,
  darkMode,
  variant = 'icon',
  label
}) => {
  const colorClass = type === 'recce' ? 'orange' : 'purple';
  
  if (variant === 'button') {
    return (
      <div className="relative">
        <button
          onClick={onToggleMenu}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-${colorClass}-50 text-${colorClass}-600 text-xs font-medium`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> {label || 'Download'}
        </button>
        {isMenuOpen && (
          <div className={`absolute left-0 mt-1 w-32 rounded-lg shadow-lg border z-50 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <button
              onClick={() => {
                onDownloadPPT(storeId, dealerCode, type);
                onToggleMenu();
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/20 rounded-t-lg ${darkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> PPT
            </button>
            <button
              onClick={() => {
                onDownloadPDF(storeId, dealerCode, type);
                onToggleMenu();
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/20 rounded-b-lg ${darkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onToggleMenu}
        className={`p-1.5 rounded hover:bg-${colorClass}-50/50 dark:hover:bg-${colorClass}-900/20 text-${colorClass}-600`}
        title={`Download ${type}`}
      >
        <FileSpreadsheet className="w-4 h-4" />
      </button>
      {isMenuOpen && (
        <div className={`absolute right-0 mt-1 w-32 rounded-lg shadow-lg border z-50 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <button
            onClick={() => {
              onDownloadPPT(storeId, dealerCode, type);
              onToggleMenu();
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/20 rounded-t-lg ${darkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> PPT
          </button>
          <button
            onClick={() => {
              onDownloadPDF(storeId, dealerCode, type);
              onToggleMenu();
            }}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/20 rounded-b-lg ${darkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      )}
    </div>
  );
};
