from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import db
from models.announcement import Announcement
from utils.auth_helpers import current_user, is_staff
from datetime import datetime

announcements_bp = Blueprint('announcements', __name__, url_prefix='/api/announcements')


@announcements_bp.route('/', methods=['GET'])
@jwt_required()
def get_active():
    now = datetime.utcnow()
    anns = Announcement.query.filter(
        (Announcement.expires_at == None) | (Announcement.expires_at > now)  # noqa: E711
    ).order_by(Announcement.created_at.desc()).all()
    return jsonify([a.to_dict() for a in anns])


@announcements_bp.route('/', methods=['POST'])
@jwt_required()
def create():
    if not is_staff(current_user()):
        return jsonify({'error': 'Admin only'}), 403
    data = request.get_json(silent=True) or {}
    if not (data.get('content') or '').strip():
        return jsonify({'error': 'content is required'}), 400
    try:
        expires = datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None
    except ValueError:
        return jsonify({'error': 'expires_at must be ISO format'}), 400
    ann = Announcement(title=(data.get('title') or 'Announcement')[:200], content=data['content'], expires_at=expires)
    db.session.add(ann)
    db.session.commit()
    try:
        from models.user import User
        from routes.notifications import push_notification
        for s in User.query.filter_by(role='student').all():
            push_notification(s.id, ann.title, ann.content[:160], 'info')
    except Exception:
        pass
    return jsonify(ann.to_dict()), 201


@announcements_bp.route('/<int:ann_id>', methods=['DELETE'])
@jwt_required()
def delete(ann_id):
    if not is_staff(current_user()):
        return jsonify({'error': 'Admin only'}), 403
    ann = Announcement.query.get_or_404(ann_id)
    db.session.delete(ann)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
