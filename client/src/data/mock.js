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
    { q: "How do I list my property?", a: "Create an account, click Post Property, and fill the listing form." },
    { q: "Are listings verified?", a: "Our team verifies submitted listings before publishing." },
    { q: "What fees do you charge?", a: "Listing is free; premium promotion packages are available." },
];
export const users = [
    { id: 1, name: "Aayush Panchal", email: "aayush@example.com" },
];
export const messages = [
    { id: 1, with: "Priya Sharma", last: "Hi! I can schedule a viewing for Friday.", time: "2:14 PM" },
    { id: 2, with: "Rahul Verma", last: "Thanks for your interest!", time: "9:41 AM" },
];
