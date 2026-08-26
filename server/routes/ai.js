import { Router } from "express";
import { Property } from "../models/Property.js";
import { connectDB } from "../src/config/db.js";
import fetch from "node-fetch";

const router = Router();

/**
 * ------------------------------------------------------------------
 * 1. INDUSTRY-STANDARD GEMINI TOOLS SCHEMA (FUNCTION DECLARATIONS)
 * ------------------------------------------------------------------
 */
const AI_TOOLS = [
    {
        function_declarations: [
            {
                name: "searchProperties",
                description: "Search active real estate property listings in MongoDB database using structured filters like city, locality, category, bedrooms, price range, and furnishing.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        city: {
                            type: "STRING",
                            description: "City name where property is located, e.g. Ahmedabad, Bangalore, Mumbai, Pune, Delhi, Lucknow, Hyderabad"
                        },
                        locality: {
                            type: "STRING",
                            description: "Specific neighborhood/locality area, e.g. Satellite, Koramangala, Bopal, Baner, Indiranagar"
                        },
                        category: {
                            type: "STRING",
                            enum: ["room", "flat", "house", "pg", "hostel", "commercial"],
                            description: "Type of accommodation: room, flat, house, pg, hostel, or commercial"
                        },
                        listingType: {
                            type: "STRING",
                            enum: ["rent", "buy"],
                            description: "Listing type: rent or buy"
                        },
                        bedrooms: {
                            type: "INTEGER",
                            description: "Number of bedrooms / BHK count, e.g. 1, 2, 3, 4"
                        },
                        furnishing: {
                            type: "STRING",
                            enum: ["unfurnished", "semi", "fully"],
                            description: "Furnishing status"
                        },
                        maxPrice: {
                            type: "NUMBER",
                            description: "Maximum budget or rent in INR, e.g. 25000"
                        },
                        minPrice: {
                            type: "NUMBER",
                            description: "Minimum budget or rent in INR, e.g. 10000"
                        },
                        preferredTenants: {
                            type: "STRING",
                            enum: ["family", "bachelor", "any"],
                            description: "Target tenant category"
                        }
                    }
                }
            },
            {
                name: "getRentalAdvisory",
                description: "Get verified rental policy guidelines, standard security deposit norms, notice periods, or tenant verification requirements.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        topic: {
                            type: "STRING",
                            enum: ["security_deposit", "notice_period", "tenant_verification", "lease_agreement", "maintenance"],
                            description: "Advisory topic to look up"
                        },
                        city: {
                            type: "STRING",
                            description: "City name for localized real estate norms"
                        }
                    },
                    required: ["topic"]
                }
            }
        ]
    }
];

/**
 * ------------------------------------------------------------------
 * 2. DATABASE TOOL EXECUTION HANDLERS (MONGOOSE)
 * ------------------------------------------------------------------
 */

/**
 * Execute search query against MongoDB with dynamic filters
 */
async function executeSearchProperties(args = {}) {
    const filter = {
        status: "active",
        isDeleted: false
    };

    // Location (City & Locality)
    if (args.city && args.city.trim()) {
        filter.city = { $regex: args.city.trim(), $options: "i" };
    }
    if (args.locality && args.locality.trim()) {
        filter.locality = { $regex: args.locality.trim(), $options: "i" };
    }

    // Category / Listing Type
    if (args.category) {
        filter.category = args.category;
    }
    if (args.listingType) {
        filter.listingType = args.listingType;
    }

    // Bedrooms / BHK
    if (args.bedrooms && Number.isInteger(Number(args.bedrooms))) {
        filter.bedrooms = Number(args.bedrooms);
    }

    // Furnishing
    if (args.furnishing) {
        filter.furnishing = args.furnishing;
    }

    // Preferred tenants
    if (args.preferredTenants) {
        filter.preferredTenants = { $in: [args.preferredTenants, "any"] };
    }

    // Budget constraints
    if (args.maxPrice || args.minPrice) {
        const priceField = args.listingType === "buy" ? "sellingPrice" : "monthlyRent";
        filter[priceField] = {};
        if (args.maxPrice) filter[priceField].$lte = Number(args.maxPrice);
        if (args.minPrice) filter[priceField].$gte = Number(args.minPrice);
    }

    console.log("[AI Function Calling - DB Filter]:", JSON.stringify(filter));

    // Execute query with sorting by newest
    const properties = await Property.find(filter)
        .select("title slug category listingType monthlyRent sellingPrice city locality address bedrooms bathrooms furnishing photos virtualTour")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

    return {
        queryExecuted: filter,
        totalFound: properties.length,
        properties: properties.map(p => ({
            id: p._id,
            title: p.title,
            slug: p.slug || p._id,
            listingType: p.listingType,
            category: p.category,
            price: p.listingType === "rent" ? `₹${p.monthlyRent?.toLocaleString() || 'N/A'}/mo` : `₹${p.sellingPrice?.toLocaleString() || 'N/A'}`,
            location: `${p.locality ? p.locality + ', ' : ''}${p.city || ''}`,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            furnishing: p.furnishing,
            image: p.photos?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
        }))
    };
}

