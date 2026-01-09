/**
 * Swagger/OpenAPI Documentation Configuration
 * 
 * This module sets up OpenAPI 3.0 documentation for the Renters API.
 * It provides interactive API testing through Swagger UI.
 * 
 * Requirements: 5.1, 5.5
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * OpenAPI specification options
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Renters API',
            version: '1.0.0',
            description: `
# Renters Property Platform API

A comprehensive REST API for the Renters property rental and sales platform.

## Features
- User authentication with JWT tokens
- Property listings (rent and buy)
- Wishlist management
- Real-time messaging
- Notifications system
- Admin management

## Authentication
Most endpoints require authentication via JWT Bearer token.
Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

## Rate Limiting
Authentication endpoints are rate-limited to prevent brute force attacks:
- Login: 10 attempts per 15 minutes
- Register: 10 attempts per 15 minutes
- OTP: 10 attempts per 15 minutes
            `,
            contact: {
                name: 'Renters Support',
                email: 'support@renters.com'
            },
            license: {
                name: 'Private',
                url: 'https://renters.com/terms'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'API Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token obtained from /auth/login or /auth/register'
                }
            },
            schemas: {
                // Common response schemas
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error type or code'
                        },
                        message: {
                            type: 'string',
                            description: 'Human-readable error message'
                        },
                        requestId: {
                            type: 'string',
                            description: 'Request ID for debugging'
                        }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        description: 'Field that failed validation'
                                    },
                                    message: {
                                        type: 'string',
                                        description: 'Validation error message'
                                    }
                                }
                            }
                        }
                    }
                },
                // User schemas
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        name: {
                            type: 'string',
                            description: 'User full name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        phone: {
                            type: 'string',
                            description: 'User phone number'
                        },
                        userType: {
                            type: 'string',
                            enum: ['buyer', 'seller', 'agent'],
                            description: 'Type of user'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'User role'
                        },
                        avatar: {
                            type: 'string',
                            description: 'Avatar URL'
                        },
                        emailVerified: {
                            type: 'boolean',
                            description: 'Whether email is verified'
                        },
                        phoneVerified: {
                            type: 'boolean',
                            description: 'Whether phone is verified'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp'
                        }
                    }
                },
                // Property schemas
                Property: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Property ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Property title'
                        },
                        description: {
                            type: 'string',
                            description: 'Property description'
                        },
                        listingType: {
                            type: 'string',
                            enum: ['rent', 'buy'],
                            description: 'Type of listing'
                        },
                        category: {
                            type: 'string',
                            description: 'Property category'
                        },
                        propertyType: {
                            type: 'string',
                            description: 'Type of property (apartment, house, etc.)'
                        },
                        city: {
                            type: 'string',
                            description: 'City location'
                        },
                        address: {
                            type: 'string',
                            description: 'Full address'
                        },
                        monthlyRent: {
                            type: 'number',
                            description: 'Monthly rent (for rent listings)'
                        },
                        sellingPrice: {
                            type: 'number',
                            description: 'Selling price (for buy listings)'
                        },
                        bedrooms: {
                            type: 'integer',
                            description: 'Number of bedrooms'
                        },
                        bathrooms: {
                            type: 'integer',
                            description: 'Number of bathrooms'
                        },
                        furnishing: {
                            type: 'string',
                            enum: ['furnished', 'semi-furnished', 'unfurnished'],
                            description: 'Furnishing status'
                        },
                        photos: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Array of photo URLs'
                        },
                        amenities: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'List of amenities'
                        },
                        slug: {
                            type: 'string',
                            description: 'URL-friendly slug'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'pending', 'expired'],
                            description: 'Listing status'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                // Pagination schema
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            description: 'Total number of items'
                        },
                        page: {
                            type: 'integer',
                            description: 'Current page number'
                        },
                        pageSize: {
                            type: 'integer',
                            description: 'Items per page'
                        },
                        totalPages: {
                            type: 'integer',
                            description: 'Total number of pages'
                        },
                        hasMore: {
                            type: 'boolean',
                            description: 'Whether more pages exist'
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                success: false,
                                error: 'Unauthorized',
                                message: 'Access token is required'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Request validation failed',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValidationError'
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                success: false,
                                error: 'Not found',
                                message: 'The requested resource was not found'
                            }
                        }
                    }
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                success: false,
                                error: 'Server error',
                                message: 'An unexpected error occurred'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and session management'
            },
            {
                name: 'Properties',
                description: 'Property listings management'
            },
            {
                name: 'Rent Properties',
                description: 'Rental property listings'
            },
            {
                name: 'Buy Properties',
                description: 'Properties for sale'
            },
            {
                name: 'Wishlist',
                description: 'User wishlist management'
            },
            {
                name: 'Messages',
                description: 'Messaging and conversations'
            },
            {
                name: 'Notifications',
                description: 'User notifications'
            },
            {
                name: 'Users',
                description: 'User profile management'
            },
            {
                name: 'Admin',
                description: 'Administrative operations (requires admin role)'
            }
        ]
    },
    apis: [
        './server/src/docs/paths/*.js'
    ]
};

// Generate OpenAPI specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 * @param {Express} app - Express application instance
 */
export function setupSwagger(app) {
    // Swagger UI options
    const swaggerUiOptions = {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Renters API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true
        }
    };

    // Serve Swagger UI at /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Serve raw OpenAPI spec as JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 API Documentation available at /api-docs');
}

export { swaggerSpec };
export default setupSwagger;
