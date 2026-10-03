from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.task import Task
from models.student_plan import StudentPlan
from models.plan import Plan
from models.user import User
from models.submission import Submission
from datetime import date

tasks_bp = Blueprint('tasks', __name__)


def _is_admin_or_teacher(user):
    return user and user.role in ('admin', 'teacher')


def _with_status(tasks, student_id):
    """Attach the student's own submission state (pending/submitted/reviewed) to each task."""
    ids = [t.id for t in tasks]
    latest = {}
    if ids:
        subs = (Submission.query.filter(Submission.student_id == student_id, Submission.task_id.in_(ids))
                .order_by(Submission.submitted_at.asc()).all())
        for sub in subs:
            latest[sub.task_id] = sub
    out = []
    for t in tasks:
        d = t.to_dict()
        sub = latest.get(t.id)
        d['status'] = sub.status if sub else 'pending'
        d['submission'] = {
            'id': sub.id, 'content': sub.content, 'file_url': sub.file_url,
            'feedback_text': sub.feedback_text, 'feedback_audio_url': sub.feedback_audio_url,
            'band_score': sub.band_score, 'submitted_at': sub.submitted_at.isoformat(),
        } if sub else None
        out.append(d)
    return out


def _current_task_day(sp: StudentPlan) -> int:
    calendar_days = (date.today() - sp.start_date).days + 1
    plan = Plan.query.get(sp.plan_id)
    if plan and plan.session_type == 'solo':
        return max(1, (calendar_days + 1) // 2)
    return max(1, calendar_days)


@tasks_bp.route('/today', methods=['GET'])
@jwt_required()
def today_tasks():
    uid = int(get_jwt_identity())
    sp  = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': [], 'day': 0,
                        'message': 'No active plan. Ask your teacher to assign one.'})
    day   = _current_task_day(sp)
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    if not tasks:
        return jsonify({'tasks': [], 'day': day,
                        'message': f'No tasks assigned for Day {day} yet. '
                                   f'Ask your teacher to add tasks for Day {day}.'})
    plan_obj = Plan.query.get(sp.plan_id)
    return jsonify({'tasks': _with_status(tasks, uid), 'day': day,
                    'total_days': plan_obj.duration_days if plan_obj else None})


@tasks_bp.route('/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_day(day):
    uid = int(get_jwt_identity())
    sp  = StudentPlan.query.filter_by(student_id=uid, is_active=True).first()
    if not sp:
        return jsonify({'tasks': []})
    tasks = Task.query.filter_by(plan_id=sp.plan_id, day_number=day).all()
    return jsonify({'tasks': _with_status(tasks, uid)})


@tasks_bp.route('/plan/<int:plan_id>/day/<int:day>', methods=['GET'])
@jwt_required()
def tasks_by_plan_and_day(plan_id, day):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
        return jsonify({'error': 'Forbidden'}), 403
    tasks = Task.query.filter_by(plan_id=plan_id, day_number=day).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json(silent=True) or {}
    allowed = ('plan_id', 'day_number', 'type', 'title', 'description', 'duration', 'difficulty')
    if not all(data.get(k) for k in ('plan_id', 'day_number', 'type', 'title')):
        return jsonify({'error': 'plan_id, day_number, type and title are required'}), 400
    task = Task(**{k: v for k, v in data.items() if k in allowed})
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.route('/<int:task_id>', methods=['PUT', 'PATCH', 'DELETE'])
@jwt_required()
def manage_task(task_id):
    uid  = int(get_jwt_identity())
    user = User.query.get(uid)
    if not _is_admin_or_teacher(user):
        return jsonify({'error': 'Forbidden'}), 403
    task = Task.query.get_or_404(task_id)
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Deleted'})
    data = request.get_json(silent=True) or {}
    allowed = ('day_number', 'type', 'title', 'description', 'duration', 'difficulty')
    for k, v in data.items():
        if k in allowed:
            setattr(task, k, v)
    db.session.commit()
    return jsonify(task.to_dict())
