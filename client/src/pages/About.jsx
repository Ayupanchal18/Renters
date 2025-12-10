import { Button } from '../components/ui/button'
import { Building2, Users, Shield, Zap, CheckCircle, MapPin, Home, Lock, Star } from 'lucide-react'
import HeroSection from '../components/aboutSection/hero-section'
import MissionSection from "../components/aboutSection/mission-section"
import StorySection from '../components/aboutSection/story-section'
import FeaturesSection from '../components/aboutSection/features-section'
import ValuesSection from '../components/aboutSection/values-section'
import StatsSection from '../components/aboutSection/stats-section'
import TeamSection from '../components/aboutSection/team-section'
import USPSection from '../components/aboutSection/usp-section'
import CTASection from '../components/aboutSection/cta-section'
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background text-foreground">
                <HeroSection />
                <MissionSection />
                <StorySection />
                <FeaturesSection />
                <ValuesSection />
                <StatsSection />
                <TeamSection />
                <USPSection />
                <CTASection />
            </main>
            <Footer />
        </>
    )
}
