import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../components/BottomNavigation';
import UserNavbar from '../../components/UserNavbar';

type SeatStatus = 'available' | 'reserved' | 'selected';

type SeatCell = {
  key: string;
  label: number;
  status: SeatStatus;
};

type SeatRow = Array<SeatCell | null>;

const SCREEN2_LAYOUT: Array<Array<number | null>> = [
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
  [1, 2, 3, 4, null, null, 5, 6, null, 7, 8],
];

const reservedSeats = new Set(['4-5', '4-6', '5-6', '6-6', '5-5']);
const selectedSeats = new Set(['4-7', '4-8']);

const seatStyles: Record<SeatStatus, string> = {
  available: 'bg-[#1f1f1f] text-white/80 border border-white/10 hover:border-yellow-400/70 transition',
  reserved: 'bg-[#4b371b] text-white border border-[#9a6c2b]/50',
  selected: 'bg-white text-black font-semibold border border-white shadow-[0_0_14px_rgba(255,255,255,0.45)]',
};

const seatBaseClass =
  'flex h-12 w-12 items-center justify-center rounded-lg text-[11px] font-semibold uppercase tracking-[0.2em] duration-200';

const seatRows: SeatRow[] = SCREEN2_LAYOUT.map((row, rowIdx) =>
  row.map((value) => {
    if (value === null) {
      return null;
    }
    const key = `${rowIdx + 1}-${value}`;
    let status: SeatStatus = 'available';
    if (selectedSeats.has(key)) {
      status = 'selected';
    } else if (reservedSeats.has(key)) {
      status = 'reserved';
    }
    return {
      key,
      label: value,
      status,
    };
  }),
);

const MAX_COLUMNS = SCREEN2_LAYOUT[0]?.length ?? 0;

export default function Screen2() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      <UserNavbar />

      <main className="w-full px-4 sm:px-8 lg:px-16 pt-28 pb-32">
        <div className="flex items-center justify-between" aria-label="Screen navigation">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="hidden text-right text-xs uppercase tracking-[0.45em] text-white/40 sm:block">
            Blackticket Entertainments
          </div>
        </div>

        <section className="mt-8 w-full rounded-3xl border border-white/10 bg-[#0d0d0d]/95 p-6 sm:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
          <header className="text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[0.35em] text-white">Select Seat</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.55em] text-white/40">Screen 2</p>
          </header>

          <div className="relative mt-10">
            <div className="absolute left-1/2 top-[-70px] h-24 w-[70%] -translate-x-1/2 rounded-[0_0_120px_120px] border border-white/10 bg-gradient-to-b from-white/80 via-white/30 to-transparent" />

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20 p-6">
              <div className="mx-auto flex min-w-[960px] flex-col items-center gap-4">
                {seatRows.map((row, rowIdx) => (
                  <div key={`row-${rowIdx}`} className="flex w-full items-center justify-center gap-6">
                    <span className="w-10 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">
                      {rowIdx + 1}
                    </span>
                    <div
                      className="grid flex-1 justify-items-center gap-3"
                      style={{ gridTemplateColumns: `repeat(${MAX_COLUMNS}, minmax(3rem, 1fr))` }}
                    >
                      {row.map((seat, seatIdx) =>
                        seat ? (
                          <div key={seat.key} className={`${seatBaseClass} ${seatStyles[seat.status]}`}>
                            {seat.label}
                          </div>
                        ) : (
                          <div key={`gap-${rowIdx}-${seatIdx}`} className="h-12 w-12" />
                        ),
                      )}
                    </div>
                    <span className="w-10 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">
                      {rowIdx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-3">
            <div className="h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <p className="text-lg font-semibold uppercase tracking-[0.6em] text-white/70">Screen</p>
          </div>

          <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-white/20 bg-[#1f1f1f]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-[#9a6c2b]/50 bg-[#4b371b]" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-white bg-white" />
                <span>Selected</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
              <div className="text-center sm:text-right">
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Total</p>
                <p className="text-2xl font-semibold text-white">R$ 200.00</p>
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-yellow-400 px-8 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300 sm:w-auto"
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
