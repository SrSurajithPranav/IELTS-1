from models.db import db
from datetime import datetime


class BookingSlot(db.Model):
    """A bookable 1-on-1 (solo) session slot offered by the teacher."""
    __tablename__ = 'booking_slots'
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def to_dict(self, viewer_id=None):
        from models.user import User
        student = User.query.get(self.student_id) if self.student_id else None
        minutes = int((self.end_time - self.start_time).total_seconds() // 60) if self.end_time and self.start_time else 30
        return {
            'id': self.id, 'teacher_id': self.teacher_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_min': minutes, 'is_booked': self.is_booked, 'student_id': self.student_id,
            'student_name': student.name if student else None,
            'booked_by_me': bool(viewer_id and self.student_id == viewer_id),
        }
