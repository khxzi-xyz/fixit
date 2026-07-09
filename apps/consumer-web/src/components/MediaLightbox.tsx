import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

export function MediaLightbox({
  media,
  initialIndex = 0,
  onClose,
  onDelete
}: {
  media: string[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (index: number) => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    // Prevent scrolling behind
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const current = media[index];
  if (!current) return null;
  const isVideo = current.includes("video") || current.endsWith(".mp4");

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-4 safe-area-top">
        <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-sm tracking-widest">{index + 1} / {media.length}</span>
        {onDelete ? (
          <button onClick={() => {
            onDelete(index);
            if (media.length === 1) onClose();
            else if (index === media.length - 1) setIndex(index - 1);
          }} className="w-10 h-10 bg-destructive/80 rounded-full flex items-center justify-center text-white">
            <Trash2 className="w-5 h-5" />
          </button>
        ) : <div className="w-10" />}
      </div>
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {media.length > 1 && (
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute left-2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white z-10 disabled:opacity-30"
            disabled={index === 0}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        
        <div className="w-full h-full flex items-center justify-center p-4">
          {isVideo ? (
            <video src={current} controls autoPlay className="max-w-full max-h-full rounded-xl shadow-2xl" />
          ) : (
            <img src={current} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          )}
        </div>

        {media.length > 1 && (
          <button
            onClick={() => setIndex((i) => Math.min(media.length - 1, i + 1))}
            className="absolute right-2 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white z-10 disabled:opacity-30"
            disabled={index === media.length - 1}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
      
      {/* Thumbnails */}
      <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar safe-area-bottom">
        {media.map((m, i) => (
          <button key={i} onClick={() => setIndex(i)} className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === i ? "border-primary scale-110" : "border-transparent opacity-50"}`}>
            {m.includes("video") || m.endsWith(".mp4") ? (
              <video src={m} className="w-full h-full object-cover" />
            ) : (
              <img src={m} className="w-full h-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
