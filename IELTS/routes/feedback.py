from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db
from models.submission import Submission
from models.user import User
from models.notification import Notification
from utils.storage import upload_audio
import datetime

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/<int:submission_id>', methods=['POST'])
@jwt_required()
def give_feedback(submission_id):
    """
    Give feedback on a submission (Admin only)
    ---
    tags:
      - Feedback
    security:
      - Bearer: []
    parameters:
      - name: submission_id
        in: path
        type: integer
        required: true
      - name: feedback_text
        in: formData
        type: string
      - name: audio
        in: formData
        type: file
    responses:
      200:
        description: Feedback added
      403:
        description: Forbidden (Admin only)
    """
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if user.role not in ('admin', 'teacher'):
        return jsonify({'error': 'Forbidden'}), 403
    sub = Submission.query.get_or_404(submission_id)
    feedback_text = request.form.get('feedback_text', '')
    sub.feedback_text = feedback_text
    sub.status = 'reviewed'
    sub.reviewed_at = datetime.datetime.utcnow()
    raw_band = request.form.get('band_score')
    if raw_band not in (None, ''):
        try:
            band = float(raw_band)
        except ValueError:
            return jsonify({'error': 'band_score must be a number'}), 400
        if not 0 <= band <= 9:
            return jsonify({'error': 'band_score must be 0-9'}), 400
        sub.band_score = band
    if 'audio' in request.files:
        try:
            sub.feedback_audio_url = upload_audio(request.files['audio'], folder='feedback')
        except RuntimeError as exc:
            return jsonify({'error': str(exc)}), 503

    task_title = sub.task.title if sub.task else f'Task #{sub.task_id}'
    db.session.commit()
    student = User.query.get(sub.student_id)
    if student:
        student.compute_bands()
        db.session.commit()
    from routes.notifications import push_notification
    push_notification(
        sub.student_id, 'Feedback received',
        f'Your teacher reviewed "{task_title}". Open Today\'s Tasks to see it.', 'feedback')
    return jsonify(sub.to_dict())
