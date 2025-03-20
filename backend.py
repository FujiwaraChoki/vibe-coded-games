#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from pymongo import MongoClient
import os
import random
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB setup
mongodb_uri = os.environ.get('MONGODB_URI')
if not mongodb_uri:
    raise ValueError("MONGODB_URI environment variable not set")

client = MongoClient(mongodb_uri)
db = client.oceanGame

# In-memory state for active sessions
active_sessions = {}
connected_players = {}

# Utility functions
def generate_id():
    return str(uuid.uuid4())

def get_session_players(session_id):
    players = []
    for player_id, player in connected_players.items():
        if player.get('session_id') == session_id:
            players.append({
                'playerId': player_id,
                'name': player.get('name'),
                'position': player.get('position'),
                'rotation': player.get('rotation'),
                'score': player.get('score')
            })
    return players

def initialize_game_session(session_id):
    """Initialize a new game session with treasures, hazards, and weather"""
    session = active_sessions.get(session_id)
    if not session:
        return

    # Initialize weather
    weathers = ['calm', 'windy', 'foggy', 'stormy']
    session['weather'] = random.choice(weathers)
    session['last_weather_change'] = datetime.now()

    # Initialize treasures
    session['treasures'] = []
    for _ in range(10):
        spawn_new_treasure(session_id)

    # Initialize hazards
    session['hazards'] = []
    for _ in range(5):
        hazard = {
            'id': generate_id(),
            'type': 'rock' if random.random() > 0.5 else 'whirlpool',
            'position': {
                'x': (random.random() - 0.5) * 100,
                'y': 0,
                'z': (random.random() - 0.5) * 100
            },
            'radius': 2 + random.random() * 3,
            'damage': 10 + int(random.random() * 20)
        }
        session['hazards'].append(hazard)

    # Persist session to database
    persist_session(session_id)

def spawn_new_treasure(session_id):
    """Spawn a new treasure in the specified session"""
    session = active_sessions.get(session_id)
    if not session:
        return

    treasure_types = ['gold', 'gem', 'chest']
    treasure_type = random.choice(treasure_types)

    treasure = {
        'id': generate_id(),
        'type': treasure_type,
        'position': {
            'x': (random.random() - 0.5) * 100,
            'y': 0,
            'z': (random.random() - 0.5) * 100
        },
        'value': 10 if treasure_type == 'gold' else 25 if treasure_type == 'gem' else 50
    }

    session['treasures'].append(treasure)
    return treasure

def update_session_weather(session_id):
    """Update the weather for a game session"""
    session = active_sessions.get(session_id)
    if not session:
        return

    weathers = ['calm', 'windy', 'foggy', 'stormy']
    current_weather = session.get('weather')

    # Don't pick the same weather
    new_weather = current_weather
    while new_weather == current_weather:
        new_weather = random.choice(weathers)

    session['weather'] = new_weather
    session['last_weather_change'] = datetime.now()

    # Notify all players in the session
    socketio.emit('weather_changed', {'weather': new_weather}, to=session_id)

    # Persist to database
    persist_session(session_id)

def persist_player(player_id, player_name, session_id):
    """Save player info to database"""
    try:
        db.players.update_one(
            {'player_id': player_id},
            {'$set': {
                'name': player_name,
                'session_id': session_id,
                'last_active': datetime.now()
            }},
            upsert=True
        )
    except Exception as e:
        print(f"Error persisting player: {e}")

def persist_player_status(player_id):
    """Update player status in database"""
    player = connected_players.get(player_id)
    if not player:
        return

    try:
        db.players.update_one(
            {'player_id': player_id},
            {'$set': {
                'score': player.get('score', 0),
                'position': player.get('position'),
                'rotation': player.get('rotation'),
                'ship_damage': player.get('ship_damage', 0),
                'last_updated': datetime.now()
            }}
        )
    except Exception as e:
        print(f"Error persisting player status: {e}")

