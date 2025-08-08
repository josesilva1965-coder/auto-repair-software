# Auto Repair Shop Application

This is a full-stack web application for managing an auto repair shop. It features a React front-end and a Node.js/Express back-end with a SQLite database.

## Prerequisites

- Node.js (for local development without Docker)
- Docker and Docker Compose (recommended for both development and deployment)

## Running the Application with Docker (Recommended)

This is the simplest way to get the entire application (client and server) running.

1.  **Set API Key:**
    -   In the `server/` directory, create a file named `.env`.
    -   Add your Gemini API key to this file:
        ```
        GEMINI_API_KEY=YOUR_KEY_HERE
        ```

2.  **Build and Run:**
    -   From the project's root directory, run the following command:
        ```bash
        docker-compose up --build -d
        ```
    -   The application will be available at `http://localhost:80`.

3.  **To Stop:**
    -   Run `docker-compose down`.

## Running Locally Without Docker

You can also run the client and server separately.

### Running the Server

1.  Navigate to the `server/` directory: `cd server`
2.  Install dependencies: `npm install`
3.  Set your API key in `server/.env` as described above.
4.  Start the server: `npm run dev`
5.  The server will be running on `http://localhost:3001`.

### Running the Client

1.  In a **separate terminal**, navigate to the `client/` directory: `cd client`
2.  Install dependencies: `npm install`
3.  Start the client development server: `npm run dev`
4.  The client application will be available at `http://localhost:5173`. Vite is configured to proxy API requests to the server on port 3001.
