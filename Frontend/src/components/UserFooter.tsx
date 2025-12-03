import { CalendarDays, Clock3, Mail, MapPin, PhoneCall } from 'lucide-react';
import BTlogo from '../assets/BTlogo.png';

const quickLinks = ['Home', 'About Us', 'Reviews', 'Trending Events', 'Contact Us'];

const contactDetails = [
    { label: 'Email', value: 'sparessupport@metaticket.in', icon: Mail },
    { label: 'Phone Number', value: '8884518856', icon: PhoneCall },
    { label: 'Working Days', value: 'Monday - Sunday', icon: CalendarDays },
    { label: 'Working Hours', value: '8:00AM - 8:00PM (IST)', icon: Clock3 },
    { label: 'Address', value: '1717 Harrison St, San Francisco, CA 94103, INDIA', icon: MapPin },
];

export default function UserFooter() {
    return (
        <footer className="bg-black text-white border-t border-white/10 w-full mt-4">
            <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-10">
                <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
                    {/* Brand + Links */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-16">
                            <img
                                src={BTlogo}
                                alt="BlackTicket Entertainments"
                                className="w-44 sm:w-48 mb-6 sm:mb-0"
                            />
                            <div className="flex flex-col gap-3 mt-4 text-sm font-medium text-white/80">
                                {quickLinks.map((link) => (
                                    <span
                                        key={link}
                                        className="hover:text-yellow-400 transition-colors cursor-pointer"
                                    >
                                        {link}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="flex-1 w-full space-y-3 text-sm">
                        {contactDetails.map(({ label, value, icon: Icon }) => (
                            <div
                                key={label}
                                className="grid grid-cols-[auto,auto,1fr] items-center gap-6 lg:gap-10"
                            >
                                <div className="p-2 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-white/60 text-xs uppercase tracking-wide">
                                    {label}
                                </p>
                                <p className="text-white font-semibold text-sm sm:text-base text-right">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 w-full border-t border-white/15 py-2">
                <p className="text-center text-xs text-white/60">© 2025 BlackTickets Entertainment</p>
            </div>
        </footer>
    );
}