def persist_session(session_id):
    """Save session info to database"""
    session = active_sessions.get(session_id)
    if not session:
        return

    try:
        db.game_sessions.update_one(
            {'session_id': session_id},
            {'$set': {
                'weather': session.get('weather'),
                'treasures_count': len(session.get('treasures', [])),
                'hazards_count': len(session.get('hazards', [])),
                'players_count': len(session.get('players', [])),
                'last_updated': datetime.now()
            }},
            upsert=True
        )
    except Exception as e:
        print(f"Error persisting session: {e}")

def broadcast_high_scores(session_id):
    """Send top scores to all players in a session"""
    try:
        top_scores = list(db.players.find(
            {'session_id': session_id},
            {'_id': 0, 'player_id': 1, 'name': 1, 'score': 1}
        ).sort('score', -1).limit(5))

        socketio.emit('high_scores', {'scores': top_scores}, to=session_id)
    except Exception as e:
        print(f"Error broadcasting high scores: {e}")

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

    # Find player by socket id
    player_id = None
    session_id = None

    for pid, player in connected_players.items():
        if player.get('socket_id') == request.sid:
            player_id = pid
            session_id = player.get('session_id')
            break

    if player_id and session_id:
        # Remove from connected players
        player = connected_players.pop(player_id, None)

        # Remove from session
        session = active_sessions.get(session_id)
        if session and 'players' in session:
            if player_id in session['players']:
                session['players'].remove(player_id)

            # Notify other players
            socketio.emit('player_left', {'player_id': player_id}, to=session_id)

            # If session is empty, schedule for cleanup
            if not session['players']:
                # In a production environment, you would use a task queue for this
                # For now, we'll just mark it for cleanup
                session['pending_cleanup'] = True

        # Leave the room
        leave_room(session_id)

        # Save final state to database
        persist_player_status(player_id)
        persist_session(session_id)

@socketio.on('join_game')
def handle_join_game(data):
    player_id = data.get('player_id') or generate_id()
    player_name = data.get('player_name', 'Anonymous')
    session_id = data.get('session_id', 'default')

    # Join the room for this session
    join_room(session_id)

    # Create session if it doesn't exist
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            'players': [],
            'weather': 'calm',
            'treasures': [],
            'hazards': [],
            'created_at': datetime.now()
        }
        initialize_game_session(session_id)

    # Add player to session
    session = active_sessions[session_id]
    if player_id not in session['players']:
        session['players'].append(player_id)

    # Store player data
    connected_players[player_id] = {
        'socket_id': request.sid,
        'name': player_name,
        'session_id': session_id,
        'position': data.get('position', {'x': 0, 'y': 0.5, 'z': 0}),
        'rotation': data.get('rotation', {'y': 0}),
        'velocity': data.get('velocity', {'x': 0, 'z': 0}),
        'score': 0,
        'ship_damage': 0,
        'last_update': datetime.now()
    }

    # Save to database
    persist_player(player_id, player_name, session_id)

    # Send current game state
    emit('game_state', {
        'session_id': session_id,
        'player_id': player_id,
        'weather': session['weather'],
        'treasures': session['treasures'],
        'hazards': session['hazards'],
        'players': get_session_players(session_id)
    })

    # Notify other players
    emit('player_joined', {
        'player_id': player_id,
        'name': player_name,
        'position': connected_players[player_id]['position'],
        'rotation': connected_players[player_id]['rotation']
    }, to=session_id, include_self=False)

@socketio.on('player_update')
def handle_player_update(data):
    player_id = data.get('player_id')
    session_id = data.get('session_id')

    if not player_id or not session_id:
        return

    # Update player data
    player = connected_players.get(player_id)
    if player:
        player['position'] = data.get('position', player.get('position'))
        player['rotation'] = data.get('rotation', player.get('rotation'))
        player['velocity'] = data.get('velocity', player.get('velocity'))
        player['last_update'] = datetime.now()

        # Broadcast to other players
        emit('player_moved', {
            'player_id': player_id,
            'position': player['position'],
            'rotation': player['rotation'],
            'velocity': player['velocity']
        }, to=session_id, include_self=False)

