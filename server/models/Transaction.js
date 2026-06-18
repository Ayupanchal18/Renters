import mongoose from "mongoose";
const { Schema } = mongoose;

const TransactionSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true
    },
    propertyId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Property',
        default: null,
        index: true
    },
    type: { 
        type: String, 
        enum: ['subscription', 'listing_fee', 'featured_boost', 'refund'], 
        required: true,
        index: true
    },
    amount: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'INR' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'], 
        required: true,
        index: true
    },
    gateway: { 
        type: String, 
        enum: ['razorpay', 'stripe', 'manual'], 
        default: 'manual'
    },
    gatewayTxnId: { 
        type: String, 
        default: null 
    },
    description: { 
        type: String, 
        default: '' 
    }
}, { timestamps: true });

// Compounded indexes for analytics performance
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
