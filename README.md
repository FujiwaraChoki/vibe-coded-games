> i did not write a single line of code, so every bug is cursors' fault.

# Ocean Game - Multiplayer Edition

An ocean exploration game with multiplayer support and MongoDB integration.

## Features

- Real-time multiplayer ocean exploration
- Treasure hunting and collection with score tracking
- Dynamic weather system that affects gameplay
- Fishing mini-game with various fish types
- Persistent player data and high scores
- Customizable player names and session support

## Setup

### 1. Install dependencies

For the web app:

```bash
npm install
```

For the Python backend:

```bash
pip install -r requirements.txt
```

### 2. Configure MongoDB

Create a `.env.local` file in the root directory with your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/oceanGame
NEXT_PUBLIC_GAME_SERVER=http://localhost:6767
```

Replace the MongoDB URI with your own connection string if you're using a remote database.

### 3. Start the Python backend

```bash
python backend.py
```

The server will start on port 5000 by default. You can change this by setting the `PORT` environment variable.

### 4. Start the web app

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Playing the Game

1. Choose "Multiplayer" on the start screen
2. Enter your name and optionally a session ID to play with friends
3. Explore the ocean, collect treasures, and compete for high scores
4. Use WASD or arrow keys to move your ship
5. Press F to fish at fishing spots
6. View other players' ships and compete for the highest score

## Controls

- W/S or Arrow Up/Down: Move forward/backward
- A/D or Arrow Left/Right: Turn left/right
- Space: Speed boost
- F: Fish (when near fishing spots)
- Escape: Pause/Unpause

## Development

### Project Structure

- `app/` - Next.js web application
  - `components/game/` - Game components and logic
  - `lib/` - Utility functions and services
- `backend.py` - Python WebSocket server for multiplayer
- `.env.local` - Environment configuration

### Technologies Used

- Next.js and React for the frontend
- Three.js for 3D rendering
- Socket.io for real-time communication
- Flask for the Python backend API
- MongoDB for data persistence

## Deploy to Production

For production deployment, you'll need:

1. A MongoDB database (Atlas or self-hosted)
2. A server to host the Python backend
3. A platform for the Next.js frontend (Vercel, Netlify, etc.)

Update the environment variables to point to your production services.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
