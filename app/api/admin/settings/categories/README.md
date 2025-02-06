# Category Settings API Documentation

This API provides endpoints to manage project category settings in the application.

## Authentication

All endpoints require authentication using NextAuth.js. A valid session token must be present in the request.

## Endpoints

### GET /api/admin/settings/categories

Retrieves all category settings.

#### Response

```json
{
  "categories": {
    "product": {
      "title": "Product Projects",
      "description": "Manage your product portfolio projects",
      "category": "product",
      "color": "#000000",
      "enabled": true
    },
    // ... other categories
  }
}
```

### POST /api/admin/settings/categories

Updates category settings.

#### Request Body

```json
{
  "categories": {
    "product": {
      "title": "Product Projects",
      "description": "Manage your product portfolio projects",
      "category": "product",
      "color": "#FF0000",
      "enabled": true
    },
    // ... other categories
  }
}
```

#### Response

```json
{
  "success": true
}
```

## Error Responses

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Server Error (500)
```json
{
  "error": "Failed to fetch category settings"
}
```
or
```json
{
  "error": "Failed to save category settings"
}
```

## Data Model

### Category
- `title` (string): Display name of the category
- `description` (string): Description of the category
- `category` (string): Unique identifier/key for the category
- `color` (string): Hex color code for the category
- `enabled` (boolean): Whether the category is active

## Notes
- All categories must have unique identifiers
- Color codes must be valid hex values
- Changes are applied immediately
- Disabled categories will not appear in project creation forms 