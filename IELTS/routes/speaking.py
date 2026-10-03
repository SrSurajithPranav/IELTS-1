from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.speaking_topic import SpeakingTopic

speaking_bp = Blueprint('speaking', __name__, url_prefix='/api/speaking')


def _ensure_seeded(uid):
    from utils.default_topics import seed_default_topics
    seed_default_topics(db, uid)


@speaking_bp.route('/random', methods=['GET'])
@jwt_required()
def random_topic():
    import random
    _ensure_seeded(int(get_jwt_identity()))
    q = SpeakingTopic.query
    part = request.args.get('part')
    if part:
        try:
            q = q.filter_by(part=int(part))
        except ValueError:
            pass
    topics = q.all()
    if not topics:
        return jsonify({'error': 'No topics found'}), 404
    return jsonify(random.choice(topics).to_dict())


@speaking_bp.route('/topics', methods=['GET'])
@jwt_required()
def list_topics():
    _ensure_seeded(int(get_jwt_identity()))
    return jsonify([t.to_dict() for t in SpeakingTopic.query.order_by(SpeakingTopic.part, SpeakingTopic.id.desc()).all()])


@speaking_bp.route('/', methods=['POST'])
@speaking_bp.route('/topics', methods=['POST'])
@jwt_required()
def create_topic():
    from utils.auth_helpers import current_user, is_staff
    user = current_user()
    if not is_staff(user):
        return jsonify({'error': 'Admin only'}), 403
    data = request.get_json(silent=True) or {}
    question = (data.get('question') or '').strip()
    try:
        part = int(data.get('part', 2))
    except (TypeError, ValueError):
        part = 0
    if part not in (1, 2, 3) or not question:
        return jsonify({'error': 'part (1-3) and question are required'}), 400
    topic = SpeakingTopic(part=part, question=question, created_by=user.id)
    db.session.add(topic)
    db.session.commit()
    return jsonify(topic.to_dict()), 201


@speaking_bp.route('/topics/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    from utils.auth_helpers import current_user, is_staff
    if not is_staff(current_user()):
        return jsonify({'error': 'Admin only'}), 403
    t = SpeakingTopic.query.get_or_404(topic_id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ============ SPEAKING FEATURES ============

@speaking_bp.route('/analyze-timing', methods=['POST'])
@jwt_required()
def analyze_timing():
    """Analyze speaking duration and pacing."""
    from models.user import User
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json(silent=True) or {}
    # In production, use speech-to-text to get actual words
    # For MVP, measure duration from submitted data
    duration = int(data.get('duration') or 0)
    
    if duration <= 0:
        return jsonify({'error': 'duration is required'}), 400
    
    pacing = 'Good! You spoke for almost exactly 2 minutes.' if 110 <= duration <= 130 else \
             'Too short - aim for at least 2 minutes.' if duration < 110 else \
             'Too long - keep it within 2-2.5 minutes.'
    
    return jsonify({
        'duration': duration,
        'pacing': pacing,
        'suggestions': [
            'Slow down slightly in the middle',
            'Add 2 more seconds of detail'
        ] if duration < 110 else []
    })


@speaking_bp.route('/cue-card-modes', methods=['GET'])
@jwt_required()
def get_cue_card_modes():
    """Get available timer modes for Part 2 cue card practice."""
    from models.user import User
    uid = int(get_jwt_identity())
    if not User.query.get(uid):
        return jsonify({'error': 'Unauthorized'}), 401
    
    modes = {
        'strict': {
            'name': 'Strict Mode',
            'description': 'Recording cuts off at exactly 2 minutes',
            'time_limit': 120,
            'grace_period': 0
        },
        'generous': {
            'name': 'Generous Mode',
            'description': 'Allows 2 minutes with 30-second grace period',
            'time_limit': 120,
            'grace_period': 30
        },
        'analysis': {
            'name': 'Analysis Mode',
            'description': 'Records and shows detailed pacing analysis',
            'time_limit': 120,
            'grace_period': 0,
            'features': ['pacing_analysis', 'filler_count', 'word_count']
        }
    }
    return jsonify({'modes': modes})
