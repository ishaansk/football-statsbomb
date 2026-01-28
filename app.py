from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from statsbombpy import sb
import pandas as pd
import os

app = Flask(__name__, static_folder='.')
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/api/competitions', methods=['GET'])
def get_competitions():
    try:
        comps = sb.competitions()
        return Response(comps.to_json(orient='records'), mimetype='application/json')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/matches/<int:competition_id>/<int:season_id>', methods=['GET'])
def get_matches(competition_id, season_id):
    try:
        matches = sb.matches(competition_id=competition_id, season_id=season_id)
        return Response(matches.to_json(orient='records'), mimetype='application/json')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/events/<int:match_id>', methods=['GET'])
def get_events(match_id):
    try:
        events = sb.events(match_id=match_id)
        return Response(events.to_json(orient='records'), mimetype='application/json')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
