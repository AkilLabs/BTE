// Using JSX transform; no need to import React directly

interface MovieCardProps {
  title: string;
  image: string;
}

export default function MovieCard({ title, image }: MovieCardProps) {
  return (
    <div className="w-52 md:w-64 flex-shrink-0">
      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black shadow-md">
        <img src={image} alt={title} className="w-full h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-60" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm text-white font-semibold">{title}</div>
        <button aria-label={`Book ${title}`} className="text-sm font-semibold bg-yellow-400 text-black px-3 py-1 rounded-full shadow hover:scale-105 transition">Book Now</button>
      </div>
    </div>
  );
}
