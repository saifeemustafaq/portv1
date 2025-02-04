

## Portfolio Website Structure

This portfolio website will feature a comprehensive and user-friendly design, incorporating the following key elements:

### Navigation and Layout

- **Landing Page**: Serves as the main entry point for visitors
- **Navigation Bar**: Contains three primary sections:
  1. About Me
  2. Portfolio
  3. Contact

These sections are accessible through both scrolling and direct navigation bar clicks. While they appear on the landing page, they have distinct URLs:

- About Me: website.com (homepage/landing page)
- Portfolio: website.com/portfolio
- Contact: website.com/contact

### Portfolio Section

The Portfolio area will showcase three distinct categories:

1. Product Portfolio
2. Content Portfolio
3. Software Development Portfolio

Each category is presented as a card. Clicking on a card opens a new tab with the respective portfolio content:

- website.com/portfolio/product
- website.com/portfolio/content
- website.com/portfolio/software

### Admin Panel (CMS)

An administrative interface (accessible at website.com/admin) will be developed to manage website content. The admin panel includes:

#### Authentication & User Management
- Simple single-admin authentication system
- Fixed credentials:
  - Username: admin
  - Password: admin
- No email-based password reset
- Session management with "Remember Me" functionality
- Activity logging for admin actions

#### Content Management Features
- Adding new portfolio items
- Managing existing content
- Selecting the appropriate portfolio category
- Input fields for item details (title, description, image, link, categories, tags, etc.)
- Publish functionality to add items to the respective portfolio pages

### Individual Portfolio Pages

Each portfolio category (e.g., website.com/portfolio/product) will display items in two formats:

1. **Carousel**:
   - Wide format at the top of the page
   - Displays one project in the center, with partial views of adjacent projects
   - Auto-scrolls every two seconds

2. **Grid/List View**:
   - Located below the carousel
   - Allows users to toggle between grid and list layouts
   - Displays all projects published through the admin panel

This structure ensures a dynamic and engaging presentation of portfolio items while providing easy content management for the website owner.