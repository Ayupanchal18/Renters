/**
 * Mongoose Soft Delete Plugin
 * Automatically adds 'isDeleted' field to schema and filters out soft-deleted documents on queries
 */
export default function softDeletePlugin(schema) {
    // Dynamically add isDeleted field if not present
    if (schema.path('isDeleted') === undefined) {
        schema.add({
            isDeleted: {
                type: Boolean,
                default: false,
                index: true
            },
            deletedAt: {
                type: Date,
                default: null
            }
        });
    }

    // Middleware for query filters (find, findOne, findOneAndUpdate, count, etc.)
    schema.pre(/^find|^count/, function (next) {
        const filter = this.getFilter();
        
        // If query explicitly includes includeDeleted, bypass filter
        if (filter && filter.includeDeleted) {
            delete filter.includeDeleted;
            return next();
        }

        // Otherwise filter out soft-deleted documents
        this.where({ isDeleted: { $ne: true } });
        next();
    });

    // Middleware for aggregations
    schema.pre('aggregate', function (next) {
        const pipeline = this.pipeline();
        
        // If aggregate pipeline explicitly includes a match on includeDeleted, strip it and bypass filtering
        let bypass = false;
        for (const stage of pipeline) {
            if (stage.$match && stage.$match.includeDeleted !== undefined) {
                bypass = stage.$match.includeDeleted;
                delete stage.$match.includeDeleted;
            }
        }

        if (bypass) {
            return next();
        }

        // Add a $match stage to exclude soft-deleted items at the beginning of the pipeline
        pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
        next();
    });
}
