from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import db
from models.batch import Batch, BatchMember, LEVELS
from models.user import User
from models.plan import Plan
from utils.auth_helpers import current_user, is_staff

batches_bp = Blueprint('batches', __name__)
_FIELDS = ('name', 'zoom_link', 'schedule', 'level', 'max_students', 'plan_id')


def _clean(data):
    out = {k: data[k] for k in _FIELDS if k in data}
    if 'level' in out and out['level'] not in LEVELS:
        out['level'] = 'intermediate'
    if 'max_students' in out:
        try:
            out['max_students'] = max(1, int(out['max_students']))
        except (TypeError, ValueError):
            out['max_students'] = 10
    if out.get('plan_id') in ('', None):
        out.pop('plan_id', None)
    return out


@batches_bp.route('/', methods=['GET', 'POST'])
@jwt_required()
def batches():
    """List batches (staff: all, student: own) or create one (staff)."""
    user = current_user()
    if request.method == 'GET':
        if is_staff(user):
            return jsonify([b.to_dict() for b in Batch.query.order_by(Batch.created_at.desc()).all()])
        ids = [m.batch_id for m in BatchMember.query.filter_by(student_id=user.id).all()]
        return jsonify([b.to_dict() for b in Batch.query.filter(Batch.id.in_(ids)).all()] if ids else [])
    if not is_staff(user):
        return jsonify({'error': 'Forbidden'}), 403
    data = _clean(request.get_json(silent=True) or {})
    if not (data.get('name') or '').strip():
        return jsonify({'error': 'name is required'}), 400
    batch = Batch(**data)
    db.session.add(batch)
    db.session.commit()
    return jsonify(batch.to_dict()), 201


@batches_bp.route('/<int:batch_id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
def batch_detail(batch_id):
    user = current_user()
    batch = Batch.query.get_or_404(batch_id)
    if request.method == 'GET':
        if not is_staff(user) and not BatchMember.query.filter_by(batch_id=batch_id, student_id=user.id).first():
            return jsonify({'error': 'Forbidden'}), 403
        return jsonify(batch.to_dict(with_members=True))
    if not is_staff(user):
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'DELETE':
        db.session.delete(batch)
        db.session.commit()
        return jsonify({'message': 'Deleted'})
    for k, v in _clean(request.get_json(silent=True) or {}).items():
        setattr(batch, k, v)
    db.session.commit()
    return jsonify(batch.to_dict(with_members=True))


@batches_bp.route('/<int:batch_id>/members', methods=['POST'])
@jwt_required()
def add_member(batch_id):
    """Add a student to a batch. Respects max_students and avoids duplicates."""
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    batch = Batch.query.get_or_404(batch_id)
    data = request.get_json(silent=True) or {}
    try:
        student_id = int(data.get('student_id'))
    except (TypeError, ValueError):
        return jsonify({'error': 'student_id is required'}), 400
    student = User.query.get(student_id)
    if not student or student.role != 'student':
        return jsonify({'error': 'Student not found'}), 404
    if BatchMember.query.filter_by(batch_id=batch_id, student_id=student_id).first():
        return jsonify({'message': 'Already a member'}), 200
    if len(batch.members) >= (batch.max_students or 10):
        return jsonify({'error': f'Batch is full ({batch.max_students} students)'}), 409
    db.session.add(BatchMember(batch_id=batch_id, student_id=student_id))
    db.session.commit()
    return jsonify(batch.to_dict(with_members=True)), 201


@batches_bp.route('/<int:batch_id>/members/<int:student_id>', methods=['DELETE'])
@jwt_required()
def remove_member(batch_id, student_id):
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    m = BatchMember.query.filter_by(batch_id=batch_id, student_id=student_id).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return jsonify({'message': 'Removed'})


@batches_bp.route('/<int:batch_id>/assign-plan', methods=['POST'])
@jwt_required()
def assign_plan_to_batch(batch_id):
    """Assign one plan to every member of a batch."""
    if not is_staff(current_user()):
        return jsonify({'error': 'Forbidden'}), 403
    from routes.plans import _create_student_plan
    from routes.notifications import push_notification
    batch = Batch.query.get_or_404(batch_id)
    data = request.get_json(silent=True) or {}
    plan = Plan.query.get(data.get('plan_id') or 0)
    if not plan:
        return jsonify({'error': 'plan not found'}), 404
    for m in batch.members:
        _create_student_plan(m.student_id, plan.id)
    batch.plan_id = plan.id
    db.session.commit()
    for m in batch.members:
        push_notification(m.student_id, 'New plan assigned', f'{plan.name} has been assigned to your batch "{batch.name}".', 'info')
    return jsonify({'assigned': len(batch.members), 'plan': plan.name})
