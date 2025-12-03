import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export type SelectedShowDetails = {
  date?: string | null;
  time?: string | null;
  screen?: string | null;
  movieTitle?: string | null;
  movieId?: string;
  price?: number;
};

interface BookingContextType {
  totalPrice: number;
  setTotalPrice: Dispatch<SetStateAction<number>>;
  selectedSeats: string[];
  setSelectedSeats: Dispatch<SetStateAction<string[]>>;
  showDetails: SelectedShowDetails | null;
  setShowDetails: Dispatch<SetStateAction<SelectedShowDetails | null>>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<SelectedShowDetails | null>(null);

  return (
    <BookingContext.Provider
      value={{ totalPrice, setTotalPrice, selectedSeats, setSelectedSeats, showDetails, setShowDetails }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
