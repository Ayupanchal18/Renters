export const properties = [
    {
        id: 101,
        title: "Modern Downtown Apartment",
        location: "221B Baker St, New York, NY",
        city: "New York",
        price: 450000,
        priceLabel: "$450,000",
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
            name: "Olivia Martin",
            phone: "+1 (555) 987-6543",
            email: "olivia.martin@estatehub.com",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
        },
        listedAt: "2025-06-01",
    },
    {
        id: 102,
        title: "Luxury Suburban Villa",
        location: "742 Evergreen Terrace, Los Angeles, CA",
        city: "Los Angeles",
        price: 3200,
        priceLabel: "$3,200/mo",
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
            name: "Ethan Brown",
            phone: "+1 (555) 321-7654",
            email: "ethan.brown@estatehub.com",
            avatar: "https://images.unsplash.com/photo-1545996124-1b9e6b9b4d3d?w=200&h=200&fit=crop",
        },
        listedAt: "2025-05-21",
    },
    {
        id: 103,
        title: "Cozy Studio Loft",
        location: "88 Mission St, San Francisco, CA",
        city: "San Francisco",
        price: 2800,
        priceLabel: "$2,800/mo",
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
            name: "Maya Patel",
            phone: "+1 (555) 654-3210",
            email: "maya.patel@estatehub.com",
            avatar: "https://images.unsplash.com/photo-1544725122-4e0f5d3a6f8b?w=200&h=200&fit=crop",
        },
        listedAt: "2025-06-08",
    },
];
export const cities = [
    { name: "New York", properties: 1234, image: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=800&h=600&fit=crop" },
    { name: "Los Angeles", properties: 856, image: "https://images.unsplash.com/photo-1505691723518-36a2d19b3b6b?w=800&h=600&fit=crop" },
    { name: "San Francisco", properties: 742, image: "https://images.unsplash.com/photo-1505765055769-6f1b6b41c3c8?w=800&h=600&fit=crop" },
    { name: "Miami", properties: 445, image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&h=600&fit=crop" },
];
export const posts = [
    {
        id: "how-to-buy",
        title: "How to Buy Your First Home: A Complete Guide",
        excerpt: "Step-by-step advice for first-time homebuyers to navigate the market.",
        content: "Buying your first home is a major milestone. Start by understanding your budget...",
        author: "Alicia Gomez",
        date: "2025-05-15",
        cover: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&h=700&fit=crop",
    },
    {
        id: "staging-tips",
        title: "Top 10 Home Staging Tips that Sell Fast",
        excerpt: "Small changes that make a big difference when selling your property.",
        content: "Staging helps buyers envision how they can use the space. Focus on decluttering...",
        author: "Samir K",
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
    { id: 1, with: "Olivia Martin", last: "Hi! I can schedule a viewing for Friday.", time: "2:14 PM" },
    { id: 2, with: "Ethan Brown", last: "Thanks for your interest!", time: "9:41 AM" },
];
