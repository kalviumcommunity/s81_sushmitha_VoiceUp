# VoiceUp Platform Setup Instructions

## Quick Start

### Backend Setup
1. Navigate to Backend folder: `cd Backend`
2. Install dependencies: `npm install`
3. Update MongoDB URL in `.env` file if needed
4. Start server: `npm start`
   - Server will run on port 8080
   - Database connection issues are handled gracefully

### Frontend Setup
1. Navigate to Frontend folder: `cd Frontend/vite-project`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
   - Frontend will run on port 3000

## Current Status
- ✅ Backend API routes implemented (auth, petitions, events)
- ✅ Frontend React components complete
- ✅ Real-time WebSocket support
- ⚠️ Database connection needs working MongoDB URL
- ⚠️ Campaigns route temporarily disabled

## Features Implemented
- User authentication with JWT
- Petition management system
- Event management with capacity tracking
- Real-time updates via WebSocket
- Role-based access control
- Rate limiting and security middleware

## Database
- Update `Backend/.env` with working MongoDB connection string
- Current URL may have connection timeout issues
- Server starts without database for API testing

## Ports
- Backend: 8080
- Frontend: 3000
- WebSocket: Same as backend port

## Next Steps
1. Fix MongoDB connection
2. Enable campaigns route
3. Test full application flow