@socketio.on('status_update')
def handle_status_update(data):
    player_id = data.get('player_id')
    session_id = data.get('session_id')

    if not player_id or not session_id:
        return

    # Update player status
    player = connected_players.get(player_id)
    if player:
        player['score'] = data.get('score', player.get('score', 0))
        player['ship_damage'] = data.get('ship_damage', player.get('ship_damage', 0))

        # Save to database
        persist_player_status(player_id)

        # Update high scores
        broadcast_high_scores(session_id)

@socketio.on('treasure_collected')
def handle_treasure_collected(data):
    player_id = data.get('player_id')
    session_id = data.get('session_id')
    treasure_id = data.get('treasure_id')

    if not player_id or not session_id or not treasure_id:
        return

    session = active_sessions.get(session_id)
    if not session:
        return

    # Find and remove the treasure
    for i, treasure in enumerate(session['treasures']):
        if treasure['id'] == treasure_id:
            session['treasures'].pop(i)

            # Award points to player
            player = connected_players.get(player_id)
            if player:
                player['score'] = player.get('score', 0) + treasure.get('value', 10)
                persist_player_status(player_id)

            # Spawn a new treasure
            new_treasure = spawn_new_treasure(session_id)

            # Notify all players
            emit('treasure_update', {
                'removed': [treasure_id],
                'added': [new_treasure]
            }, to=session_id)

            # Broadcast updated scores
            broadcast_high_scores(session_id)

            break

# REST API endpoints
@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Get list of active game sessions"""
    try:
        # Get sessions from the last 15 minutes
        fifteen_minutes_ago = datetime.now() - timedelta(minutes=15)

        sessions = list(db.game_sessions.find(
            {'last_updated': {'$gte': fifteen_minutes_ago}},
            {'_id': 0}
        ))

        return jsonify({
            'success': True,
            'data': sessions
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/players', methods=['GET'])
def get_players():
    """Get list of players in a session"""
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({
            'success': False,
            'error': 'Session ID is required'
        }), 400

    try:
        players = list(db.players.find(
            {'session_id': session_id},
            {'_id': 0}
        ))

        return jsonify({
            'success': True,
            'data': players
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/highscores', methods=['GET'])
def get_highscores():
    """Get top scores from all time or from a specific session"""
    session_id = request.args.get('session_id')
    limit = int(request.args.get('limit', 10))

    try:
        query = {}
        if session_id:
            query['session_id'] = session_id

        scores = list(db.players.find(
            query,
            {'_id': 0, 'player_id': 1, 'name': 1, 'score': 1, 'last_active': 1}
        ).sort('score', -1).limit(limit))

        return jsonify({
            'success': True,
            'data': scores
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Background task to update session weather and clean up
def background_tasks():
    """Periodic tasks to maintain game state"""
    while True:
        try:
            now = datetime.now()

            # Update weather for active sessions
            for session_id, session in list(active_sessions.items()):
                last_change = session.get('last_weather_change', datetime.now() - timedelta(minutes=10))
                time_diff = (now - last_change).total_seconds()

                # Change weather every 2-5 minutes
                if time_diff > random.randint(120, 300):
                    update_session_weather(session_id)

                # Clean up abandoned sessions (marked for cleanup for over 5 minutes)
                if session.get('pending_cleanup', False):
                    if (now - session.get('cleanup_marked_at', now)).total_seconds() > 300:
                        active_sessions.pop(session_id, None)
                        print(f"Cleaned up session {session_id}")

            # Clean up inactive players (no updates for over 1 minute)
            for player_id, player in list(connected_players.items()):
                last_update = player.get('last_update', now)
                if (now - last_update).total_seconds() > 60:
                    connected_players.pop(player_id, None)
                    print(f"Removed inactive player {player_id}")

            # Sleep for 30 seconds before next check
            socketio.sleep(30)

        except Exception as e:
            print(f"Error in background task: {e}")
            socketio.sleep(10)

if __name__ == '__main__':
    # Start background task
    socketio.start_background_task(background_tasks)

    # Start server
    port = int(os.environ.get('PORT', 6767))
    socketio.run(app, host='0.0.0.0', port=port)
