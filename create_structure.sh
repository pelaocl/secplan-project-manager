#!/bin/bash

echo "Creating SECPLAN Project Manager directory structure..."
echo "Current directory: $(pwd)"

# --- Backend Structure ---
echo "--> Creating backend directories..."
mkdir -p backend/prisma/migrations
mkdir -p backend/src/api
mkdir -p backend/src/controllers
mkdir -p backend/src/services
mkdir -p backend/src/middlewares
mkdir -p backend/src/schemas
mkdir -p backend/src/utils
mkdir -p backend/src/config
mkdir -p backend/src/types

# --- Frontend Structure ---
echo "--> Creating frontend directories..."
mkdir -p frontend/public
mkdir -p frontend/src/assets
mkdir -p frontend/src/components/common
mkdir -p frontend/src/components/layout
mkdir -p frontend/src/hooks
mkdir -p frontend/src/pages
mkdir -p frontend/src/routes
mkdir -p frontend/src/schemas
mkdir -p frontend/src/services
mkdir -p frontend/src/store
mkdir -p frontend/src/theme
mkdir -p frontend/src/types

# --- Create Placeholder Files ---
echo "--> Creating placeholder configuration and key files..."

# Backend Files
touch backend/.env
touch backend/.env.example
touch backend/.gitignore
touch backend/package.json
touch backend/tsconfig.json
touch backend/prisma/schema.prisma
touch backend/prisma/seed.ts
touch backend/src/server.ts
touch backend/src/config/prismaClient.ts
touch backend/src/config/env.ts
touch backend/src/types/express.d.ts
touch backend/src/api/authRoutes.ts
touch backend/src/api/projectRoutes.ts
touch backend/src/api/lookupRoutes.ts
touch backend/src/api/adminRoutes.ts
touch backend/src/controllers/authController.ts
touch backend/src/controllers/projectController.ts
touch backend/src/controllers/lookupController.ts
touch backend/src/controllers/adminController.ts
touch backend/src/services/authService.ts
touch backend/src/services/projectService.ts
touch backend/src/services/lookupService.ts
touch backend/src/services/adminService.ts
touch backend/src/middlewares/authMiddleware.ts
touch backend/src/middlewares/roleMiddleware.ts
touch backend/src/middlewares/validationMiddleware.ts
touch backend/src/schemas/authSchemas.ts
touch backend/src/schemas/projectSchemas.ts
touch backend/src/schemas/adminSchemas.ts
touch backend/src/utils/jwtHelper.ts
touch backend/src/utils/passwordHelper.ts
touch backend/src/utils/errors.ts

# Frontend Files
touch frontend/.env
touch frontend/.env.example
touch frontend/.gitignore
touch frontend/index.html
touch frontend/package.json
touch frontend/tsconfig.json
touch frontend/tsconfig.node.json
touch frontend/vite.config.ts
touch frontend/src/main.tsx
touch frontend/src/App.tsx
touch frontend/src/vite-env.d.ts
touch frontend/src/index.css
touch frontend/src/components/ProtectedRoute.tsx
touch frontend/src/components/ProjectForm.tsx
touch frontend/src/components/ProjectListTable.tsx
touch frontend/src/components/ProjectDetailView.tsx
touch frontend/src/components/ProjectMap.tsx
touch frontend/src/components/layout/TopAppBar.tsx
touch frontend/src/hooks/useAuth.ts
touch frontend/src/pages/LoginPage.tsx
touch frontend/src/pages/ProjectListPage.tsx
touch frontend/src/pages/ProjectDetailPage.tsx
touch frontend/src/pages/ProjectCreatePage.tsx
touch frontend/src/pages/ProjectEditPage.tsx
touch frontend/src/pages/AdminUsersPage.tsx
touch frontend/src/pages/AdminTagsPage.tsx
touch frontend/src/pages/AdminLookupsPage.tsx
touch frontend/src/pages/DashboardPage.tsx
touch frontend/src/pages/NotFoundPage.tsx
touch frontend/src/routes/AppRoutes.tsx
touch frontend/src/schemas/authSchemas.ts
touch frontend/src/schemas/projectFormSchema.ts
touch frontend/src/services/apiService.ts
touch frontend/src/services/authApi.ts
touch frontend/src/services/projectApi.ts
touch frontend/src/services/lookupApi.ts
touch frontend/src/store/authStore.ts
touch frontend/src/theme/theme.ts
touch frontend/src/types/index.ts
touch frontend/public/favicon.ico # Placeholder, replace with actual icon

echo ""
echo "------------------------------------"
echo "Directory structure created successfully!"
echo "Location: $(pwd)"
echo ""
echo "Next steps suggested:"
echo "1. Populate the created files with the provided code snippets."
echo "2. Fill in your .env files in backend/ and frontend/ (using .env.example)."
echo "3. Run 'npm install' (or yarn) in both ./backend and ./frontend directories."
echo "4. Ensure PostgreSQL is running and configure your database connection."
echo "5. Navigate to ./backend and run:"
echo "   - npx prisma migrate dev --name init"
echo "   - npx prisma db seed"
echo "6. Start backend and frontend servers (e.g., 'npm run dev' in each directory)."
echo "------------------------------------"

exit 0