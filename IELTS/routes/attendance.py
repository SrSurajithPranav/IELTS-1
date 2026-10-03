from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import db
from models.attendance import Attendance
from models.session import LiveSession
from utils.auth_helpers import current_user, is_staff

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')
STATUSES = ('present', 'absent', 'late')


@attendance_bp.route('/session/<int:session_id>', methods=['GET'])
@jwt_required()
def get_for_session(session_id):
    user = current_user()
    q = Attendance.query.filter_by(session_id=session_id)
    if not is_staff(user):
        q = q.filter_by(student_id=user.id)
    return jsonify([r.to_dict() for r in q.all()])


@attendance_bp.route('/me', methods=['GET'])
@jwt_required()
def my_attendance():
    user = current_user()
    rows = Attendance.query.filter_by(student_id=user.id).all()
    attended = sum(1 for r in rows if r.status in ('present', 'late'))
    return jsonify({'records': [r.to_dict() for r in rows], 'attended': attended, 'total': len(rows),
                    'percent': round(100 * attended / len(rows)) if rows else None})


@attendance_bp.route('/', methods=['POST'])
@jwt_required()
def mark():
    """Teacher marks any student; a student can only check themselves in (present)."""
    user = current_user()
    data = request.get_json(silent=True) or {}
    try:
        session_id = int(data.get('session_id'))
    except (TypeError, ValueError):
        return jsonify({'error': 'session_id is required'}), 400
    if not LiveSession.query.get(session_id):
        return jsonify({'error': 'Session not found'}), 404
    if is_staff(user):
        try:
            student_id = int(data.get('student_id'))
        except (TypeError, ValueError):
            return jsonify({'error': 'student_id is required'}), 400
        status = data.get('status', 'present')
    else:
        student_id, status = user.id, 'present'
    if status not in STATUSES:
        return jsonify({'error': f'status must be one of {STATUSES}'}), 400
    row = Attendance.query.filter_by(session_id=session_id, student_id=student_id).first()
    if row:
        row.status = status
    else:
        row = Attendance(session_id=session_id, student_id=student_id, status=status)
        db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict()), 200
