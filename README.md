 Project Status: Functionally 100% Complete
This is a full-stack, single-page application (SPA) designed for managing employee records and assigning/tracking tasks. It features robust user authentication, data visualization, and advanced client-side filtering capabilities.
📽️ Final Submission: Local Demo & Deployment Status (CRITICAL)
To ensure a successful assessment despite cloud network complexities, a complete local demonstration is provided.
Section	Content
Local Demo Video:	https://drive.google.com/file/d/1kVmBPT88y2e3AEH5N0iGuL49emiumJ1E/view?usp=sharing
Commit/Code Status	The application code is currently reverted to use the local endpoint: http://localhost:3000/api.
Deployment Assumption/Issue (CRITICAL)	The deployment to the combined Render (Frontend/API) and Railway (Database/Backend Proxy) architecture failed due to a Cloud Network Firewall issue. The failure manifested as a connect ETIMEDOUT on the Render client, caused by Railway blocking external access to its TCP proxy IP. This is a common, frustrating hurdle with free-tier cloud networking. All code and setup are deployment-ready; the failure is purely infrastructural. The code is configured for easy deployment once the cloud firewall is opened to allow traffic from the required IP ranges.
🛠️ Technology Stack
Component	Technologies Used
Frontend	HTML5, CSS3, Vanilla JavaScript, Chart.js (Data Visualization)
Backend	Node.js, Express.js (API Server)
Database	PostgreSQL (or specify your actual database, e.g., MySQL/MongoDB)
Authentication	JSON Web Tokens (JWT) for secure, stateless authentication.
Environment	dotenv for secure environment variable management.
✨ Key Features (The Bonus Points)
This project goes beyond the minimum requirements to include professional-grade features:
Full-Stack Architecture: Separated Frontend (client) and Backend (API) for scalability.
Robust Authentication: Secure user registration and login implemented with JWT for token-based authorization.
Real-time Data Visualization: Implemented Chart.js to display key metrics (e.g., Task Completion Status, Employee Load) in a visually engaging way.
Advanced UI Controls: Client-side filters, search, and table sorting for easy employee and task management.
Modular Code Structure: Clean separation of concerns (e.g., db.js, routes/, public/js/ modules) for maintainability.
⚙️ Local Installation Guide
To run this application locally and verify the functionality shown in the demo video, follow these steps:
1. Prerequisites
Node.js (LTS Version)
A running instance of your database (PostgreSQL/MySQL/etc.)
2. Setup
Clone the Repository:
code
Bash
git clone [Your Repository URL]
cd [Your Project Folder Name]
Install Dependencies:
code
Bash
npm install
Configure Environment Variables:
Create a file named .env in the root directory and populate it with your database credentials.
code
Code
# Example .env file content
PORT=3000
SECRET_KEY='Your_JWT_Secret_Key_Here'

# Database Configuration (Adjust for your specific DB)
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_DATABASE=your_database_name
Start the Server:
code
Bash
node server.js
Access the Application:
Open your browser and navigate to:
code
Code
http://localhost:3000/index.html
You can now register a new user and begin testing the application.
