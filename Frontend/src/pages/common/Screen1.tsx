import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BottomNavigation from '../../components/BottomNavigation';
import UserNavbar from '../../components/UserNavbar';
import { useBooking } from '../../context/BookingContext';

type SeatStatus = 'available' | 'reserved' | 'blocked' | 'selected';

type Range = [number, number];

type RowConfig = {
  label: number;
  count: number;
  reserved?: Array<number | Range>;
  blocked?: Array<number | Range>;
};

type SeatCell = {
  key: string;
  number: number;
  status: SeatStatus;
};

type SeatRow = {
  label: number;
  seats: Array<SeatCell | null>;
};

const MAX_COLUMNS = 31;

const ROW_BLUEPRINT: RowConfig[] = [
  { label: 16, count: 20 },
  { label: 15, count: 25 },
  { label: 14, count: 26 },
  { label: 13, count: 27 },
  { label: 12, count: 28 },
  { label: 11, count: 29 },
  { label: 10, count: 30, blocked: [[11, 13]] },
  { label: 9, count: 31 },
  { label: 8, count: 30 },
  { label: 7, count: 31 },
  { label: 6, count: 30 },
  { label: 5, count: 31 },
  { label: 4, count: 30 },
  { label: 3, count: 29 },
  { label: 2, count: 28 },
  { label: 1, count: 27 },
];

const totalSeats = ROW_BLUEPRINT.reduce((sum, row) => sum + row.count, 0);

const expand = (values: Array<number | Range> = []) => {
  const result = new Set<number>();
  values.forEach((entry) => {
    if (Array.isArray(entry)) {
      const [start, end] = entry;
      for (let current = start; current <= end; current += 1) {
        result.add(current);
      }
    } else {
      result.add(entry);
    }
  });
  return result;
};

const buildRow = (config: RowConfig): SeatRow => {
  const reserved = expand(config.reserved);
  const blocked = expand(config.blocked);
  const leftPad = Math.floor((MAX_COLUMNS - config.count) / 2);
  const rightPad = MAX_COLUMNS - config.count - leftPad;

  const seats: Array<SeatCell | null> = [];

  for (let index = 0; index < leftPad; index += 1) {
    seats.push(null);
  }

  for (let seatNumber = 1; seatNumber <= config.count; seatNumber += 1) {
    let status: SeatStatus = 'available';
    const seatKey = `${config.label}-${seatNumber}`;

    if (blocked.has(seatNumber)) {
      status = 'blocked';
    } else if (reserved.has(seatNumber)) {
      status = 'reserved';
    }

    seats.push({
      key: seatKey,
      number: seatNumber,
      status,
    });
  }

  for (let index = 0; index < rightPad; index += 1) {
    seats.push(null);
  }

  return { label: config.label, seats };
};

const seatRows: SeatRow[] = ROW_BLUEPRINT.map(buildRow);

const seatStyles: Record<SeatStatus, string> = {
  available: 'border border-white/10 bg-[#111111] text-white/70 hover:border-yellow-400/70 transition',
  reserved: 'bg-[#272727] border border-[#3d3d3d] text-white/40',
  blocked: 'bg-transparent text-transparent',
  selected: 'bg-yellow-400 text-black font-semibold shadow-[0_0_15px_rgba(250,204,21,0.5)] border border-yellow-400',
};

const seatBaseClass =
  'flex h-6 w-6 items-center justify-center rounded text-[7px] font-semibold uppercase tracking-wide duration-200';

export default function Screen1() {
  const navigate = useNavigate();
  const { setTotalPrice } = useBooking();
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Retrieve selected seats from local storage
    const storedSeats = localStorage.getItem('selectedSeats');
    if (storedSeats) {
      try {
        const seatsArray = JSON.parse(storedSeats);
        setSelectedSeats(new Set(seatsArray));
      } catch (error) {
        console.error('Error parsing stored seats:', error);
      }
    }
  }, []);

  const handleSeatClick = (seatKey: string, status: SeatStatus) => {
    if (status === 'reserved' || status === 'blocked') return;

    setSelectedSeats((prev) => {
      const updated = new Set(prev);
      if (updated.has(seatKey)) {
        updated.delete(seatKey);
        // console.log('Seat deselected:', seatKey);
      } else {
        updated.add(seatKey);
        // console.log('Seat selected:', seatKey);
      }
      
      // Store selected seats in local storage
      const selectedSeatsArray = Array.from(updated);
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeatsArray));
      
      return updated;
    });
  };

  const totalPrice = selectedSeats.size * 200;

  return (
    <div className="min-h-screen bg-black text-white">
      <UserNavbar />

      <main className="w-full px-4 sm:px-8 lg:px-16 pt-28 pb-32">
        <div className="flex items-center justify-between max-w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        <section className="mt-8 w-full rounded-3xl border border-white/10 bg-[#0c0c0c]/95 p-6 sm:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
          <header className="text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[0.35em] text-white">Select Seat</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.55em] text-white/40">Screen 1 · {totalSeats} seats</p>
          </header>

          <div className="mt-10 overflow-x-auto">
            <div className="mx-auto flex min-w-fit flex-col items-center gap-2">
              {seatRows.map((row) => (
                <div key={row.label}>
                  {row.label === 8 && <div className="h-4" />}
                  <div className="flex w-full items-center justify-center gap-2">
                    <span className="w-6 text-center text-[8px] font-medium uppercase tracking-[0.2em] text-white/40">
                      {row.label}
                    </span>
                  <div
                    className="grid flex-1 justify-items-center gap-1"
                    style={{ gridTemplateColumns: `repeat(${MAX_COLUMNS}, minmax(1.5rem, 1fr))` }}
                  >
                    {row.seats.map((seat, index) =>
                      seat ? (
                        <button
                          key={seat.key}
                          type="button"
                          onClick={() => handleSeatClick(seat.key, seat.status)}
                          disabled={seat.status === 'reserved' || seat.status === 'blocked'}
                          className={`${seatBaseClass} ${selectedSeats.has(seat.key) ? seatStyles['selected'] : seatStyles[seat.status]} ${
                            seat.status === 'reserved' || seat.status === 'blocked' ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {seat.status === 'blocked' ? '' : seat.number}
                        </button>
                      ) : (
                        <div key={`pad-${row.label}-${index}`} className="h-6 w-6" />
                      ),
                    )}
                  </div>
                  <span className="w-6 text-center text-[8px] font-medium uppercase tracking-[0.2em] text-white/40">
                    {row.label}
                  </span>
                </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="h-1 w-full max-w-3xl rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <p className="text-lg font-semibold uppercase tracking-[0.6em] text-white/70">Screen</p>
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-white/20 bg-[#111111]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-[#3d3d3d] bg-[#272727]" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-yellow-400 bg-yellow-400" />
                <span>Selected</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
              <div className="text-center sm:text-right">
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Total ({selectedSeats.size})</p>
                <p className="text-2xl font-semibold text-white">Rs {totalPrice.toFixed(2)}</p>
              </div>
              <button
                type="button"
                disabled={selectedSeats.size === 0}
                onClick={() => {
                  setTotalPrice(totalPrice);
                  const showDetails = JSON.parse(localStorage.getItem('selectedShowDetails') || '{}');
                  const movieId = showDetails.movieId;
                  navigate(`/booking/${movieId}/confirmation`);
                }}
                className="w-full rounded-full bg-yellow-400 px-8 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed sm:w-auto"
              >
                Buy Ticket
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
