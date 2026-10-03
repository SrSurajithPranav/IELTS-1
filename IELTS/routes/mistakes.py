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


def _upsert(uid, item):
    text = (item.get('error_text') or '').strip()[:500]
    if not text:
        return None
    existing = Mistake.query.filter_by(user_id=uid, error_text=text).first()
    if existing:
        existing.frequency = (existing.frequency or 0) + 1
        if item.get('suggestion'):
            existing.suggestion = item['suggestion'][:500]
        return existing
    m = Mistake(user_id=uid, error_text=text, category=item.get('category', 'general'),
                suggestion=(item.get('suggestion') or None))
    db.session.add(m)
    return m


@mistakes_bp.route('/', methods=['POST'])
@jwt_required()
def add_mistake():
    """Accepts one mistake {error_text, category, suggestion} or {items: [...]}."""
    uid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    items = data['items'] if isinstance(data.get('items'), list) else [data]
    saved = [m for m in (_upsert(uid, i if isinstance(i, dict) else {'error_text': str(i)}) for i in items[:50]) if m]
    db.session.commit()
    return jsonify([m.to_dict() for m in saved]), 201


@mistakes_bp.route('/<int:mistake_id>', methods=['DELETE'])
@jwt_required()
def delete_mistake(mistake_id):
    uid = int(get_jwt_identity())
    m = Mistake.query.filter_by(id=mistake_id, user_id=uid).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return jsonify({'message': 'Cleared'})
