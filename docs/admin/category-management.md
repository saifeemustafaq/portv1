# Category Management System Documentation

## Overview
The Category Management System allows administrators to manage project categories across the platform. This includes enabling/disabling categories, customizing their colors, and ensuring they are properly integrated with the project creation workflow.

## Features

### 1. Category Settings Page
Located at `/admin/settings`, the category settings page provides the following functionality:

- View all available project categories
- Enable or disable specific categories
- Customize category colors
- Save changes to category settings

### 2. Managing Categories

#### Enabling/Disabling Categories
1. Navigate to the category settings page
2. Find the category you want to manage
3. Click the "Enabled"/"Disabled" toggle button
4. Confirm your action in the dialog
5. Click "Save Changes" to persist your changes

#### Customizing Colors
1. Click the color picker next to any category
2. Select your desired color
3. The UI will automatically update to preview the change
4. Click "Save Changes" to persist your changes

### 3. Impact on Project Creation

When categories are managed:
- Disabled categories won't appear in project creation forms
- Enabled categories will show with their custom colors
- Category changes are immediately reflected across the platform

### 4. Color Accessibility

The system automatically:
- Calculates contrast ratios for text
- Adjusts text color (black/white) based on background color
- Ensures readability of category labels

## Best Practices

1. **Category Management**
   - Keep commonly used categories enabled
   - Use distinct colors for different categories
   - Consider color-blind users when choosing colors

2. **Color Selection**
   - Use brand-aligned colors when possible
   - Ensure sufficient contrast with text
   - Avoid very bright or hard-to-read colors

3. **Workflow Integration**
   - Test category visibility in project creation
   - Verify category appearance in project listings
   - Check category filters work correctly

## Troubleshooting

### Common Issues

1. **Changes Not Saving**
   - Ensure you click "Save Changes" after making modifications
   - Check for any error messages
   - Verify your admin permissions

2. **Categories Not Displaying**
   - Refresh the page
   - Clear browser cache
   - Check network connectivity

3. **Color Issues**
   - Use hexadecimal color codes
   - Ensure colors meet contrast requirements
   - Test in different browsers

### Error Messages

- "Failed to save settings": Check your connection and try again
- "Unauthorized": Log out and log back in
- "Invalid color format": Use valid hexadecimal colors

## Technical Details

### API Endpoints

1. **GET /api/admin/settings/categories**
   - Retrieves current category settings
   - Requires admin authentication

2. **POST /api/admin/settings/categories**
   - Updates category settings
   - Requires admin authentication
   - Accepts JSON payload with category configurations

### Data Structure

```typescript
interface CategoryConfig {
  title: string;
  description: string;
  color: string;
  enabled: boolean;
}

type Categories = Record<string, CategoryConfig>;
```

## Support

For additional support:
1. Check the error logs in the admin dashboard
2. Contact the development team
3. Refer to the technical documentation

## Updates and Maintenance

- Category settings are automatically backed up
- Changes are logged for audit purposes
- Regular system updates may add new features 