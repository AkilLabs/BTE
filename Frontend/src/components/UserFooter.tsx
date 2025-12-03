import { CalendarDays, Clock3, Mail, MapPin, PhoneCall } from 'lucide-react';
import BTlogo from '../assets/BTlogo.png';

const quickLinks = ['Home', 'About Us', 'Reviews', 'Trending Events', 'Contact Us'];

const contactDetails = [
    { label: 'Email', value: 'support@blackticket.com', icon: Mail },
    { label: 'Phone Number', value: '6384754292', icon: PhoneCall },
    { label: 'Working Days', value: 'Monday - Sunday', icon: CalendarDays },
    { label: 'Working Hours', value: '8:00AM - 8:00PM (IST)', icon: Clock3 },
    { label: 'Address', value: 'Georgia', icon: MapPin },
];

export default function UserFooter() {
    return (
        <footer className="bg-black text-white border-t border-white/10 w-full mt-8 sm:mt-10 md:mt-12">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
                {/* Desktop Layout - 4 Columns */}
                <div className="hidden md:grid md:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/10">
                    {/* Column 1: Brand */}
                    <div className="flex flex-col items-start">
                        <img
                            src={BTlogo}
                            alt="BlackTicket Entertainments"
                            className="w-36 md:w-40 lg:w-44"
                        />
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 className="text-xs lg:text-sm font-bold text-white mb-3 uppercase tracking-widest">Quick Links</h4>
                        <div className="flex flex-col gap-1.5 sm:gap-2 text-xs lg:text-sm text-white/70">
                            {quickLinks.map((link) => (
                                <span
                                    key={link}
                                    className="hover:text-yellow-400 transition-colors cursor-pointer font-medium"
                                >
                                    {link}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Contact Info (Top 3) */}
                    <div>
                        <h4 className="text-xs lg:text-sm font-bold text-white mb-3 uppercase tracking-widest">Contact</h4>
                        <div className="space-y-2.5 text-xs lg:text-sm">
                            {contactDetails.slice(0, 3).map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">{label}</p>
                                        <p className="text-white font-semibold text-xs lg:text-sm">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 4: Contact Info (Last 2) */}
                    <div>
                        <div className="space-y-2.5 text-xs lg:text-sm">
                            {contactDetails.slice(3).map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-start gap-2.5">
                                    <Icon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">{label}</p>
                                        <p className="text-white font-semibold text-xs lg:text-sm">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile & Tablet Layout - Stacked */}
                <div className="md:hidden space-y-5 sm:space-y-6">
                    {/* Brand */}
                    <div>
                        <img
                            src={BTlogo}
                            alt="BlackTicket Entertainments"
                            className="w-32 sm:w-36"
                        />
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-2.5 uppercase tracking-widest">Quick Links</h4>
                        <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-white/70">
                            {quickLinks.map((link) => (
                                <span
                                    key={link}
                                    className="hover:text-yellow-400 transition-colors cursor-pointer font-medium"
                                >
                                    {link}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-2.5 uppercase tracking-widest">Contact</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                            {contactDetails.map(({ label, value, icon: Icon }) => (
                                <div key={label} className="flex items-start gap-2 sm:gap-2.5">
                                    <Icon className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">{label}</p>
                                        <p className="text-white font-semibold text-xs sm:text-sm">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bottom - Moved up closer */}
            <div className="w-full border-t border-white/10 py-3 sm:py-3.5">
                <p className="text-center text-xs text-white/50">© 2025 BlackTickets Entertainment. All rights reserved.</p>
            </div>
        </footer>
    );
}
