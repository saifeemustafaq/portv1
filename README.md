# Portfolio Admin Dashboard

A Next.js-based admin dashboard for managing portfolio projects and content.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Azure Storage Account (for image handling)
- npm or yarn

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd portfolio-admin
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name

# Admin Account (for initial setup)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

### 4. Database Initialization

Run the following scripts to initialize the database:

```bash
# Initialize admin account
npm run init-admin

# Initialize project categories
npm run init-categories
```

### 5. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 6. Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/            # API routes
│   ├── components/     # Shared components
│   ├── config/        # Configuration files
│   ├── lib/           # Library code
│   └── utils/         # Utility functions
├── public/            # Static assets
├── types/            # TypeScript type definitions
└── scripts/          # Setup and migration scripts
```

## Features

- 🔐 Secure authentication system
- 📁 Project management by categories
- 🖼️ Image upload and processing
- 📊 Dashboard analytics
- 🎨 Category customization
- 📝 Content management
- 🔍 Log monitoring
- 🔒 Password management

## API Routes

- `/api/admin/project` - Project CRUD operations
- `/api/admin/basic-info` - Manage basic information
- `/api/admin/settings/categories` - Category management
- `/api/admin/dashboard/stats` - Dashboard statistics

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run init-admin   # Initialize admin account
npm run init-categories # Initialize project categories
```

## Technology Stack

- Next.js 15.1.6
- React 19.0.0
- MongoDB with Mongoose
- NextAuth.js for authentication
- Azure Storage for image handling
- TypeScript
- Tailwind CSS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [your-email@example.com](mailto:your-email@example.com)
