import mongoose from "mongoose";
const { Schema } = mongoose;

const MediaAssetSchema = new Schema({
    filename: { 
        type: String, 
        required: true, 
        index: true 
    },
    originalName: { 
        type: String 
    },
    mimeType: { 
        type: String, 
        index: true 
    },
    sizeBytes: { 
        type: Number 
    },
    dimensions: {
        width: { type: Number },
        height: { type: Number }
    },
    cdnUrl: { 
        type: String, 
        required: true 
    },
    thumbnailUrl: { 
        type: String 
    },
    module: { 
        type: String, 
        enum: ['property', 'banner', 'content', 'testimonial', 'misc'], 
        default: 'misc',
        index: true
    },
    usedIn: [{
        resourceType: { type: String }, // e.g. 'property', 'user', 'content'
        resourceId: { type: Schema.Types.ObjectId }
    }],
    uploadedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        index: true
    },
    tags: [{ 
        type: String 
    }],
    isOrphaned: { 
        type: Boolean, 
        default: false,
        index: true
    }
}, { timestamps: true });

// Add compound indexes for search and filters
MediaAssetSchema.index({ module: 1, isOrphaned: 1 });
MediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset = mongoose.models.MediaAsset || mongoose.model("MediaAsset", MediaAssetSchema);
