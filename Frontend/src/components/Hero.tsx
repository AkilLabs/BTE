import { ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 bg-black">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white bg-opacity-10 mb-8 text-white">
          <Play size={16} />
          <span className="text-sm font-medium">Book Your Movie Experience</span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight text-white">
          Book Movies
          <br />
          <span className="inline-block mt-2">Made Simple</span>
        </h1>

        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-80 leading-relaxed text-white">
          Discover the latest movies, book your seats, and enjoy the ultimate cinema experience.
          Your next movie night is just a click away.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-xl font-semibold bg-red-600 text-white transition-all hover:bg-red-700 hover:shadow-xl hover:scale-105 flex items-center gap-2 text-lg"
          >
            Book Now
            <ArrowRight size={20} />
          </button>

          <button className="px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg bg-white bg-opacity-10 hover:bg-opacity-20 text-white text-lg">
            Browse Movies
          </button>
        </div>
      </div>
    </section>
  );
}
