'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';
import SEOHead from '../components/seo/SEOHead';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        message: '',
    })

    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)

        setTimeout(() => {
            setFormData({
                name: '',
                email: '',
                phone: '',
                category: 'general',
                message: ''
            })
            setSubmitted(false)
        }, 2000)
    }

    return (
        <>
            <SEOHead
                title="Contact Us"
                description="Get in touch with Renters support team. We're here to help with your rental property questions, account issues, and technical support."
                url={typeof window !== 'undefined' ? `${window.location.origin}/contact` : 'https://renters.com/contact'}
                type="website"
            />
            <Navbar />
            <div className="min-h-screen bg-background text-foreground">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-primary to-accent py-20 px-4 sm:px-6 lg:px-8">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative max-w-6xl mx-auto text-center">
                        <h1 className="text-5xl sm:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                            Have questions about rental properties? Our dedicated support team is ready to help you find the perfect space.
                        </p>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold mb-12 text-center">Contact Information</h2>
                        <div className="grid md:grid-cols-4 gap-6">

                            {/* Email */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Email</h3>
                                <p className="text-muted-foreground">support@propertyrent.com</p>
                                <p className="text-sm text-muted-foreground mt-1">We'll respond within 24 hours</p>
                            </div>

                            {/* Phone */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <Phone className="w-6 h-6 text-secondary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Phone</h3>
                                <p className="text-muted-foreground">+1 (555) 123-4567</p>
                                <p className="text-sm text-muted-foreground mt-1">Available Mon–Fri 9AM–6PM</p>
                            </div>

                            {/* Address */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <MapPin className="w-6 h-6 text-accent" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Address</h3>
                                <p className="text-muted-foreground">123 Business Plaza</p>
                                <p className="text-sm text-muted-foreground">New York, NY 10001</p>
                            </div>

                            {/* Hours */}
                            <div className="bg-card text-card-foreground rounded-lg p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">Hours</h3>
                                <p className="text-muted-foreground">Mon–Fri: 9AM – 6PM</p>
                                <p className="text-sm text-muted-foreground">Sat–Sun: Closed</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form */}
                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4 text-center">Send us a Message</h2>
                        <p className="text-center text-muted-foreground mb-12">
                            Fill out the form below and we'll get back to you as soon as possible.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Name */}
                            <div>
                                <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
                                    Full Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    id="contact-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
                                    Email Address <span className="text-destructive">*</span>
                                </label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="contact-phone" className="block text-sm font-medium mb-2">Phone Number</label>
                                <input
                                    id="contact-phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="contact-category" className="block text-sm font-medium mb-2">
                                    Inquiry Category <span className="text-destructive">*</span>
                                </label>
                                <select
                                    id="contact-category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer transition"
                                >
                                    <option value="general">General Inquiry</option>
                                    <option value="property">Property Issue</option>
                                    <option value="account">Account Help</option>
                                    <option value="technical">Technical Support</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="contact-message" className="block text-sm font-medium mb-2">
                                    Message <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="6"
                                    placeholder="Tell us how we can help..."
                                    className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none transition"
                                ></textarea>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitted}
                                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition${submitted
                                    ? 'bg-secondary text-secondary-foreground cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-accent hover:shadow-lg'
                                    }`}
                            >
                                {submitted ? (
                                    <>
                                        <span className="animate-spin">✓</span>
                                        Message Sent!
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Map */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold mb-12 text-center">Find Us</h2>

                        <div className="rounded-xl overflow-hidden shadow-lg aspect-video">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1234567890!2d-74.0059!3d40.7128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a991589151%3A0xefd3ff432e1c69!2s123%20Business%20Plaza%2C%20New%20York%2C%20NY%2010001!5e0!3m2!1sen!2sus!4v1234567890"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto text-center">
                        <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
                        <p className="text-primary-foreground/90 mb-6">
                            Check out our FAQ section or browse our available properties.
                        </p>
                        <button className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:scale-105 transition">
                            Browse Properties
                        </button>
                    </div>
                </section>
            </div>
            <Footer />
        </>

    )
}