/**
 * Execute legal & rental advisory lookup
 */
function executeGetRentalAdvisory(args = {}) {
    const guidelines = {
        security_deposit: "In India, standard security deposit is typically 2 to 3 months rent in cities like Pune, Delhi, Ahmedabad, and Lucknow, while Bangalore and Mumbai can range from 3 to 6 months.",
        notice_period: "The standard notice period for residential leases on Renters is 30 days (1 month), allowing either party to terminate the contract with written notice.",
        tenant_verification: "Tenant verification on Renters requires: 1) Government ID Proof (Aadhar/Passport/PAN), 2) Address Proof (Utility bill/bank statement), and optional Income Proof (salary slip/ITR) submitted to your Document Vault.",
        lease_agreement: "Digital Lease Agreements on Renters are legally binding contracts drafted with tenant & landlord terms, e-signatures, and anti-tamper DRM security stamps.",
        maintenance: "Minor routine maintenance (under ₹1,000) is generally handled by the tenant, whereas structural repairs, electrical rewiring, and major plumbing are the landlord's responsibility."
    };

    return {
        topic: args.topic,
        guidance: guidelines[args.topic] || "Standard rental and leasing policies apply across all Renters properties."
    };
}

/**
 * ------------------------------------------------------------------
 * 3. MAIN AI CHAT ENDPOINT WITH GEMINI FUNCTION CALLING LOOP
 * ------------------------------------------------------------------
 */
