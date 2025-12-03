// Using JSX transform; no need to import React directly
import React, { ReactNode } from 'react';
import { useNavigate } from "react-router-dom";

interface MovieCardProps {
  movieId: string;
  title: string;
  image: string;
  // Optional custom actions (used by admin views)
  actions?: ReactNode;
}

export default function MovieCard({ movieId, title, image, actions }: MovieCardProps) {
  const navigate = useNavigate();

  const handleBookNow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/movies/${movieId}`);
  }

  return (
    <div className="flex justify-center">
      <div
        onClick={() => navigate(`/movies/${movieId}`)}
        className="relative w-full aspect-[3/4] rounded-2xl border border-slate-700 bg-black shadow-lg group cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/movies/${movieId}`); }}
      >
        <div className="overflow-hidden rounded-2xl w-full h-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        </div>

        {/* CTA area - bottom center. If `actions` provided (admin) render them, otherwise render Book Now */}
        <div className="absolute bottom-[-1rem] left-0 right-0 flex justify-center">
          {actions ? (
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          ) : (
            <button 
              onClick={(e) => handleBookNow(e)}
              aria-label={`Book ${title}`} 
              className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-500 transition-colors shadow-lg"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
