# SECPLAN Project Manager

A full-stack web application for project management.

## Technologies Used

### Backend

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **Prisma:** Next-generation ORM for Node.js and TypeScript.
*   **PostgreSQL:** Relational database.
*   **TypeScript:** Superset of JavaScript that adds static typing.
*   **Socket.IO:** For real-time communication (e.g., chat, notifications).
*   **Zod:** TypeScript-first schema validation.

### Frontend

*   **React:** JavaScript library for building user interfaces.
*   **Vite:** Next-generation frontend tooling.
*   **TypeScript:** Superset of JavaScript that adds static typing.
*   **Material UI (MUI):** React UI framework for faster and simpler web development.
*   **Zustand:** Small, fast and scalable bearbones state-management solution.
*   **React Hook Form:** Performant, flexible and extensible forms with easy-to-use validation.
*   **Tiptap:** Headless wrapper around ProseMirror for WYSIWYG editor.
*   **Leaflet:** An open-source JavaScript library for mobile-friendly interactive maps.
*   **Recharts:** A composable charting library built on React components.

## Features

*   **User Authentication:** Secure user login and registration.
*   **Project Management:**
    *   Create, read, update, and delete projects.
    *   Associate projects with geographical locations using an interactive map.
    *   Upload and display project images in a slider.
    *   Track project details like status, unit, typologies, sector, and financial information.
*   **Task Management:**
    *   Create, read, update, and delete tasks within projects.
    *   Assign tasks to users and set priorities and due dates.
    *   Visualize tasks using:
        *   List view
        *   Kanban board
        *   Calendar view
*   **Real-time Collaboration:**
    *   In-task chat functionality for seamless communication.
    *   User mentions in comments and descriptions.
*   **Notifications:**
    *   In-app notifications for important events (new tasks, messages, mentions, status changes).
*   **Dashboard & Statistics:**
    *   Visual overview of project and task data through various charts (e.g., projects by type, funding line, sector; tasks per user).
    *   Filterable dashboard views.
*   **Rich Text Editing:**
    *   WYSIWYG editor for detailed descriptions and chat messages.
*   **Administration Panel:**
    *   User management (activate/deactivate users, assign roles).
    *   Management of lookup tables (e.g., project statuses, task priorities, typologies).
    *   Tag management.
*   **Role-Based Access Control:** Different levels of access and functionality for Admins, Coordinators, and Users.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm (comes with Node.js)
*   PostgreSQL server running

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd secplan-project-manager # Or your project's root directory name
    ```

2.  **Backend Setup:**
    *   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file by copying the example:
        ```bash
        cp .env.example .env
        ```
    *   Update the `.env` file with your database connection string and other environment variables:
        ```
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
        JWT_SECRET="your_jwt_secret"
        # Add other variables as needed, like API keys if any
        ```
    *   Run database migrations:
        ```bash
        npx prisma migrate dev
        ```
    *   (Optional) Seed the database with initial data:
        ```bash
        npm run seed
        ```
    *   Start the backend development server:
        ```bash
        npm run dev
        ```
        The backend server should now be running on the port specified in your `backend/.env` file (defaults to `http://localhost:5000` as per `.env.example`).

3.  **Frontend Setup:**
    *   Open a new terminal and navigate to the frontend directory:
        ```bash
        cd frontend
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   **Connecting to the Backend:**
        *   The frontend expects the backend to be available. By default, it will try to proxy requests starting with `/api` to `http://localhost:5000` (as configured in `vite.config.js` and matching the backend's default port). This is suitable for most local development setups.
        *   Alternatively, you can create a `.env` file in the `frontend` directory (e.g., `frontend/.env`) and set the `VITE_API_BASE_URL` variable to the full base URL of your backend API if it's running elsewhere or you don't want to use the proxy. For example:
            ```
            VITE_API_BASE_URL=http://localhost:5000/api
            ```
            If you set this variable, ensure it points to the correct backend URL and includes the `/api` prefix if your backend routes are structured that way. If `VITE_API_BASE_URL` is set, the Vite proxy for `/api` might not be used for these calls, depending on the exact value. For simplicity, relying on the default proxy is recommended for local development.
    *   Start the frontend development server:
        ```bash
        npm run dev
        ```
        The frontend application should now be accessible (typically on `http://localhost:5173` or another port shown in the terminal).

## Project Structure

The project is organized into two main directories:

*   `backend/`: Contains the Node.js, Express.js, and Prisma backend application.
    *   `prisma/`: Prisma schema, migrations, and seed scripts.
    *   `src/`: Source code for the backend.
        *   `api/`: Route definitions for different resources.
        *   `config/`: Configuration files (e.g., Prisma client, environment variables).
        *   `controllers/`: Request handlers that interact with services.
        *   `middlewares/`: Custom Express middlewares (e.g., authentication, validation).
        *   `schemas/`: Zod schemas for request validation.
        *   `services/`: Business logic and interaction with the database.
        *   `socketManager.ts`: Socket.IO connection and event management.
        *   `server.ts`: Main Express server setup and startup.
*   `frontend/`: Contains the React (with Vite) frontend application.
    *   `public/`: Static assets.
    *   `src/`: Source code for the frontend.
        *   `api/`: Functions for making API calls to the backend (deprecated or specific, main is `services/apiService.ts`).
        *   `components/`: Reusable React components.
        *   `context/`: React context providers.
        *   `hooks/`: Custom React hooks.
        *   `pages/`: Top-level page components.
        *   `routes/`: Application routing setup.
        *   `schemas/`: Zod schemas for form validation.
        *   `services/`: API service (`apiService.ts`) and other client-side services.
        *   `store/`: Zustand state management stores.
        *   `theme/`: MUI theme configuration.
        *   `App.tsx`: Main application component.
        *   `main.tsx`: Entry point for the React application.
*   `create_structure.sh`: A shell script used for initial project scaffolding. It creates the main directory layout and placeholder files for both frontend and backend.

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these general guidelines:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    ```
    or
    ```bash
    git checkout -b fix/your-bug-fix-name
    ```
3.  **Make your changes.** Ensure your code follows the existing project style and conventions.
4.  **Test your changes thoroughly.**
5.  **Commit your changes** with a clear and descriptive commit message.
6.  **Push your branch** to your forked repository.
7.  **Open a pull request** to the main repository, detailing the changes you've made.

Please ensure your pull request describes the problem and solution, and any relevant issue numbers.

## License

This project is licensed under the ISC License. See the `LICENSE` file for more details (if one exists), or refer to the [ISC License details](https://opensource.org/licenses/ISC).
