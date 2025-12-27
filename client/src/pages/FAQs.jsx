import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import SEOHead from "../components/seo/SEOHead";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { HelpCircle, UserPlus, Home, Search, Shield, Settings, Mail } from "lucide-react";

const faqCategories = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: UserPlus,
        faqs: [
            { q: "How do I create an account on Renters?", a: "Click the 'Sign Up' button on the homepage, enter your email, phone number, and create a password. You can also sign up using your Google account for faster registration. Once registered, you can start browsing properties or list your own." },
            { q: "Is it free to use Renters?", a: "Yes, browsing properties and creating an account is completely free. Listing your property is also free. We offer optional premium features like featured listings and priority placement for property owners who want more visibility." },
            { q: "How do I list my property?", a: "After logging in, click 'Post Property' in the navigation menu. Fill in the property details including location, price, photos, and amenities. Our team will verify your listing before it goes live, usually within 24-48 hours." },
        ]
    },
    {
        id: "property-listings",
        title: "Property Listings",
        icon: Home,
        faqs: [
            { q: "Are all listings verified?", a: "Yes, our team reviews all property listings before they are published. We verify basic information and check for accuracy. However, we recommend visiting properties in person and conducting your own due diligence before making any commitments." },
            { q: "How long does it take for my listing to go live?", a: "Most listings are reviewed and published within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive an email notification once your listing is approved and live on the platform." },
            { q: "Can I edit my listing after it's published?", a: "Yes, you can edit your listing at any time from your dashboard. Go to 'My Properties', select the listing you want to edit, and make your changes. Major changes may require re-verification." },
            { q: "How many photos can I upload for my property?", a: "You can upload up to 10 high-quality photos per listing. We recommend including photos of all rooms, exterior views, and any special amenities. Good photos significantly increase interest in your property." },
        ]
    },
    {
        id: "searching-contacting",
        title: "Searching & Contacting",
        icon: Search,
        faqs: [
            { q: "How do I search for properties?", a: "Use the search bar on the homepage to enter your preferred location. You can filter results by property type, price range, number of bedrooms, amenities, and more. Save your favorite properties to your wishlist for easy access later." },
            { q: "How do I contact a property owner?", a: "Click on any property listing to view details. You'll find contact options including a message button to send an inquiry directly through our platform, and in some cases, phone numbers for direct contact." },
            { q: "Is my contact information shared with property owners?", a: "Your contact information is only shared when you initiate contact with a property owner. You control what information you share. We recommend using our in-app messaging initially for safety." },
            { q: "Can I save properties to view later?", a: "Yes! Click the heart icon on any property to add it to your wishlist. Access your saved properties anytime from the Wishlist page in your account." },
        ]
    },
    {
        id: "safety-security",
        title: "Safety & Security",
        icon: Shield,
        faqs: [
            { q: "How do I report a suspicious listing?", a: "If you encounter a suspicious listing or user, click the 'Report' button on the listing page or contact our support team. We take all reports seriously and investigate promptly to maintain platform safety." },
            { q: "What safety tips do you recommend?", a: "Always visit properties in person before making payments, meet in public places first, never share sensitive financial information, use secure payment methods, and trust your instincts. If something seems too good to be true, it probably is." },
            { q: "How is my personal data protected?", a: "We use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for detailed information about how we collect, use, and protect your personal information." },
            { q: "What should I do if I suspect fraud?", a: "If you suspect fraudulent activity, do not proceed with any transaction. Report the listing or user immediately through our platform and contact our support team. We work closely with authorities to address fraud cases." },
        ]
    },
    {
        id: "account-settings",
        title: "Account & Settings",
        icon: Settings,
        faqs: [
            { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your registered email address, and we'll send you a password reset link. The link expires after 24 hours for security reasons." },
            { q: "Can I delete my account?", a: "Yes, you can delete your account from your account settings. Go to Settings > Privacy > Delete Account. Please note that this action is permanent and will remove all your data, listings, and message history." },
            { q: "How do I update my notification preferences?", a: "Go to Settings > Notifications to customize which alerts you receive. You can choose to receive notifications via email, SMS, or push notifications for new messages, property updates, and more." },
            { q: "Can I change my registered email or phone number?", a: "Yes, you can update your email and phone number from your account settings. For security, you may need to verify the new contact information before the change takes effect." },
        ]
    }
];

export default function FAQs() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title="Frequently Asked Questions"
                description="Find answers to common questions about listing properties, verification, fees, and using the Renters platform. Get help with your rental journey."
                url={typeof window !== 'undefined' ? `${window.location.origin}/faqs` : 'https://renters.com/faqs'}
                type="website"
            />
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Find answers to common questions about listing properties, searching for rentals, and using our platform.
                    </p>
                </div>
            </section>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Quick Navigation */}
                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {faqCategories.map((category) => (
                            <a
                                key={category.id}
                                href={`#${category.id}`}
                                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-center"
                            >
                                <category.icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{category.title}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {faqCategories.map((category) => (
                        <section key={category.id} id={category.id}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <category.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold">{category.title}</h2>
                            </div>
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                                <Accordion type="single" collapsible className="w-full">
                                    {category.faqs.map((faq, index) => (
                                        <AccordionItem 
                                            key={index} 
                                            value={`${category.id}-${index}`} 
                                            className="border-border px-6"
                                        >
                                            <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline py-5">
                                                <span className="text-left font-medium">{faq.q}</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-12">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Still Have Questions?</h2>
                            <p className="text-muted-foreground mb-4">
                                Can't find what you're looking for? Our support team is here to help you with any questions or concerns.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a 
                                    href="/contact" 
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Contact Support
                                </a>
                                <a 
                                    href="mailto:support@renters.com" 
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    support@renters.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
