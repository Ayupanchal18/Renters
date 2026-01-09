/**
 * MongoDB Query Profiler Middleware
 * Logs slow database queries (>100ms) with details
 * 
 * Requirements: 4.6 - Slow query logging
 */

import mongoose from 'mongoose';
import logger from '../services/loggerService.js';

/**
 * Default threshold for slow queries in milliseconds
 * Set higher in development to reduce noise
 */
const DEFAULT_SLOW_QUERY_THRESHOLD_MS = process.env.NODE_ENV === 'production' ? 100 : 500;

/**
 * Configuration for query profiling
 */
const config = {
    // Disable in development by default to reduce noise, enable in production
    enabled: process.env.ENABLE_SLOW_QUERY_LOGGING === 'true' || process.env.NODE_ENV === 'production',
    threshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS, 10) || DEFAULT_SLOW_QUERY_THRESHOLD_MS,
    logAllQueries: process.env.LOG_ALL_QUERIES === 'true'
};

/**
 * Format query details for logging
 * @param {Object} queryInfo - Query information object
 * @returns {Object} - Formatted query details
 */
function formatQueryDetails(queryInfo) {
    const details = {
        collection: queryInfo.collection,
        operation: queryInfo.operation,
        duration: queryInfo.duration
    };

    // Include filter/query conditions (sanitized)
    if (queryInfo.filter && Object.keys(queryInfo.filter).length > 0) {
        details.filter = sanitizeQueryFilter(queryInfo.filter);
    }

    // Include projection if present
    if (queryInfo.projection) {
        details.projection = queryInfo.projection;
    }

    // Include sort if present
    if (queryInfo.sort) {
        details.sort = queryInfo.sort;
    }

    // Include limit/skip if present
    if (queryInfo.limit !== undefined) {
        details.limit = queryInfo.limit;
    }
    if (queryInfo.skip !== undefined) {
        details.skip = queryInfo.skip;
    }

    return details;
}

/**
 * Sanitize query filter to remove sensitive data
 * @param {Object} filter - Query filter object
 * @returns {Object} - Sanitized filter
 */
function sanitizeQueryFilter(filter) {
    if (!filter || typeof filter !== 'object') {
        return filter;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'otp', 'code', 'refreshToken'];
    const sanitized = {};

    for (const [key, value] of Object.entries(filter)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeQueryFilter(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Log a slow query
 * @param {Object} queryInfo - Query information
 */
function logSlowQuery(queryInfo) {
    const details = formatQueryDetails(queryInfo);

    logger.warn('Slow database query detected', {
        ...details,
        threshold: config.threshold,
        exceededBy: queryInfo.duration - config.threshold
    });
}

/**
 * Log a query (for debugging/all query logging)
 * @param {Object} queryInfo - Query information
 */
function logQuery(queryInfo) {
    const details = formatQueryDetails(queryInfo);
    logger.debug('Database query executed', details);
}

/**
 * Setup Mongoose query profiling using middleware hooks
 * This attaches pre/post hooks to track query execution time
 */
export function setupQueryProfiling() {
    if (!config.enabled) {
        logger.info('Query profiling is disabled');
        return;
    }

    logger.info('Setting up MongoDB query profiling', {
        threshold: config.threshold,
        logAllQueries: config.logAllQueries
    });

    // Enable mongoose debug mode if logging all queries
    if (config.logAllQueries) {
        mongoose.set('debug', (collectionName, methodName, ...methodArgs) => {
            logger.debug('Mongoose operation', {
                collection: collectionName,
                method: methodName,
                args: methodArgs.length > 0 ? JSON.stringify(methodArgs).substring(0, 200) : undefined
            });
        });
    }

    // Hook into mongoose Query prototype to measure execution time
    const originalExec = mongoose.Query.prototype.exec;

    mongoose.Query.prototype.exec = async function (...args) {
        const startTime = process.hrtime.bigint();
        const queryInfo = {
            collection: this.mongooseCollection?.name || this.model?.collection?.name || 'unknown',
            operation: this.op || 'unknown',
            filter: this.getFilter ? this.getFilter() : this._conditions,
            projection: this._fields,
            sort: this.options?.sort,
            limit: this.options?.limit,
            skip: this.options?.skip
        };

        try {
            const result = await originalExec.apply(this, args);

            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            queryInfo.duration = Math.round(durationMs * 100) / 100;

            // Log slow queries
            if (durationMs > config.threshold) {
                logSlowQuery(queryInfo);
            } else if (config.logAllQueries) {
                logQuery(queryInfo);
            }

            return result;
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            queryInfo.duration = Math.round(durationMs * 100) / 100;

            logger.error('Database query failed', {
                ...formatQueryDetails(queryInfo),
                error: error.message
            });

            throw error;
        }
    };

    // Also hook into Aggregate for aggregation pipelines
    const originalAggregateExec = mongoose.Aggregate.prototype.exec;

    mongoose.Aggregate.prototype.exec = async function (...args) {
        const startTime = process.hrtime.bigint();
        const queryInfo = {
            collection: this._model?.collection?.name || 'unknown',
            operation: 'aggregate',
            pipeline: this.pipeline ? this.pipeline() : undefined
        };

        try {
            const result = await originalAggregateExec.apply(this, args);

            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            queryInfo.duration = Math.round(durationMs * 100) / 100;

            // Log slow aggregations
            if (durationMs > config.threshold) {
                logger.warn('Slow database aggregation detected', {
                    collection: queryInfo.collection,
                    operation: queryInfo.operation,
                    duration: queryInfo.duration,
                    pipelineStages: queryInfo.pipeline?.length || 0,
                    threshold: config.threshold,
                    exceededBy: queryInfo.duration - config.threshold
                });
            } else if (config.logAllQueries) {
                logger.debug('Database aggregation executed', {
                    collection: queryInfo.collection,
                    operation: queryInfo.operation,
                    duration: queryInfo.duration,
                    pipelineStages: queryInfo.pipeline?.length || 0
                });
            }

            return result;
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            queryInfo.duration = Math.round(durationMs * 100) / 100;

            logger.error('Database aggregation failed', {
                collection: queryInfo.collection,
                operation: queryInfo.operation,
                duration: queryInfo.duration,
                pipelineStages: queryInfo.pipeline?.length || 0,
                error: error.message
            });

            throw error;
        }
    };
}

/**
 * Get current profiling configuration
 * @returns {Object} - Current configuration
 */
export function getProfilingConfig() {
    return { ...config };
}

/**
 * Update profiling configuration at runtime
 * @param {Object} newConfig - New configuration values
 */
export function updateProfilingConfig(newConfig) {
    if (typeof newConfig.enabled === 'boolean') {
        config.enabled = newConfig.enabled;
    }
    if (typeof newConfig.threshold === 'number' && newConfig.threshold > 0) {
        config.threshold = newConfig.threshold;
    }
    if (typeof newConfig.logAllQueries === 'boolean') {
        config.logAllQueries = newConfig.logAllQueries;
    }

    logger.info('Query profiling configuration updated', config);
}

export default {
    setupQueryProfiling,
    getProfilingConfig,
    updateProfilingConfig,
    formatQueryDetails,
    sanitizeQueryFilter
};
