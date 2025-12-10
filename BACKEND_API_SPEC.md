# EstateHub Backend API Specification

Complete REST API contract for the EstateHub real estate marketplace.

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

### Local Development

For local development, include user ID via header:

```
x-user-id: <user_id>
```

### Production (Future)

JWT Bearer tokens:

```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### 1. Register

**Endpoint**: `POST /auth/register`

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

**Response** (201 Created):

```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:

- `400 Bad Request`: Validation error (missing/invalid fields)
- `409 Conflict`: Email already registered

---

### 2. Login

**Endpoint**: `POST /auth/login`

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:

- `404 Not Found`: User not found
- `401 Unauthorized`: Invalid credentials

---

## User Endpoints

### 1. Get Profile

**Endpoint**: `GET /users/me`

**Headers**:

```
x-user-id: <user_id>
```

**Response** (200 OK):

```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "user",
  "avatar": "https://...",
  "verified": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Errors**:

- `401 Unauthorized`: Missing user ID

---

### 2. Update Profile

**Endpoint**: `PATCH /users/me`

**Headers**:

```
x-user-id: <user_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "Jane Doe",
  "avatar": "https://...",
  "bio": "Real estate enthusiast"
}
```

**Response** (200 OK):

```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Jane Doe",
  "email": "john@example.com",
  "avatar": "https://...",
  "bio": "Real estate enthusiast",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

## Property Endpoints

### 1. Create Property

**Endpoint**: `POST /properties`

**Headers**:

```
x-user-id: <user_id>
Content-Type: application/json
```

**Request Body**:

```json
{
  "title": "Modern Downtown Apartment",
  "description": "A bright 3-bedroom apartment",
  "price": 450000,
  "priceLabel": "$450,000",
  "type": "Apartment",
  "address": {
    "line": "221 Baker Street",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "lat": 40.7128,
    "lng": -74.006
  },
  "beds": 3,
  "baths": 2,
  "sqft": 1800,
  "images": ["https://unsplash.com/image1.jpg"]
}
```

**Response** (201 Created):

```json
{
  "_id": "65b2c3d4e5f6g7h8i9j0k1l2",
  "title": "Modern Downtown Apartment",
  "price": 450000,
  "owner": "65a1b2c3d4e5f6g7h8i9j0k1",
  "status": "active",
  "views": 0,
  "favoritesCount": 0,
  "featured": false,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### 2. List Properties

**Endpoint**: `GET /properties`

**Query Parameters**:
| Param | Type | Default | Example |
|-------|------|---------|---------|
| `page` | number | 1 | 2 |
| `limit` | number | 12 | 24 |
| `city` | string | - | "New York" |
| `type` | string | - | "Apartment" |
| `minPrice` | number | - | 100000 |
| `maxPrice` | number | - | 500000 |

**Request**:

```bash
GET /properties?page=1&limit=12&city=NewYork&type=Apartment&minPrice=100000&maxPrice=500000
```

**Response** (200 OK):

```json
{
  "items": [
    {
      "_id": "65b2c3d4e5f6g7h8i9j0k1l2",
      "title": "Modern Downtown Apartment",
      "price": 450000,
      "city": "New York",
      "type": "Apartment",
      "beds": 3,
      "baths": 2,
      "sqft": 1800,
      "views": 12,
      "featured": true,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 245,
  "page": 1,
  "pageSize": 12
}
```

---

### 3. Get Property by ID

**Endpoint**: `GET /properties/:id`

**Response** (200 OK):

```json
{
  "_id": "65b2c3d4e5f6g7h8i9j0k1l2",
  "title": "Modern Downtown Apartment",
  "description": "A bright 3-bedroom apartment...",
  "price": 450000,
  "address": {
    "line": "221 Baker Street",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "lat": 40.7128,
    "lng": -74.006
  },
  "beds": 3,
  "baths": 2,
  "sqft": 1800,
  "images": ["https://..."],
  "owner": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Seller",
    "email": "seller@example.com",
    "avatar": "https://..."
  },
  "views": 13,
  "favoritesCount": 2,
  "featured": true,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Note**: Requesting a property increments the `views` counter.

---

### 4. Update Property

**Endpoint**: `PATCH /properties/:id`

**Headers**:

```
x-user-id: <user_id>
Content-Type: application/json
```

**Request Body** (partial):

```json
{
  "title": "Updated Title",
  "price": 475000,
  "status": "draft"
}
```

**Response** (200 OK):

```json
{
  "_id": "65b2c3d4e5f6g7h8i9j0k1l2",
  "title": "Updated Title",
  "price": 475000,
  "status": "draft",
  "updatedAt": "2025-01-15T11:30:00Z"
}
```

---

### 5. Delete Property

**Endpoint**: `DELETE /properties/:id`

**Headers**:

```
x-user-id: <user_id>
```

**Response** (200 OK):

```json
{
  "success": true
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Status | Meaning                                 |
| ------ | --------------------------------------- |
| 200    | OK — Request succeeded                  |
| 201    | Created — Resource created successfully |
| 204    | No Content — Successful deletion        |
| 400    | Bad Request — Validation error          |
| 401    | Unauthorized — Missing auth header      |
| 404    | Not Found — Resource not found          |
| 409    | Conflict — Resource already exists      |
| 500    | Internal Server Error                   |

---

## Data Models

### User

```typescript
{
  _id: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: "user" | "seller" | "admin";
  avatar?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Property

```typescript
{
  _id: ObjectId;
  title: string;
  description?: string;
  price: number;
  priceLabel?: string;
  type: string;
  status: "active" | "draft" | "sold" | "rented";
  address: {
    line?: string;
    city?: string;
    state?: string;
    zip?: string;
    lat?: number;
    lng?: number;
  };
  beds?: number;
  baths?: number;
  sqft?: number;
  images: string[];
  owner: ObjectId (ref: User);
  views: number;
  favoritesCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Testing with cURL

See `SETUP_LOCAL_DEV.md` for complete examples.

Quick test:

```bash
# List properties
curl http://localhost:3000/api/properties?page=1&limit=10

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"password123"}'
```

---

## Next Steps

- [ ] Add authentication middleware (JWT validation)
- [ ] Implement Wishlist endpoints
- [ ] Add Conversation & Message endpoints
- [ ] Implement file upload (S3 signed URLs)
- [ ] Add Socket.io for real-time chat
- [ ] Implement Admin endpoints
- [ ] Add rate limiting & CORS whitelist
- [ ] Deploy to production (Vercel/Netlify/Heroku)
