import json
from datetime import datetime

from models.db import db


class PracticeAttempt(db.Model):
    """A server-scored reading/listening practice attempt owned by one student."""

    __tablename__ = "practice_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    skill = db.Column(db.String(20), nullable=False, index=True)
    question_ids = db.Column(db.Text, nullable=False, default="[]")
    answers = db.Column(db.Text, nullable=False, default="{}")
    score = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer, nullable=False, default=0)
    time_spent_seconds = db.Column(db.Integer, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @staticmethod
    def _json(value, fallback):
        try:
            return json.loads(value or "")
        except (TypeError, ValueError):
            return fallback

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "skill": self.skill,
            "question_ids": self._json(self.question_ids, []),
            "answers": self._json(self.answers, {}),
            "score": self.score,
            "total": self.total,
            "accuracy_percent": round((self.score / self.total) * 100, 1) if self.total else 0,
            "time_spent_seconds": self.time_spent_seconds,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }