export const properties = [
    {
        id: 101,
        title: "Modern Downtown Apartment",
        location: "Bandra West, Mumbai, Maharashtra",
        city: "Mumbai",
        price: 45000,
        priceLabel: "₹45,000",
        type: "For Sale",
        beds: 3,
        baths: 2,
        sqft: 1800,
        description: "A bright modern apartment in the heart of the city. Close to public transit, shops, and parks. Ideal for families or professionals.",
        images: [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1560448072-8a5d8b1b0bd1?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&h=800&fit=crop",
        ],
        agent: {
            id: 1,
            name: "Priya Sharma",
            phone: "+91 98765 43210",
            email: "priya.sharma@renters.com",
            avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=6366f1&color=fff&size=200",
        },
        listedAt: "2025-06-01",
    },
    {
        id: 102,
        title: "Luxury Suburban Villa",
        location: "Whitefield, Bangalore, Karnataka",
        city: "Bangalore",
        price: 32000,
        priceLabel: "₹32,000/mo",
        type: "For Rent",
        beds: 4,
        baths: 3,
        sqft: 2500,
        description: "Spacious villa with private garden and pool. Perfect for families looking for comfort and privacy.",
        images: [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop",
        ],
        agent: {
            id: 2,
            name: "Rahul Verma",
            phone: "+91 87654 32109",
            email: "rahul.verma@renters.com",
            avatar: "https://ui-avatars.com/api/?name=Rahul+Verma&background=10b981&color=fff&size=200",
        },
        listedAt: "2025-05-21",
    },
    {
        id: 103,
        title: "Cozy Studio Loft",
        location: "Connaught Place, Delhi, NCR",
        city: "Delhi",
        price: 28000,
        priceLabel: "₹28,000/mo",
        type: "For Rent",
        beds: 1,
        baths: 1,
        sqft: 650,
        description: "Compact and stylish loft in an up-and-coming neighborhood. Great for students and young professionals.",
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
        ],
        agent: {
            id: 3,
            name: "Anita Patel",
            phone: "+91 76543 21098",
            email: "anita.patel@renters.com",
            avatar: "https://ui-avatars.com/api/?name=Anita+Patel&background=ec4899&color=fff&size=200",
        },
        listedAt: "2025-06-08",
    },
];
export const cities = [
    { name: "Mumbai", properties: 4520, image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&h=600&fit=crop" },
    { name: "Delhi", properties: 3850, image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop" },
    { name: "Bangalore", properties: 3200, image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&h=600&fit=crop" },
    { name: "Hyderabad", properties: 2150, image: "https://images.unsplash.com/photo-1572638029678-d0beee1bb64d?w=800&h=600&fit=crop" },
];
export const posts = [
    {
        id: "how-to-buy",
        title: "How to Buy Your First Home: A Complete Guide",
        excerpt: "Step-by-step advice for first-time homebuyers to navigate the market.",
        content: "Buying your first home is a major milestone. Start by understanding your budget...",
        author: "Ananya Gupta",
        date: "2025-05-15",
        cover: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&h=700&fit=crop",
    },
    {
        id: "staging-tips",
        title: "Top 10 Home Staging Tips that Sell Fast",
        excerpt: "Small changes that make a big difference when selling your property.",
        content: "Staging helps buyers envision how they can use the space. Focus on decluttering...",
        author: "Samir Kumar",
        date: "2025-04-08",
        cover: "https://images.unsplash.com/photo-1505691723518-36a2d19b3b6b?w=1200&h=700&fit=crop",
    },
];
export const faqs = [
    // Getting Started
    { q: "How do I create an account on Renters?", a: "Click the 'Sign Up' button on the homepage, enter your email, phone number, and create a password. You can also sign up using your Google account for faster registration. Once registered, you can start browsing properties or list your own." },
    { q: "Is it free to use Renters?", a: "Yes, browsing properties and creating an account is completely free. Listing your property is also free. We offer optional premium features like featured listings and priority placement for property owners who want more visibility." },
    { q: "How do I list my property?", a: "After logging in, click 'Post Property' in the navigation menu. Fill in the property details including location, price, photos, and amenities. Our team will verify your listing before it goes live, usually within 24-48 hours." },

    // Property Listings
    { q: "Are all listings verified?", a: "Yes, our team reviews all property listings before they are published. We verify basic information and check for accuracy. However, we recommend visiting properties in person and conducting your own due diligence before making any commitments." },
    { q: "How long does it take for my listing to go live?", a: "Most listings are reviewed and published within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive an email notification once your listing is approved and live on the platform." },
    { q: "Can I edit my listing after it's published?", a: "Yes, you can edit your listing at any time from your dashboard. Go to 'My Properties', select the listing you want to edit, and make your changes. Major changes may require re-verification." },
    { q: "How many photos can I upload for my property?", a: "You can upload up to 10 high-quality photos per listing. We recommend including photos of all rooms, exterior views, and any special amenities. Good photos significantly increase interest in your property." },

    // Searching & Contacting
    { q: "How do I search for properties?", a: "Use the search bar on the homepage to enter your preferred location. You can filter results by property type, price range, number of bedrooms, amenities, and more. Save your favorite properties to your wishlist for easy access later." },
    { q: "How do I contact a property owner?", a: "Click on any property listing to view details. You'll find contact options including a message button to send an inquiry directly through our platform, and in some cases, phone numbers for direct contact." },
    { q: "Is my contact information shared with property owners?", a: "Your contact information is only shared when you initiate contact with a property owner. You control what information you share. We recommend using our in-app messaging initially for safety." },

    // Safety & Security
    { q: "How do I report a suspicious listing?", a: "If you encounter a suspicious listing or user, click the 'Report' button on the listing page or contact our support team. We take all reports seriously and investigate promptly to maintain platform safety." },
    { q: "What safety tips do you recommend?", a: "Always visit properties in person before making payments, meet in public places first, never share sensitive financial information, use secure payment methods, and trust your instincts. If something seems too good to be true, it probably is." },
    { q: "How is my personal data protected?", a: "We use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for detailed information about how we collect, use, and protect your personal information." },

    // Account & Settings
    { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your registered email address, and we'll send you a password reset link. The link expires after 24 hours for security reasons." },
    { q: "Can I delete my account?", a: "Yes, you can delete your account from your account settings. Go to Settings > Privacy > Delete Account. Please note that this action is permanent and will remove all your data, listings, and message history." },
    { q: "How do I update my notification preferences?", a: "Go to Settings > Notifications to customize which alerts you receive. You can choose to receive notifications via email, SMS, or push notifications for new messages, property updates, and more." },
];
export const users = [
    { id: 1, name: "Aayush Panchal", email: "aayush@example.com" },
];
export const messages = [
    { id: 1, with: "Priya Sharma", last: "Hi! I can schedule a viewing for Friday.", time: "2:14 PM" },
    { id: 2, with: "Rahul Verma", last: "Thanks for your interest!", time: "9:41 AM" },
];
