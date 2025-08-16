# Workcity Chat Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)](https://www.mongodb.com/)

A real-time chat backend system for eCommerce platforms, enabling communication between customers, support agents, designers, and merchants.

## Features

- **Real-time messaging** using Socket.IO
- **JWT authentication** with role-based access control
- **Multiple user roles**: admin, agent, customer, designer, merchant
- **Conversation management** with read/unread status
- **File attachments** support (images, documents)
- **Typing indicators** and online status
- **Email notifications** for new messages
- **Admin dashboard** with usage statistics
- **RESTful API** endpoints for all operations

## Tech Stack

**Backend:**

- Node.js
- Express.js
- MongoDB (with Mongoose)
- Socket.IO

**Security:**

- JWT authentication
- Rate limiting
- CORS protection
- Data sanitization

**Utilities:**

- Nodemailer (email notifications)
- Web Push (browser notifications)
- File upload handling

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/workcity-chat-backend.git
   cd workcity-chat-backend

   ```

2. ```bash
   npm Install

   ```

3. **Set up environment variables**

   ```.env
   -PORT=9000
   -DATABASE=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   -JWT_SECRET=your_jwt_secret_here
   -JWT_EXPIRES_IN=90d
   -EMAIL_USER=your_email@gmail.com
   -EMAIL_PASS=your_email_password
   -CLIENT_URL=http://localhost:3000
   -VAPID_PUBLIC_KEY=your_public_key
   -VAPID_PRIVATE_KEY=your_private_key

   ```

4. **Run applicetion**
   ```bash
   ## for development
   -npm run dev
   ## for production
   -npm start
   ```

##Challenges and Solutions
**Real-time Synchronization**
-Challenge: Keeping all conversation participants in sync
-Solution: Implemented Socket.IO rooms for each conversation

**File Uploads**
-Challenge: Secure handling of file attachments
-Solution: Used express-fileupload with size limits and proper storage

**Scalability**
-Challenge: Handling growing number of users and messages
-Solution: Optimized queries with pagination and lean documents

**Notifications**
-Challenge: Implementing multiple notification types
-Solution: Created modular notification system supporting both email and push

**Deployment**
-Render
