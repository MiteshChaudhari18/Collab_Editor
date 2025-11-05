# 🚀 Collaborative Code Editor

A real-time collaborative code editor built with React, Node.js, MongoDB, and Yjs. Multiple users can edit code together in real-time with live cursor positions and synchronized changes.

## ✨ Features

- 🔐 **Authentication**: Secure JWT-based user authentication
- 🏠 **Room Management**: Create, manage, and delete coding rooms
- 👥 **Real-Time Collaboration**: Live synchronized editing using Yjs CRDT
- 💻 **Monaco Editor**: VS Code-like editor with syntax highlighting
- 📧 **Email Invitations**: Invite collaborators via email with magic links
- 🎨 **Beautiful UI**: Modern, responsive interface built with Tailwind CSS
- 🔄 **Persistence**: Room content persists across sessions
- 🌐 **Multi-Language**: Support for JavaScript, Python, Java, C++, HTML, CSS, TypeScript

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Monaco Editor** - Code editor (VS Code editor)
- **Yjs** - CRDT for real-time collaboration
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing

### Backend
- **Node.js + Express** - REST API server
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email invitations

### Real-Time
- **Y-WebSocket** - WebSocket server for Yjs synchronization
- **Y-Monaco** - Monaco Editor bindings for Yjs

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd collab-editor
```

### Step 2: Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/collab
JWT_SECRET=your_super_secret_jwt_key_here
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

**Note**: For Gmail, you need to generate an [App Password](https://support.google.com/accounts/answer/185833).

### Step 3: Y-WebSocket Server Setup

```bash
cd ../y-websocket-server
npm install
```

### Step 4: Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_WS_URL=ws://localhost:1234
```

## 🚀 Running the Application

### Option 1: Run Everything Manually

**Terminal 1 - MongoDB** (if using local MongoDB):
```bash
mongod
```

**Terminal 2 - Backend Server**:
```bash
cd server
npm start
```

**Terminal 3 - Y-WebSocket Server**:
```bash
cd y-websocket-server
npm start
```

**Terminal 4 - Frontend**:
```bash
cd client
npm start
```

### Option 2: Docker Compose (Recommended)

```bash
# Create .env file with all required variables
# Then run:
docker-compose up --build
```

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Y-WebSocket: ws://localhost:1234

## 📝 Usage

### 1. Create an Account
- Navigate to the app
- Click "Sign up" and create your account

### 2. Create a Room
- Click "Create Room"
- Enter a room name and select a language
- Click "Create"

### 3. Invite Collaborators
- Open a room
- Click "Invite by Email"
- Enter the collaborator's email
- They'll receive an email with a join link

### 4. Collaborate
- Share the room link or invite via email
- Multiple users can edit simultaneously
- See live cursors and changes from other users

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**:
   - Register a new user
   - Login with credentials
   - Verify JWT token is stored

2. **Room Creation**:
   - Create a new room
   - Verify room appears in room list
   - Open the room and verify editor loads

3. **Real-Time Collaboration**:
   - Open the same room in two browser windows
   - Type in one window
   - Verify changes appear in the other window instantly

4. **Email Invitation**:
   - Create a room
   - Click "Invite by Email"
   - Enter a valid email
   - Check email inbox for invitation
   - Click link and verify room access

5. **Persistence**:
   - Write code in a room
   - Close browser and restart server
   - Reopen room
   - Verify code is still there

## 🌐 Deployment

See **[DEPLOY.md](./DEPLOY.md)** for complete deployment instructions including:
- Vercel frontend deployment
- Backend API deployment (Render/Railway)
- WebSocket server deployment (Railway/Fly.io)
- MongoDB Atlas setup
- Environment variable configuration

## 📁 Project Structure

```
collab-editor/
├── server/                 # Express backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utilities (auth, mail)
│   ├── server.js          # Main server file
│   └── package.json
├── y-websocket-server/    # Yjs WebSocket server
│   ├── index.js           # WebSocket server
│   ├── persistence/       # Persisted documents
│   └── package.json
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.js         # API client
│   │   ├── App.jsx        # Main app component
│   │   └── styles.css     # Tailwind imports
│   └── package.json
├── docker-compose.yml     # Docker configuration
└── README.md
```

## 🔧 Configuration

### Email Setup (Gmail)

**For Gmail, you need to generate an App Password:**

1. Enable 2-Step Verification at [Google Account Security](https://myaccount.google.com/security)
2. Generate App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)" → Enter "Collab Editor"
   - Copy the 16-character password (no spaces)
   - Use this password in `MAIL_PASS` in `server/.env`
3. In `server/.env`, also add:
   ```env
   MAIL_SERVICE=gmail
   ```

### MongoDB Connection

- **Local**: `mongodb://localhost:27017/collab`
- **Atlas**: `mongodb+srv://user:password@cluster.mongodb.net/collab`

## 🐛 Troubleshooting

### Email Not Sending
- Verify Gmail App Password is correct
- Check `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`
- Verify less secure apps are enabled (if required)

### WebSocket Connection Failed
- Ensure Y-WebSocket server is running
- Check `REACT_APP_WS_URL` matches server URL
- Verify CORS settings

### Real-Time Sync Not Working
- Check browser console for errors
- Verify Yjs provider is connected
- Ensure both users are in the same room

### MongoDB Connection Error
- Verify MongoDB is running
- Check `MONGO_URI` is correct
- For Atlas, whitelist your IP address

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - Get all rooms (auth required)
- `GET /api/rooms/:id` - Get single room
- `POST /api/rooms` - Create room (auth required)
- `PUT /api/rooms/:id` - Update room (owner only)
- `DELETE /api/rooms/:id` - Delete room (owner only)

### Invites
- `POST /api/invites` - Create invite (auth required)
- `GET /api/invites/:token` - Get invite details
- `POST /api/invites/:token/accept` - Accept invite (auth required)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Yjs](https://github.com/yjs/yjs) - CRDT implementation
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for collaborative coding**

