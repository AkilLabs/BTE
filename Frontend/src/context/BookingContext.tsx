import { createContext, useContext, useState, ReactNode } from 'react';

interface BookingContextType {
  totalPrice: number;
  setTotalPrice: (price: number) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [totalPrice, setTotalPrice] = useState(0);

  return (
    <BookingContext.Provider value={{ totalPrice, setTotalPrice }}>
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
