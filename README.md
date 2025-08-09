# Auto Repair Shop Application

This is a full-stack web application for managing an auto repair shop. It features a React front-end and a Node.js/Express back-end with a SQLite database.

## Prerequisites

- Node.js
- An account on [Render](https://render.com/) for the backend.
- An account on [Netlify](https://www.netlify.com/) for the frontend.

---

## Deployment

This application is designed to be deployed as two separate services: a backend on Render and a frontend on Netlify.

### 1. Backend Deployment (Render)

1.  **Fork this Repository:** Fork this project to your own GitHub account.
2.  **Create a New Web Service on Render:**
    *   Connect your GitHub account to Render.
    *   Select your forked repository.
    *   Configure the service with the following settings:
        *   **Environment:** `Node`
        *   **Root Directory:** `server`
        *   **Build Command:** `npm install && npm run build`
        *   **Start Command:** `npm start`
3.  **Add a Persistent Disk:**
    *   Go to the "Disks" section of your new Render service.
    *   Click "Add Disk".
    *   **Name:** `database`
    *   **Mount Path:** `/data/db`
    *   **Size:** `1 GB` (or as needed)
    *   Click "Save". This ensures your SQLite database is not lost on deploys.
4.  **Add Environment Variables:**
    *   Go to the "Environment" section for your service.
    *   Add the following secret files and environment variables:
        *   **`API_KEY`**: Your Google Gemini API key.
        *   **`CLIENT_ORIGIN`**: The full URL of your **Netlify frontend site** (e.g., `https://your-app-name.netlify.app`). This is crucial for security (CORS).
        *   **`RENDER_DISK_PATH`**: Set this to the disk mount path from the previous step: `/data/db`.

5.  **Deploy:** Trigger a manual deploy from the Render dashboard. Once complete, copy your backend URL (e.g., `https://your-backend.onrender.com`).

### 2. Frontend Deployment (Netlify)

1.  **Update Backend URL:**
    *   In your forked repository, open the `netlify.toml` file in the root directory.
    *   Change the placeholder URL `https://your-backend.onrender.com` to your actual Render backend URL from the previous step.
    *   Commit and push this change to your repository.

2.  **Create a New Site on Netlify:**
    *   Connect your GitHub account and select your forked repository.
    *   Configure the site with the following settings:
        *   **Base directory:** `client`
        *   **Build command:** `npm run build`
        *   **Publish directory:** `client/dist`

3.  **Deploy:** Click "Deploy site". Netlify will build and deploy your frontend. The `netlify.toml` file will automatically configure the API proxy.

Your full-stack application should now be live!

---

## Local Development

You can also run the client and server separately for local development.

### Running the Server

1.  Navigate to the `server/` directory: `cd server`
2.  Create a `.env` file and add your `API_KEY`.
3.  Install dependencies: `npm install`
4.  Start the server: `npm run dev`
5.  The server will be running on `http://localhost:3001`.

### Running the Client

1.  In a **separate terminal**, navigate to the `client/` directory: `cd client`
2.  Install dependencies: `npm install`
3.  Start the client development server: `npm run dev`
4.  The client application will be available at `http://localhost:5173`. Vite is configured to proxy API requests to the server on port 3001.
