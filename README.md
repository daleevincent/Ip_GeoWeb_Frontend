# IP Geolocation Project (React + Node.js)

**Overview**

This is a full-stack IP Geolocation Web App.

Backend: Node.js + Express + SQLite (JWT auth & IP history API)
Frontend: React + React Router + Axios + Leaflet (Map & IP info)
Features:
Login with seeded account
View your own IP geolocation
Search any IPv4 address and view geolocation
See a searchable history of IPs and pin locations on the map
Delete history items and click history to re-fetch

**Default Login Account**
Email: *test@example.com*
Password: *123456*


# Backend (API) Setup

**Repository:** ip-geo-api

1.git clone https://github.com/yourusername/ip-geo-api.git
*cd ip-geo-api*

2. Install dependencies: *npm install*

3. node src/seed.js
*This will create the users and ip_history tables and insert the default user.*

4. Start the server (development mode with auto-reload): *npm run dev*

5. Server runs on: http://localhost:8000
   

**API Endpoints:**

Endpoint	         Method	   Description
/api/login	         POST	   Login user, returns JWT token
/api/history	     GET	   Get user's search history
/api/history	     POST	   Add new IP to history
/api/history/:id	 DELETE	   Delete a history item


# Frontend (React Web App) Setup


**Repository:** ip-geo-web

1. Clone the repository: git clone https://github.com/yourusername/ip-geo-web.git
*cd ip-geo-web*

2. Install dependencies: *npm install*

3. Update backend URL if necessary in src/pages/Home.jsx (default is http://localhost:8000/api).

4. Start the app: *npm start*

5. App opens on: http://localhost:3000


**Node Version**

*v24.x (tested on Node.js 24.11.1)*


**Running the Full Project Locally**

1. Start the backend first (npm run dev in ip-geo-api).
2. Start the frontend next (npm start in ip-geo-web).
3. Login with the seeded user and test all features.

*Note: SQLite was used locally. For production deployment on Vercel Serverless, I switched to in-memory demo auth to comply with serverless constraints. Vercel only executes serverless functions under /api. Express apps must be exported and wrapped properly; traditional app.listen() won’t work in production.*
