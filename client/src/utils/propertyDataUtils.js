/**
 * Property Data Utils - Main export file for enhanced data handling utilities
 * Validates: Requirements 1.2, 4.5, 5.4, 8.5
 * 
 * This file provides a unified interface for all property data handling utilities
 * including validation, error handling, fallback generation, and data transformation.
 */

// Import all utility classes and instances
import { PropertyDataValidator, propertyDataValidator } from './PropertyDataValidator.js';
import { EnhancedErrorHandler, enhancedErrorHandler } from './EnhancedErrorHandler.js';
import { FallbackDataGenerator, fallbackDataGenerator } from './FallbackDataGenerator.js';
import { DataTransformationUtils, dataTransformationUtils } from './DataTransformationUtils.js';

/**
 * Main PropertyDataUtils class that combines all utilities
 */
export class PropertyDataUtils {
    constructor() {
        this.validator = new PropertyDataValidator();
        this.errorHandler = new EnhancedErrorHandler();
        this.fallbackGenerator = new FallbackDataGenerator();
        this.transformer = new DataTransformationUtils();
    }

    /**
     * Processes raw property data through the complete pipeline
     * @param {Object} rawProperty - Raw property data from API
     * @returns {Object} - Fully processed property data ready for display
     */
    processPropertyData(rawProperty) {
        try {
            // Step 1: Validate and transform the data
            const validationResult = this.validator.validateAndTransform(rawProperty);

            if (validationResult.hasErrors) {
                // Log validation errors but continue with fallbacks
                console.warn('PropertyDataUtils: Validation errors found:', validationResult.validation.errors);
            }

            // Step 2: Apply additional fallbacks if needed
            const propertyWithFallbacks = validationResult.property ||
                this.fallbackGenerator.generateCompleteProperty(rawProperty);

            // Step 3: Transform for display
            const transformedProperty = this.transformer.transformPropertyForDisplay(propertyWithFallbacks);

            return {
                success: true,
                property: transformedProperty,
                validation: validationResult.validation,
                metadata: {
                    hasErrors: validationResult.hasErrors,
                    hasWarnings: validationResult.hasWarnings,
                    hasFallbacks: validationResult.hasFallbacks || this.fallbackGenerator.hasGeneratedData(propertyWithFallbacks),
                    completionScore: transformedProperty.computed?.completionScore || 0,
                    processedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            // Handle processing errors
            const processedError = this.errorHandler.handlePropertyError(error, 'property-processing');

            return {
                success: false,
                property: null,
                error: processedError,
                fallbackProperty: this.fallbackGenerator.generateCompleteProperty({})
            };
        }
    }

    /**
     * Processes a list of properties
     * @param {Array} properties - Array of raw property data
     * @returns {Object} - Processed properties with metadata
     */
    processPropertyList(properties) {
        if (!Array.isArray(properties)) {
            const error = this.errorHandler.handlePropertyError(
                new Error('Invalid property list format'),
                'property-list-processing'
            );

            return {
                success: false,
                properties: [],
                error,
                metadata: {
                    total: 0,
                    processed: 0,
                    failed: 1
                }
            };
        }

        const processedProperties = [];
        const failedProperties = [];

        properties.forEach((property, index) => {
            const result = this.processPropertyData(property);

            if (result.success) {
                processedProperties.push({
                    ...result.property,
                    _originalIndex: index,
                    _metadata: result.metadata
                });
            } else {
                failedProperties.push({
                    index,
                    property,
                    error: result.error,
                    fallback: result.fallbackProperty
                });
            }
        });

        return {
            success: failedProperties.length === 0,
            properties: processedProperties,
            failedProperties,
            metadata: {
                total: properties.length,
                processed: processedProperties.length,
                failed: failedProperties.length,
                successRate: properties.length > 0 ? (processedProperties.length / properties.length) * 100 : 0
            }
        };
    }

    /**
     * Handles property loading errors with appropriate fallbacks
     * @param {Error} error - Loading error
     * @param {string} propertyId - Property ID that failed to load
     * @returns {Object} - Error handling result with fallback options
     */
    handlePropertyLoadError(error, propertyId = null) {
        const processedError = this.errorHandler.handlePropertyLoadError(error, propertyId);
        const fallbackProperty = this.fallbackGenerator.generateCompleteProperty({
            _id: propertyId,
            _isErrorFallback: true
        });

        return {
            error: processedError,
            fallbackProperty: this.transformer.transformPropertyForDisplay(fallbackProperty),
            canRetry: processedError.canRetry,
            recoveryOptions: processedError.recoveryOptions
        };
    }

    /**
     * Handles image loading errors with fallback images
     * @param {Error} error - Image loading error
     * @param {string} imageUrl - Failed image URL
     * @param {string} imageType - Type of image
     * @returns {Object} - Error handling result with fallback image
     */
    handleImageError(error, imageUrl, imageType = 'property') {
        const processedError = this.errorHandler.handleImageLoadError(error, imageUrl, imageType);

        let fallbackImage;
        switch (imageType) {
            case 'owner':
                fallbackImage = '/property_image/placeholder-user.jpg';
                break;
            case 'logo':
                fallbackImage = '/property_image/placeholder-logo.png';
                break;
            default:
                fallbackImage = '/property_image/placeholder.jpg';
        }

        return {
            error: processedError,
            fallbackImage,
            shouldUseFallback: true
        };
    }

    /**
     * Validates property data and returns detailed validation results
     * @param {Object} property - Property data to validate
     * @returns {Object} - Detailed validation results
     */
    validateProperty(property) {
        return this.validator.validateAndTransform(property);
    }

    /**
     * Generates fallback data for missing property information
     * @param {Object} partialProperty - Partial property data
     * @returns {Object} - Complete property with fallbacks
     */
    generateFallbackProperty(partialProperty = {}) {
        const completeProperty = this.fallbackGenerator.generateCompleteProperty(partialProperty);
        return this.transformer.transformPropertyForDisplay(completeProperty);
    }

    /**
     * Transforms property data for display without validation
     * @param {Object} property - Property data
     * @returns {Object} - Transformed property data
     */
    transformForDisplay(property) {
        return this.transformer.transformPropertyForDisplay(property);
    }

    /**
     * Gets error statistics from the error handler
     * @returns {Object} - Error statistics
     */
    getErrorStatistics() {
        return this.errorHandler.getErrorStatistics();
    }

    /**
     * Clears error history
     */
    clearErrorHistory() {
        this.errorHandler.clearErrorHistory();
    }

    /**
     * Checks if property data is complete
     * @param {Object} property - Property data
     * @returns {boolean} - True if property has complete information
     */
    isPropertyComplete(property) {
        return this.transformer.hasCompleteInformation(property);
    }

    /**
     * Calculates property data completion score
     * @param {Object} property - Property data
     * @returns {number} - Completion score (0-100)
     */
    getCompletionScore(property) {
        return this.transformer.calculateCompletionScore(property);
    }
}

// Export singleton instance for convenience
export const propertyDataUtils = new PropertyDataUtils();

// Export individual utility classes and instances
export {
    PropertyDataValidator,
    propertyDataValidator,
    EnhancedErrorHandler,
    enhancedErrorHandler,
    FallbackDataGenerator,
    fallbackDataGenerator,
    DataTransformationUtils,
    dataTransformationUtils
};

// Export main class
export default PropertyDataUtils;