"""Progress report (student) and analytics (teacher). Pure SQL/Python - no paid services."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from models.db import db
from models.user import User
from models.task import Task
from models.plan import Plan
from models.student_plan import StudentPlan
from models.submission import Submission
from models.attendance import Attendance
from models.mistake import Mistake
from models.batch import Batch
from utils.auth_helpers import current_user, is_staff
from datetime import datetime, timedelta, date

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


def build_report(student):
    sp = StudentPlan.query.filter_by(student_id=student.id, is_active=True).first()
    plan = Plan.query.get(sp.plan_id) if sp else None
    total_tasks = Task.query.filter_by(plan_id=plan.id).count() if plan else 0
    done_ids = set()
    if plan:
        done_ids = {t for (t,) in db.session.query(Submission.task_id)
                    .join(Task, Task.id == Submission.task_id)
                    .filter(Submission.student_id == student.id, Task.plan_id == plan.id).distinct()}
    att = Attendance.query.filter_by(student_id=student.id).all()
    attended = sum(1 for a in att if a.status in ('present', 'late'))
    history = [{'date': (s.reviewed_at or s.submitted_at).strftime('%Y-%m-%d'), 'band': s.band_score,
                'type': s.task.type if s.task else 'practice'}
               for s in Submission.query.filter(Submission.student_id == student.id, Submission.band_score.isnot(None))
               .order_by(Submission.submitted_at).all()]
    mistakes = Mistake.query.filter_by(user_id=student.id).order_by(Mistake.frequency.desc()).limit(5).all()
    return {
        'student': {'id': student.id, 'name': student.name, 'email': student.email},
        'generated_at': datetime.utcnow().isoformat(),
        'plan': {'name': plan.name, 'duration_days': plan.duration_days, 'current_day': sp.current_day(),
                 'start_date': str(sp.start_date)} if plan else None,
        'completion': {'done': len(done_ids), 'total': total_tasks,
                       'percent': round(100 * len(done_ids) / total_tasks) if total_tasks else 0},
        'bands': {'overall': student.score, 'listening': student.listening_band, 'reading': student.reading_band,
                  'writing': student.writing_band, 'speaking': student.speaking_band},
        'streak': student.streak,
        'weak_areas': [w for w in (student.weak_areas or '').split(',') if w.strip()],
        'attendance': {'attended': attended, 'total': len(att),
                       'percent': round(100 * attended / len(att)) if att else None},
        'band_history': history,
        'top_mistakes': [m.to_dict() for m in mistakes],
    }


@reports_bp.route('/me', methods=['GET'])
@jwt_required()
def my_report():
    return jsonify(build_report(current_user()))


@reports_bp.route('/student/<int:student_id>', methods=['GET'])
@jwt_required()
def student_report(student_id):
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify(build_report(User.query.get_or_404(student_id)))


@reports_bp.route('/analytics', methods=['GET'])
@jwt_required()
def analytics():
    """Teacher dashboard numbers: submission trend, average bands, batches, attendance."""
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    since = datetime.utcnow() - timedelta(days=13)
    raw = db.session.query(func.date(Submission.submitted_at), func.count(Submission.id)) \
        .filter(Submission.submitted_at >= since).group_by(func.date(Submission.submitted_at)).all()
    per_day = {str(d): c for d, c in raw}
    trend = []
    for i in range(14):
        d = (since + timedelta(days=i)).date().isoformat()
        trend.append({'date': d, 'submissions': int(per_day.get(d, 0))})
    students = User.query.filter_by(role='student').all()

    def avg(vals):
        vals = [v for v in vals if v]
        return round(sum(vals) / len(vals), 1) if vals else None

    bands = {k: avg([getattr(s, f'{k}_band') for s in students]) for k in ('listening', 'reading', 'writing', 'speaking')}
    batches = []
    for b in Batch.query.all():
        ms = [m for m in (User.query.get(x.student_id) for x in b.members) if m]
        batches.append({'id': b.id, 'name': b.name, 'level': b.level, 'students': len(ms),
                        'avg_score': avg([m.score for m in ms]), 'avg_streak': avg([m.streak for m in ms])})
    att = Attendance.query.all()
    return jsonify({
        'students': len(students),
        'pending_reviews': Submission.query.filter_by(status='submitted').count(),
        'avg_overall': avg([s.score for s in students]),
        'avg_bands': bands,
        'submission_trend': trend,
        'batches': batches,
        'attendance_percent': round(100 * sum(1 for a in att if a.status in ('present', 'late')) / len(att)) if att else None,
        'at_risk': [{'id': s.id, 'name': s.name, 'streak': s.streak,
                     'last_active': str(s.last_active_date) if s.last_active_date else None}
                    for s in students if not s.last_active_date or s.last_active_date < date.today() - timedelta(days=4)][:10],
    })
