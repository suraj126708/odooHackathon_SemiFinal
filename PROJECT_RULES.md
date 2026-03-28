# StackIt - Auth Starter

A minimal auth starter built for hackathons: register, login, JWT-protected profile, and logout.

## Features

- 🔐 User Authentication (JWT)
- 📝 Register + Login UI
- 🔒 Protected Profile page (`GET /api/auth/profile`)
- 🧾 Update profile + logout endpoints (JWT protected)
- 🎨 UI built with TailwindCSS + shadcn/ui `Button`
- 📱 Responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 2. Set Up Environment

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/odoo-hackathon
JWT_SECRET=your-secret-key-here
PORT=8080
```

### 3. (Optional) Seed Demo Users

```bash
# Creates demo + admin users
npm run seed
```

This creates:
- `demo@gmail.com` / `demo123`
- `admin@gmail.com` / `admin123`

### 4. Start the Application

```bash
# Start both server and client simultaneously
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/ping

## Screenshots & Demo
This repo was pruned to an auth-only starter. The original Q&A screenshots/video were removed.

Run the app to see the auth UI locally:
```bash
npm run dev
```

## Project Structure (Auth Only)

```
OdooHackathon/
├── client/                 # React frontend
│   ├── src/
│   │   ├── Pages/         # `Login.jsx`, `Register.jsx`, `ProfilePage.jsx`
│   │   └── Authorisation/ # Auth context & axios config
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # `AuthController.js`
│   ├── models/            # `User.js`
│   ├── routes/           # `AuthRouter.js`
│   └── middlewares/      # `Auth.js`, `AuthMiddleware.js`
│   └── package.json
└── package.json          # Root package.json
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

- `GET /api/auth/verify` - Verify JWT token (protected)

## UI Stack

- TailwindCSS for layout/spacing
- shadcn/ui for prebuilt components (currently `Button`)

## Development

### Adding New Features

1. **Backend**: Add routes in `server/routes/`, controllers in `server/controllers/`
2. **Frontend**: Add components in `client/src/components/`, pages in `client/src/Pages/`
3. **Database**: Add models in `server/models/`

### Database Seeding

```bash
# Seed the database with sample data
npm run seed
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT in server/.env
2. **MongoDB connection failed**: Check your MongoDB connection string
3. **CORS errors**: Ensure the server is running on the correct port
4. **JWT/auth issues**: Ensure `JWT_SECRET` is set correctly in `server/.env`

### Logs

- **Server logs**: Check terminal running the server
- **Client logs**: Check browser console (F12)
- **Database logs**: Check MongoDB logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
