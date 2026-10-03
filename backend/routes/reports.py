"""Student progress reports and staff analytics."""

from datetime import datetime, timedelta

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from models.db import db
from models.submission import Submission
from models.user import User
from utils.auth_helpers import current_user, is_staff

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


def _report(student):
    submissions = Submission.query.filter_by(student_id=student.id).all()
    bands = [item.band_score for item in submissions if item.band_score is not None]
    return {
        'student': {'id': student.id, 'name': student.name, 'email': student.email},
        'generated_at': datetime.utcnow().isoformat(),
        'bands': {
            'overall': student.score,
            **{name: getattr(student, f'{name}_band', None)
               for name in ('listening', 'reading', 'writing', 'speaking')},
        },
        'streak': student.streak,
        'submission_count': len(submissions),
        'average_submission_band': round(sum(bands) / len(bands), 1) if bands else None,
    }


@reports_bp.get('/me')
@jwt_required()
def my_report():
    student = current_user()
    return jsonify(_report(student)) if student else (jsonify({'error': 'Unauthorized'}), 401)


@reports_bp.get('/student/<int:student_id>')
@jwt_required()
def student_report(student_id):
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify(_report(User.query.get_or_404(student_id)))