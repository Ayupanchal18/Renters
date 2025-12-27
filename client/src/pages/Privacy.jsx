import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import SEOHead from "../components/seo/SEOHead";
import { Shield, Eye, Lock, Database, Bell, UserCheck, Globe, Mail } from "lucide-react";

const sections = [
    {
        id: "information-collection",
        icon: Database,
        title: "Information We Collect",
        content: [
            {
                subtitle: "Personal Information",
                text: "When you create an account or list a property, we collect information such as your name, email address, phone number, and profile photo. This information helps us provide personalized services and facilitate communication between property seekers and owners."
            },
            {
                subtitle: "Property Information",
                text: "When listing a property, we collect details including property address, photos, pricing, amenities, and descriptions. This information is displayed publicly to help potential renters or buyers find suitable properties."
            },
            {
                subtitle: "Usage Data",
                text: "We automatically collect information about how you interact with our platform, including pages visited, search queries, properties viewed, time spent on pages, and device information. This helps us improve our services and provide better recommendations."
            },
            {
                subtitle: "Location Data",
                text: "With your consent, we may collect location data to show nearby properties and provide location-based search results. You can disable location services in your device settings at any time."
            }
        ]
    },
    {
        id: "information-use",
        icon: Eye,
        title: "How We Use Your Information",
        content: [
            {
                subtitle: "Service Delivery",
                text: "We use your information to provide, maintain, and improve our platform services, including property listings, search functionality, messaging between users, and account management."
            },
            {
                subtitle: "Communication",
                text: "We may send you service-related notifications, updates about properties you've shown interest in, responses to your inquiries, and important announcements about our platform."
            },
            {
                subtitle: "Personalization",
                text: "Your data helps us personalize your experience by showing relevant property recommendations, remembering your preferences, and customizing search results based on your activity."
            },
            {
                subtitle: "Safety & Security",
                text: "We use information to verify user identities, detect and prevent fraud, enforce our terms of service, and maintain the security of our platform and users."
            }
        ]
    },
    {
        id: "information-sharing",
        icon: UserCheck,
        title: "Information Sharing",
        content: [
            {
                subtitle: "With Other Users",
                text: "When you list a property or express interest in one, certain information (like your name and contact details) may be shared with other users to facilitate communication and transactions."
            },
            {
                subtitle: "Service Providers",
                text: "We work with trusted third-party service providers for hosting, analytics, payment processing, and customer support. These providers are contractually obligated to protect your information."
            },
            {
                subtitle: "Legal Requirements",
                text: "We may disclose information when required by law, court order, or government request, or when necessary to protect our rights, safety, or property, or that of our users."
            },
            {
                subtitle: "Business Transfers",
                text: "In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction. We will notify you of any such change."
            }
        ]
    },
    {
        id: "data-security",
        icon: Lock,
        title: "Data Security",
        content: [
            {
                subtitle: "Encryption",
                text: "We use industry-standard SSL/TLS encryption to protect data transmitted between your device and our servers. Sensitive information is encrypted at rest using AES-256 encryption."
            },
            {
                subtitle: "Access Controls",
                text: "Access to user data is restricted to authorized personnel only. We implement role-based access controls and regularly audit access logs to prevent unauthorized access."
            },
            {
                subtitle: "Security Measures",
                text: "Our infrastructure includes firewalls, intrusion detection systems, and regular security assessments. We conduct periodic penetration testing to identify and address vulnerabilities."
            },
            {
                subtitle: "Incident Response",
                text: "We have established procedures for responding to security incidents. In the event of a data breach affecting your information, we will notify you promptly as required by applicable law."
            }
        ]
    },
    {
        id: "cookies",
        icon: Globe,
        title: "Cookies & Tracking",
        content: [
            {
                subtitle: "Essential Cookies",
                text: "These cookies are necessary for the website to function properly. They enable core functionality such as security, account access, and remembering your preferences."
            },
            {
                subtitle: "Analytics Cookies",
                text: "We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience. You can opt out of analytics tracking."
            },
            {
                subtitle: "Preference Cookies",
                text: "These cookies remember your settings and preferences, such as language, region, and display preferences, to provide a more personalized experience."
            },
            {
                subtitle: "Managing Cookies",
                text: "You can control cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our platform."
            }
        ]
    },
    {
        id: "your-rights",
        icon: Shield,
        title: "Your Rights",
        content: [
            {
                subtitle: "Access & Portability",
                text: "You have the right to access your personal data and request a copy in a portable format. You can download your data from your account settings or contact us for assistance."
            },
            {
                subtitle: "Correction & Deletion",
                text: "You can update or correct your personal information through your account settings. You may also request deletion of your account and associated data, subject to legal retention requirements."
            },
            {
                subtitle: "Opt-Out Rights",
                text: "You can opt out of marketing communications at any time by clicking the unsubscribe link in emails or updating your notification preferences in account settings."
            },
            {
                subtitle: "Data Processing Objection",
                text: "You have the right to object to certain types of data processing. Contact us if you wish to exercise this right, and we will review your request."
            }
        ]
    }
];

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEOHead
                title="Privacy Policy"
                description="Learn how Renters collects, uses, and protects your personal information. Our privacy policy explains your rights and our commitment to data security."
                url={typeof window !== 'undefined' ? `${window.location.origin}/privacy-policy` : 'https://renters.com/privacy-policy'}
                type="website"
            />
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Your privacy matters to us. This policy explains how we collect, use, and protect your personal information.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Last updated: December 2024
                    </p>
                </div>
            </section>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Introduction */}
                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                    <p className="text-muted-foreground leading-relaxed">
                        At Renters, we are committed to protecting your privacy and ensuring the security of your personal information. 
                        This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our 
                        platform to find, list, or manage rental and sale properties. By using our services, you agree to the collection 
                        and use of information in accordance with this policy.
                    </p>
                </div>

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
                    {sections.map((section) => (
                        <section key={section.id} id={section.id} className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <section.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold">{section.title}</h2>
                            </div>
                            <div className="space-y-6">
                                {section.content.map((item, index) => (
                                    <div key={index}>
                                        <h3 className="font-medium text-foreground mb-2">{item.subtitle}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
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
                            <h2 className="text-lg font-semibold mb-2">Questions About Privacy?</h2>
                            <p className="text-muted-foreground mb-4">
                                If you have any questions about this Privacy Policy or our data practices, please contact our Privacy Team.
                            </p>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Email:</span> privacy@renters.com</p>
                                <p><span className="font-medium">Address:</span> Renters Privacy Team, Mumbai, Maharashtra, India</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
