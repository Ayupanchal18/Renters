/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties
 *     description: |
 *       Retrieves a paginated list of all active properties.
 *       Supports filtering by various criteria.
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *         description: Filter by property type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, featured]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Text search query
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a new property
 *     description: |
 *       Creates a new property listing.
 *       Requires x-user-id header for authentication (development mode).
 *       Supports file upload for property photos.
 *     tags: [Properties]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *               - propertyType
 *               - furnishing
 *               - availableFrom
 *               - city
 *               - address
 *               - monthlyRent
 *             properties:
 *               category:
 *                 type: string
 *                 description: Property category
 *               title:
 *                 type: string
 *                 description: Property title
 *               description:
 *                 type: string
 *                 description: Property description
 *               propertyType:
 *                 type: string
 *                 description: Type of property
 *               furnishing:
 *                 type: string
 *                 enum: [furnished, semi-furnished, unfurnished]
 *               availableFrom:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               monthlyRent:
 *                 type: number
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /properties/{id}:
 *   get:
 *     summary: Get property by ID or slug
 *     description: Retrieves a single property by its ID or URL slug
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID or slug
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Update a property
 *     description: Updates an existing property. Only the owner can update.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               monthlyRent:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Delete a property
 *     description: Soft deletes a property. Only the owner can delete.
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Property deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /properties/rent:
 *   get:
 *     summary: Get rental properties
 *     description: |
 *       Retrieves a paginated list of rental properties.
 *       Supports filtering by rent range, bedrooms, furnishing, etc.
 *     tags: [Rent Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *         description: Filter by property type
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: number
 *         description: Minimum monthly rent
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: number
 *         description: Maximum monthly rent
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *         description: Number of bedrooms
 *       - in: query
 *         name: furnishing
 *         schema:
 *           type: string
 *           enum: [furnished, semi-furnished, unfurnished]
 *         description: Furnishing status
 *       - in: query
 *         name: preferredTenants
 *         schema:
 *           type: string
 *         description: Preferred tenant type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rent_low_to_high, rent_high_to_low, featured]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Text search query
 *     responses:
 *       200:
 *         description: Rental properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a rental property
 *     description: Creates a new rental property listing
 *     tags: [Rent Properties]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *               - propertyType
 *               - furnishing
 *               - availableFrom
 *               - city
 *               - address
 *               - monthlyRent
 *             properties:
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               propertyType:
 *                 type: string
 *               furnishing:
 *                 type: string
 *               availableFrom:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               monthlyRent:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Rental property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /properties/rent/search:
 *   post:
 *     summary: Search rental properties
 *     description: |
 *       Advanced search for rental properties with multiple filters.
 *       Supports text search, location, price range, and more.
 *     tags: [Rent Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               q:
 *                 type: string
 *                 description: Search query text
 *               location:
 *                 type: string
 *                 description: Location/city to search
 *               category:
 *                 type: string
 *                 description: Property category
 *               propertyType:
 *                 type: string
 *                 description: Property type
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 12
 *               sort:
 *                 type: string
 *                 enum: [newest, oldest, rent_low_to_high, rent_high_to_low, relevance]
 *               filters:
 *                 type: object
 *                 properties:
 *                   priceRange:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                   bedrooms:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                   furnishing:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchResultData:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     message:
 *                       type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /properties/rent/{slug}:
 *   get:
 *     summary: Get rental property by slug
 *     description: Retrieves a single rental property by its URL slug
 *     tags: [Rent Properties]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Property slug or ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /properties/buy:
 *   get:
 *     summary: Get properties for sale
 *     description: |
 *       Retrieves a paginated list of properties for sale.
 *       Supports filtering by price range, bedrooms, possession status, etc.
 *     tags: [Buy Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 100
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum selling price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum selling price
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *       - in: query
 *         name: furnishing
 *         schema:
 *           type: string
 *       - in: query
 *         name: possessionStatus
 *         schema:
 *           type: string
 *         description: Ready to move, under construction, etc.
 *       - in: query
 *         name: loanAvailable
 *         schema:
 *           type: boolean
 *         description: Whether loan is available
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_low_to_high, price_high_to_low, featured]
 *           default: newest
 *     responses:
 *       200:
 *         description: Properties for sale retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a property for sale
 *     description: Creates a new property listing for sale
 *     tags: [Buy Properties]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *               - propertyType
 *               - furnishing
 *               - availableFrom
 *               - city
 *               - address
 *               - sellingPrice
 *             properties:
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               propertyType:
 *                 type: string
 *               furnishing:
 *                 type: string
 *               availableFrom:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /properties/buy/search:
 *   post:
 *     summary: Search properties for sale
 *     description: Advanced search for properties for sale
 *     tags: [Buy Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               q:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               propertyType:
 *                 type: string
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 12
 *               sort:
 *                 type: string
 *                 enum: [newest, oldest, price_low_to_high, price_high_to_low, relevance]
 *               filters:
 *                 type: object
 *                 properties:
 *                   priceRange:
 *                     type: object
 *                     properties:
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                   bedrooms:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                   possessionStatus:
 *                     type: string
 *                   loanAvailable:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchResultData:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /properties/buy/{slug}:
 *   get:
 *     summary: Get property for sale by slug
 *     description: Retrieves a single property for sale by its URL slug
 *     tags: [Buy Properties]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
