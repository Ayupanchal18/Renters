import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { faqs } from "../data/mock";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQs() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Find answers to common questions about listing properties, verification, and fees.
                    </p>
                </div>
            </section>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((f, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-border px-6">
                                <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline py-5">
                                    <span className="text-left font-semibold">{f.q}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-5">
                                    {f.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </main>

            <Footer />
        </div>
    );
}
