// Using JSX transform; no need to import React directly
import { useNavigate } from "react-router-dom";

interface MovieCardProps {
  movieId: string;
  title: string;
  image: string;
}

export default function MovieCard({ movieId, title, image }: MovieCardProps) {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate(`/movies/${movieId}`);
  }

  return (
    <div className="flex justify-center">
      <div className="relative w-full h-64 rounded-2xl border border-slate-700 bg-black shadow-lg group cursor-pointer">
        <div className="overflow-hidden rounded-2xl w-full h-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        </div>
        
        {/* Book Now Button - Positioned at bottom center */}
        <div className="absolute bottom-[-1rem] left-0 right-0 flex justify-center">
          <button 
            onClick={handleBookNow}
            aria-label={`Book ${title}`} 
            className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-500 transition-colors shadow-lg"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
