import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import patientInfoData from '../../../data/nurse-sim/patient_info_data.json';

// Image component with fallback
export const ImageWithFallback = ({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full bg-white flex flex-col items-center justify-center text-neutral-400 border border-neutral-200 rounded-xl p-4 text-center min-h-[120px]">
        <ImageIcon size={24} className="mb-2 opacity-50" />
        <span className="text-xs font-medium text-neutral-500">Image not found</span>
        <span className="text-[10px] font-mono mt-1 opacity-50 break-all select-all">{src}</span>
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden border border-black/5 cursor-pointer hover:opacity-90 transition-opacity bg-white min-h-[100px]"
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain max-h-72 bg-white"
        onError={() => setError(true)}
      />
    </div>
  );
};

// Helper Component for Document Thumbnails
export const DocumentThumbnail = ({ doc }: { doc: typeof patientInfoData.documents[0] }) => {
  return (
    <div className="w-full h-full bg-white relative overflow-hidden select-none">
      <img 
        src={doc.image} 
        alt={doc.title}
        className="w-full h-full object-cover"
      />
      {doc.hasStamp && (
        <div className="absolute bottom-2 right-2 w-8 h-8 border border-blue-200/50 rounded-full flex items-center justify-center rotate-[-12deg] opacity-50 bg-white/80">
           <div className="text-[3px] text-blue-300 font-bold uppercase">Verified</div>
        </div>
      )}
    </div>
  );
};

// Full Scale Document View
export const FullDocumentView = ({ doc }: { doc: typeof patientInfoData.documents[0] }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    if (isZoomed) {
      setIsZoomed(false);
      setPosition({ x: 0, y: 0 });
    } else {
      setIsZoomed(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsDragging(false);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomed && e.buttons === 1) {
      setIsDragging(true);
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      >
        <img
          src={doc.image}
          alt={doc.title}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
          style={{
            transform: `scale(${isZoomed ? 2.5 : 1}) translate(${position.x / 2.5}px, ${position.y / 2.5}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};
