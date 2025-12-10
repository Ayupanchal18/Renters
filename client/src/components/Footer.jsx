import { Link } from "react-router-dom";
import {
    Building2,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 text-white mb-4">
                            <Building2 className="h-8 w-8 text-blue-500" />
                            <span className="text-xl font-bold">EstateHub</span>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            Your trusted platform for finding the perfect property. Buy, sell,
                            or rent with ease.
                        </p>

                        <div className="flex gap-3">
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="hover:text-blue-500 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-blue-500 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/listings"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    All Listings
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contact"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/faqs"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to="/blog"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy-policy"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/refund-policy"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact Us</h3>

                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>123 Real Estate Ave, Property City, PC 12345</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <span>info@estatehub.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} EstateHub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
