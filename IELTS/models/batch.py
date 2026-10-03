from models.db import db
from datetime import datetime

LEVELS = ('beginner', 'intermediate', 'advanced')


class Batch(db.Model):
    """A group of students taught together, grouped by level (strength)."""
    __tablename__ = 'batches'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    zoom_link = db.Column(db.String(500), nullable=True)
    schedule = db.Column(db.String(200), nullable=True)
    level = db.Column(db.String(20), default='intermediate')
    max_students = db.Column(db.Integer, default=10)
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    members = db.relationship('BatchMember', backref='batch', lazy=True, cascade='all,delete')

    def to_dict(self, with_members=False):
        data = {
            'id': self.id, 'name': self.name, 'zoom_link': self.zoom_link, 'schedule': self.schedule,
            'level': self.level or 'intermediate', 'max_students': self.max_students or 10,
            'plan_id': self.plan_id, 'member_count': len(self.members),
        }
        if with_members:
            from models.user import User
            data['members'] = [
                {'id': u.id, 'name': u.name, 'email': u.email, 'score': u.score}
                for u in (User.query.get(m.student_id) for m in self.members) if u
            ]
        return data


class BatchMember(db.Model):
    __tablename__ = 'batch_members'
    __table_args__ = (db.UniqueConstraint('batch_id', 'student_id', name='uq_batch_student'),)
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('batches.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
