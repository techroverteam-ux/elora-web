import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/src/context/ThemeContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const { darkMode } = useTheme();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
      <div
        className={`rounded-lg shadow-xl w-full max-w-4xl transform transition-all flex flex-col max-h-[90vh] overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 ${
          darkMode ? "border-gray-700" : "border-gray-100"
        }`}>
          <h3 className={`text-base sm:text-lg font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>{title}</h3>
          <button
            onClick={onClose}
            className={`transition-colors p-1 rounded-full ${
              darkMode 
                ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700" 
                : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>

      {/* Click outside overlay to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};

export default Modal;