router.post("/chat", async (req, res) => {
    try {
        await connectDB();
        const { message, conversationHistory = [] } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                success: false,
                error: "INVALID_PROMPT",
                message: "Message prompt is required."
            });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        let finalReplyText = "";
        let finalProperties = [];

        // --------------------------------------------------------------
        // PATH A: Google Gemini 3.6 Flash Function Calling
        // --------------------------------------------------------------
        if (geminiApiKey) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;
                
                // Construct message history
                const contents = [
                    {
                        role: "user",
                        parts: [{ 
                            text: `You are "Renters AI Concierge", an expert real estate AI advisor for the Renters platform.
Help users find properties and answer renting/buying/legal questions using your tools.
For general greetings (e.g. "hello", "hi", "how are you"), reply warmly and ask how you can help them with their property search without calling search tools.
User Message: "${message}"` 
                        }]
                    }
                ];

                // STEP 1: Send request to Gemini with Tools schema
                const firstCallRes = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents,
                        tools: AI_TOOLS
                    })
                });

                const firstCallJson = await firstCallRes.json();
                const candidate = firstCallJson?.candidates?.[0];
                const parts = candidate?.content?.parts || [];
                const functionCall = parts.find(p => p.functionCall)?.functionCall;

                // STEP 2: Handle Function Calling if requested by LLM
                if (functionCall) {
                    const toolName = functionCall.name;
                    const toolArgs = functionCall.args || {};
                    console.log(`[Gemini Agent Tool Invoked]: ${toolName}`, toolArgs);

                    let toolExecutionResult = null;

                    if (toolName === "searchProperties") {
                        const searchResult = await executeSearchProperties(toolArgs);
                        toolExecutionResult = searchResult;
                        finalProperties = searchResult.properties;

                        // If no properties found for a specific city query, get general recommendations
                        if (searchResult.totalFound === 0) {
                            const fallbackListings = await Property.find({ status: "active", isDeleted: false })
                                .sort({ createdAt: -1 })
                                .limit(3)
                                .lean();
                            finalProperties = fallbackListings.map(p => ({
                                id: p._id,
                                title: p.title,
                                slug: p.slug || p._id,
                                listingType: p.listingType,
                                category: p.category,
                                price: p.listingType === "rent" ? `₹${p.monthlyRent?.toLocaleString() || 'N/A'}/mo` : `₹${p.sellingPrice?.toLocaleString() || 'N/A'}`,
                                location: `${p.locality ? p.locality + ', ' : ''}${p.city || ''}`,
                                bedrooms: p.bedrooms,
                                bathrooms: p.bathrooms,
                                furnishing: p.furnishing,
                                image: p.photos?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
                            }));
                        }
                    } else if (toolName === "getRentalAdvisory") {
                        toolExecutionResult = executeGetRentalAdvisory(toolArgs);
                    }

                    // STEP 3: Return tool results back to Gemini for natural language response
                    const secondCallContents = [
                        ...contents,
                        {
                            role: "model",
                            parts: [{ functionCall }]
                        },
                        {
                            role: "function",
                            parts: [{
                                functionResponse: {
                                    name: toolName,
                                    response: { result: toolExecutionResult }
                                }
                            }]
                        }
                    ];

                    const secondCallRes = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: secondCallContents })
                    });

                    const secondCallJson = await secondCallRes.json();
                    finalReplyText = secondCallJson?.candidates?.[0]?.content?.parts?.[0]?.text;
                } else {
                    // Direct conversational response from Gemini (e.g. for "hello", greetings, or general advice)
                    finalReplyText = candidate?.content?.parts?.[0]?.text || "";
                    finalProperties = []; // No property cards for plain greetings!
                }

            } catch (geminiError) {
                console.warn("[Gemini Function Calling Error - Falling back]:", geminiError);
            }
        }

        // --------------------------------------------------------------
        // PATH B: Smart Local Tool Dispatcher (Fallback / Offline)
        // --------------------------------------------------------------
        if (!finalReplyText) {
            const text = message.toLowerCase().trim();

            // Check if it's a simple greeting
            if (["hello", "hi", "hey", "good morning", "good evening", "namaste", "who are you"].includes(text) || text.length < 3) {
                finalReplyText = "Hello! 👋 I am your **Renters AI Concierge**. How can I help you find your dream home or answer your renting & leasing questions today?";
                finalProperties = [];
            } else {
                const localArgs = {};

                // Category detection
                if (text.includes("room")) localArgs.category = "room";
                else if (text.includes("flat") || text.includes("apartment")) localArgs.category = "flat";
                else if (text.includes("house") || text.includes("villa")) localArgs.category = "house";
                else if (text.includes("pg") || text.includes("hostel")) localArgs.category = "pg";

                // City detection
                const commonCities = ["ahmedabad", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "hyderabad", "chennai", "lucknow", "kolkata", "jaipur"];
                for (const c of commonCities) {
                    if (text.includes(c)) {
                        localArgs.city = c.charAt(0).toUpperCase() + c.slice(1);
                        break;
                    }
                }

                // BHK count
                const bhkMatch = text.match(/(\d+)\s*(bhk|bedroom|bed)/i);
                if (bhkMatch) localArgs.bedrooms = parseInt(bhkMatch[1], 10);

                // Budget
                const budgetMatch = text.match(/(under|below|max|around|budget)\s*₹?\s*(\d+)\s*(k|thousand|lakh|l)?/i);
                if (budgetMatch) {
                    let num = parseInt(budgetMatch[2], 10);
                    const unit = budgetMatch[3]?.toLowerCase();
                    if (unit === "k" || unit === "thousand") num *= 1000;
                    if (unit === "lakh" || unit === "l") num *= 100000;
                    localArgs.maxPrice = num;
                }

                // Execute search tool
                const result = await executeSearchProperties(localArgs);

                if (result.totalFound > 0) {
                    finalProperties = result.properties;
                    finalReplyText = localArgs.city 
                        ? `I found **${result.totalFound}** verified listing(s) matching your request in **${localArgs.city}**:`
                        : `Here are the top property listings matching your request:`;
                } else if (localArgs.city) {
                    const alternatives = await Property.find({ status: "active", isDeleted: false }).sort({ createdAt: -1 }).limit(3).lean();
                    finalProperties = alternatives.map(p => ({
                        id: p._id,
                        title: p.title,
                        slug: p.slug || p._id,
                        listingType: p.listingType,
                        category: p.category,
                        price: p.listingType === "rent" ? `₹${p.monthlyRent?.toLocaleString() || 'N/A'}/mo` : `₹${p.sellingPrice?.toLocaleString() || 'N/A'}`,
                        location: `${p.locality ? p.locality + ', ' : ''}${p.city || ''}`,
                        bedrooms: p.bedrooms,
                        bathrooms: p.bathrooms,
                        furnishing: p.furnishing,
                        image: p.photos?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
                    }));
                    finalReplyText = `We currently do not have active listings in **${localArgs.city}**. Here are some top available properties in other popular cities on Renters:`;
                } else {
                    finalReplyText = `I searched our network for properties matching your query. Here are some top recommendations for you:`;
                    const alternatives = await Property.find({ status: "active", isDeleted: false }).sort({ createdAt: -1 }).limit(3).lean();
                    finalProperties = alternatives.map(p => ({
                        id: p._id,
                        title: p.title,
                        slug: p.slug || p._id,
                        listingType: p.listingType,
                        category: p.category,
                        price: p.listingType === "rent" ? `₹${p.monthlyRent?.toLocaleString() || 'N/A'}/mo` : `₹${p.sellingPrice?.toLocaleString() || 'N/A'}`,
                        location: `${p.locality ? p.locality + ', ' : ''}${p.city || ''}`,
                        bedrooms: p.bedrooms,
                        bathrooms: p.bathrooms,
                        furnishing: p.furnishing,
                        image: p.photos?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
                    }));
                }
            }
        }

        // Return structured JSON response to React widget
        res.json({
            success: true,
            reply: finalReplyText,
            matchedProperties: finalProperties
        });

    } catch (error) {
        console.error("[AI Function Calling Error]:", error);
        res.status(500).json({
            success: false,
            error: "AI_EXECUTION_FAILED",
            message: "AI Concierge failed to process request."
        });
    }
});

export default router;
