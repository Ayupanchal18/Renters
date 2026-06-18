import mongoose from "mongoose";
const { Schema } = mongoose;

const ContentSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['banner', 'hero', 'page', 'blog'],
            required: true,
            index: true
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            default: ''
        },
        imageUrl: {
            type: String,
            default: null
        },
        metadata: {
            seoTitle: { type: String, default: '' },
            seoDescription: { type: String, default: '' },
            seoKeywords: [{ type: String }],
            author: { type: String, default: '' },
            excerpt: { type: String, default: '' }
        },
        isPublished: {
            type: Boolean,
            default: false,
            index: true
        },
        publishedAt: {
            type: Date,
            default: null
        },
        scheduledFor: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'published', 'archived'],
            default: 'draft',
            index: true
        },
        versions: [{
            versionNumber: { type: Number, required: true },
            content: { type: String, default: '' }, // HTML string content of the version
            savedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            savedAt: { type: Date, default: Date.now },
            label: { type: String, default: '' }
        }],
        order: {
            type: Number,
            default: 0,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        // For banners - additional fields
        linkUrl: {
            type: String,
            default: null
        },
        linkText: {
            type: String,
            default: null
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Compound unique index for type + slug
ContentSchema.index({ type: 1, slug: 1 }, { unique: true });

// Additional indexes for efficient querying
ContentSchema.index({ type: 1, isPublished: 1, order: 1 });
ContentSchema.index({ isPublished: 1, publishedAt: -1 });
ContentSchema.index({ type: 1, isPublished: 1, startDate: 1, endDate: 1 });
ContentSchema.index({ title: 'text', content: 'text' });

// Pre-save hook to set publishedAt when publishing and synchronize status/isPublished
ContentSchema.pre('save', function (next) {
    if (this.status === 'published') {
        this.isPublished = true;
        if (!this.publishedAt) {
            this.publishedAt = new Date();
        }
    } else if (this.isPublished) {
        this.status = 'published';
        if (!this.publishedAt) {
            this.publishedAt = new Date();
        }
    } else {
        this.isPublished = false;
    }
    next();
});

export const Content =
    mongoose.models.Content || mongoose.model("Content", ContentSchema);
