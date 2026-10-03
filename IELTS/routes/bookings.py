"""1-on-1 (solo) session booking. Teacher publishes slots; students book one."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import db
from models.booking_slot import BookingSlot
from utils.auth_helpers import current_user, is_staff, local_now
from datetime import datetime, timedelta

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


def _parse(dt):
    try:
        return datetime.fromisoformat(str(dt).replace('Z', ''))
    except (TypeError, ValueError):
        return None


@bookings_bp.route('/slots', methods=['GET'])
@jwt_required()
def list_slots():
    user = current_user()
    q = BookingSlot.query.filter(BookingSlot.end_time >= local_now() - timedelta(hours=1))
    if not is_staff(user):
        q = q.filter((BookingSlot.is_booked == False) | (BookingSlot.student_id == user.id))  # noqa: E712
    return jsonify([s.to_dict(user.id) for s in q.order_by(BookingSlot.start_time).all()])


@bookings_bp.route('/slots', methods=['POST'])
@jwt_required()
def create_slot():
    user = current_user()
    if not is_staff(user):
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json(silent=True) or {}
    start, end = _parse(data.get('start_time')), _parse(data.get('end_time'))
    if not start or not end or end <= start:
        return jsonify({'error': 'valid start_time and end_time are required'}), 400
    slot = BookingSlot(teacher_id=user.id, start_time=start, end_time=end, is_booked=False)
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict(user.id)), 201


@bookings_bp.route('/slots/generate', methods=['POST'])
@jwt_required()
def generate_slots():
    """Create recurring solo slots, default one every 2 days (the solo-training cadence)."""
    user = current_user()
    if not is_staff(user):
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json(silent=True) or {}
    try:
        first = datetime.strptime(f"{data['start_date']} {data.get('time', '18:00')}", '%Y-%m-%d %H:%M')
        count = min(max(int(data.get('count', 10)), 1), 60)
        every = min(max(int(data.get('every_n_days', 2)), 1), 14)
        minutes = min(max(int(data.get('duration_min', 30)), 10), 180)
    except (KeyError, ValueError):
        return jsonify({'error': 'start_date (YYYY-MM-DD), time (HH:MM) required'}), 400
    made = 0
    for i in range(count):
        start = first + timedelta(days=i * every)
        if BookingSlot.query.filter_by(teacher_id=user.id, start_time=start).first():
            continue
        db.session.add(BookingSlot(teacher_id=user.id, start_time=start, end_time=start + timedelta(minutes=minutes)))
        made += 1
    db.session.commit()
    return jsonify({'created': made}), 201


@bookings_bp.route('/book/<int:slot_id>', methods=['POST'])
@jwt_required()
def book_slot(slot_id):
    user = current_user()
    slot = BookingSlot.query.get_or_404(slot_id)
    if slot.is_booked:
        return jsonify({'error': 'Already booked'}), 409
    if slot.start_time < local_now():
        return jsonify({'error': 'This slot is in the past'}), 400
    slot.is_booked, slot.student_id = True, user.id
    db.session.commit()
    try:
        from routes.notifications import push_notification
        push_notification(slot.teacher_id, 'New 1-on-1 booking', f'{user.name} booked {slot.start_time:%d %b %H:%M}.', 'info')
    except Exception:
        pass
    return jsonify(slot.to_dict(user.id))


@bookings_bp.route('/<int:slot_id>', methods=['DELETE'])
@jwt_required()
def cancel(slot_id):
    """Student cancels own booking (slot reopens); teacher deletes the slot."""
    user = current_user()
    slot = BookingSlot.query.get_or_404(slot_id)
    if is_staff(user):
        db.session.delete(slot)
    elif slot.student_id == user.id:
        slot.is_booked, slot.student_id = False, None
    else:
        return jsonify({'error': 'Forbidden'}), 403
    db.session.commit()
    return jsonify({'message': 'Done'})
