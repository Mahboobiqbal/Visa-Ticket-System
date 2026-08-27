import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-[10vh] p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-[0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12),0_5px_5px_-3px_rgba(0,0,0,0.2)] ${wide ? 'w-full max-w-4xl' : 'w-full max-w-2xl'} max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
          <h2 className="text-[16px] font-medium text-[#202124]">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#e8eaed] transition-colors">
            <X size={20} className="text-[#5f6368]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
