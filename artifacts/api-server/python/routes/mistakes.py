from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.mistake import Mistake

mistakes_bp = Blueprint('mistakes', __name__, url_prefix='/api/mistakes')


@mistakes_bp.route('/', methods=['GET'])
@jwt_required()
def list_mistakes():
    uid = int(get_jwt_identity())
    rows = Mistake.query.filter_by(user_id=uid).order_by(Mistake.frequency.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@mistakes_bp.route('/', methods=['POST'])
@jwt_required()
def add_mistake():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    error_text = str(data.get('error_text') or '').strip()
    category = str(data.get('category') or 'general').strip().lower()
    if not error_text:
        return jsonify({'error': 'error_text is required'}), 400
    if len(error_text) > 500:
        return jsonify({'error': 'error_text must be 500 characters or fewer'}), 400
    if len(category) > 50:
        return jsonify({'error': 'category must be 50 characters or fewer'}), 400

    existing = Mistake.query.filter_by(user_id=uid, error_text=error_text).first()
    if existing:
        existing.frequency = (existing.frequency or 0) + 1
        db.session.commit()
        return jsonify(existing.to_dict()), 200
    m = Mistake(user_id=uid, error_text=error_text, category=category)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201
