import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Home, PenSquare, ChevronRight, X, ArrowRight } from 'lucide-react';

/* ─── Slide Data ───────────────────────────────────────────── */

const SLIDES = [
    {
        id: 1,
        Icon: Search,
        accent: '#3b82f6',
        gradientFrom: '#1e3a5f',
        badge: 'Smart Search',
        title: 'Find Your Perfect Home',
        subtitle:
            'Search thousands of verified rent and buy listings. Filter by city, budget, and type in seconds.',
        cta: null,
    },
    {
        id: 2,
        Icon: Home,
        accent: '#22c55e',
        gradientFrom: '#1a3325',
        badge: 'Verified Properties',
        title: 'Browse Verified Listings',
        subtitle:
            'Every property is verified with real photos and honest pricing. No scams, no hidden costs.',
        cta: null,
    },
    {
        id: 3,
        Icon: Heart,
        accent: '#ec4899',
        gradientFrom: '#3b1f3b',
        badge: 'Wishlist & Share',
        title: 'Save What You Love',
        subtitle:
            'Shortlist with a click. Compare and share properties with your family anytime.',
        cta: null,
    },
    {
        id: 4,
        Icon: PenSquare,
        accent: '#f59e0b',
        gradientFrom: '#2d1f0f',
        badge: 'List for Free',
        title: 'Post a Property for Free',
        subtitle:
            'Landlord or agent? List your property in minutes and reach thousands of tenants.',
        cta: null,
    },
];

/* ─── Onboarding Modal ─────────────────────────────────────── */

export default function WebOnboarding({ onDone }) {
    const [current, setCurrent] = useState(0);
    const [exiting, setExiting] = useState(false);
    const navigate = useNavigate();

    const slide = SLIDES[current];
    const isLast = current === SLIDES.length - 1;

    const dismiss = (cb) => {
        setExiting(true);
        setTimeout(() => { onDone(); cb?.(); }, 320);
    };

    const handleExplore = () => dismiss();
    const handleSignUp  = () => dismiss(() => navigate('/signup'));
    const handleNext    = () => {
        if (isLast) { handleExplore(); return; }
        setCurrent(c => c + 1);
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
        >
            {/* Card */}
            <div
                className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: `linear-gradient(160deg, #0f172a 0%, ${slide.gradientFrom} 50%, #0f172a 100%)` }}
            >
                {/* Skip */}
                <button
                    onClick={handleExplore}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    aria-label="Skip"
                >
                    <X size={18} />
                </button>

                {/* Icon area */}
                <div className="flex flex-col items-center pt-12 pb-6 px-8 relative">
                    {/* Rings */}
                    <div
                        className="absolute w-56 h-56 rounded-full border opacity-10"
                        style={{ borderColor: slide.accent }}
                    />
                    <div
                        className="absolute w-72 h-72 rounded-full border opacity-[0.06]"
                        style={{ borderColor: slide.accent }}
                    />

                    {/* Icon bubble */}
                    <div
                        className="w-28 h-28 rounded-full flex items-center justify-center relative z-10 mb-8"
                        style={{ backgroundColor: slide.accent + '20', border: `1.5px solid ${slide.accent}33` }}
                    >
                        <slide.Icon size={52} color={slide.accent} strokeWidth={1.5} />
                    </div>

                    {/* Badge */}
                    <span
                        className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                        style={{ backgroundColor: slide.accent + '22', color: slide.accent, border: `1px solid ${slide.accent}44` }}
                    >
                        {slide.badge}
                    </span>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-3 leading-tight tracking-tight">
                        {slide.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-white/55 text-sm sm:text-base text-center leading-relaxed max-w-sm">
                        {slide.subtitle}
                    </p>
                </div>

                {/* Bottom controls */}
                <div className="px-8 pb-8 pt-2 flex flex-col items-center gap-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5 mb-1">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === current ? 24 : 8,
                                    height: 8,
                                    backgroundColor: i === current ? slide.accent : 'rgba(255,255,255,0.22)',
                                }}
                            />
                        ))}
                    </div>

                    {/* Primary CTA */}
                    <button
                        onClick={handleNext}
                        className="w-full h-12 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
                        style={{ backgroundColor: slide.accent }}
                    >
                        {isLast ? (
                            <>Explore Now — It's Free</>
                        ) : (
                            <>Next <ChevronRight size={18} strokeWidth={2.5} /></>
                        )}
                    </button>

                    {/* Secondary: Create Account (shown from slide 2 onwards) */}
                    {current >= 1 && (
                        <button
                            onClick={handleSignUp}
                            className="flex items-center gap-1.5 text-white/45 hover:text-white/70 text-sm font-semibold transition-colors"
                        >
                            Create Account
                            <ArrowRight size={14} color={slide.accent} />
                        </button>
                    )}

                    <p className="text-white/20 text-[11px] text-center mt-0.5">
                        By continuing you agree to our Terms &amp; Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
