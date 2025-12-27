import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import SEOHead from "../components/seo/SEOHead";
import { FileText, Users, Home, AlertTriangle, Scale, Ban, CreditCard, MessageSquare, RefreshCw, Mail } from "lucide-react";

const sections = [
    {
        id: "acceptance",
        icon: FileText,
        title: "Acceptance of Terms",
        content: `By accessing or using the Renters platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform. These terms apply to all users, including property seekers, property owners, and visitors.

We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the platform. Your continued use of the platform after any changes constitutes acceptance of the new terms. We encourage you to review these terms periodically.`
    },
    {
        id: "eligibility",
        icon: Users,
        title: "User Eligibility & Accounts",
        content: `To use our services, you must be at least 18 years old and capable of forming a binding contract. By creating an account, you represent that you meet these requirements and that all information you provide is accurate and complete.

You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms or engage in suspicious activity.

Each user may maintain only one account. Creating multiple accounts to circumvent restrictions or for fraudulent purposes is strictly prohibited and may result in permanent ban from the platform.`
    },
    {
        id: "property-listings",
        icon: Home,
        title: "Property Listings",
        content: `Property owners and authorized agents may list properties for rent or sale on our platform. By listing a property, you represent and warrant that:

• You have the legal right to list the property (as owner, authorized agent, or property manager)
• All information provided is accurate, complete, and not misleading
• Photos and descriptions accurately represent the current condition of the property
• The property complies with all applicable local laws, building codes, and safety regulations
• You will respond to inquiries in a timely and professional manner

We reserve the right to remove any listing that violates these terms, contains false information, or receives multiple complaints. Listings may be subject to verification before being published. Premium placement and featured listings are subject to additional terms and fees.`
    },
    {
        id: "user-conduct",
        icon: Ban,
        title: "Prohibited Conduct",
        content: `Users of our platform agree not to:

• Post false, misleading, or fraudulent information
• Impersonate any person or entity or misrepresent your affiliation
• Harass, threaten, or discriminate against other users
• Use the platform for any illegal purpose or in violation of any laws
• Attempt to gain unauthorized access to other accounts or our systems
• Scrape, crawl, or use automated means to access the platform without permission
• Interfere with or disrupt the platform's functionality
• Post spam, advertisements, or promotional content outside designated areas
• Circumvent any security measures or access restrictions
• Use the platform to collect personal information about other users without consent

Violation of these rules may result in immediate account suspension or termination, and we may report illegal activities to appropriate authorities.`
    },
    {
        id: "transactions",
        icon: CreditCard,
        title: "Transactions & Payments",
        content: `Renters serves as a platform to connect property seekers with property owners. We are not a party to any rental agreement, sale transaction, or other arrangement between users. All transactions are conducted directly between users.

Users are responsible for:
• Verifying the identity and legitimacy of other parties
• Conducting due diligence before entering into any agreement
• Ensuring all agreements comply with applicable laws
• Handling all payments, deposits, and financial arrangements directly

We do not guarantee the accuracy of any listing, the quality of any property, or the performance of any user. We strongly recommend meeting in person, visiting properties before committing, and using secure payment methods.

Any premium services or subscription fees paid to Renters are non-refundable unless otherwise specified. We reserve the right to modify pricing at any time with reasonable notice.`
    },
    {
        id: "communication",
        icon: MessageSquare,
        title: "Communication & Messaging",
        content: `Our platform provides messaging features to facilitate communication between users. By using these features, you agree to:

• Use messaging only for legitimate property-related inquiries
• Not send spam, promotional content, or unsolicited messages
• Not share personal contact information until you're comfortable doing so
• Report any suspicious or inappropriate messages

We may monitor communications for safety and compliance purposes. We reserve the right to suspend messaging privileges for users who violate these guidelines. Messages may be retained for a reasonable period for safety and dispute resolution purposes.`
    },
    {
        id: "intellectual-property",
        icon: Scale,
        title: "Intellectual Property",
        content: `All content on the Renters platform, including but not limited to text, graphics, logos, icons, images, software, and compilation of content, is the property of Renters or its content suppliers and is protected by intellectual property laws.

Users retain ownership of content they submit (such as property photos and descriptions) but grant Renters a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute such content in connection with operating and promoting the platform.

You may not copy, modify, distribute, sell, or lease any part of our platform or included software, nor may you reverse engineer or attempt to extract the source code of that software.`
    },
    {
        id: "disclaimers",
        icon: AlertTriangle,
        title: "Disclaimers & Limitations",
        content: `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.

We do not verify the accuracy of listings, the identity of users, or the condition of properties. Users are solely responsible for their interactions with other users and for verifying all information before making decisions.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, RENTERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.

Our total liability for any claims arising from your use of the platform shall not exceed the amount you paid to us in the twelve months preceding the claim.`
    },
    {
        id: "termination",
        icon: RefreshCw,
        title: "Termination",
        content: `We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.

Upon termination:
• Your right to use the platform will immediately cease
• We may delete your account and all associated data
• Any pending listings will be removed
• You remain liable for any obligations incurred before termination

You may terminate your account at any time by contacting us or using the account deletion feature in your settings. Some information may be retained as required by law or for legitimate business purposes.`
    }
];

export default function Terms() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title="Terms of Service"
                description="Read the Terms of Service for using the Renters platform. Understand your rights and responsibilities when listing or searching for properties."
                url={typeof window !== 'undefined' ? `${window.location.origin}/terms` : 'https://renters.com/terms'}
                type="website"
            />
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform. By using Renters, you agree to these terms.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Last updated: December 2024
                    </p>
                </div>
            </section>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Table of Contents */}
                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
                    <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                            >
                                <section.icon className="w-4 h-4" />
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map((section, index) => (
                        <section key={section.id} id={section.id} className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                    {index + 1}
                                </div>
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <section.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold">{section.title}</h2>
                            </div>
                            <div className="text-muted-foreground leading-relaxed whitespace-pre-line pl-11">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-8">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Questions About These Terms?</h2>
                            <p className="text-muted-foreground mb-4">
                                If you have any questions about these Terms of Service, please contact our legal team.
                            </p>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Email:</span> legal@renters.com</p>
                                <p><span className="font-medium">Address:</span> Renters Legal Team, Mumbai, Maharashtra, India</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
