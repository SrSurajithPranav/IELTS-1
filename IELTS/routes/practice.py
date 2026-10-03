import json
from pathlib import Path

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.db import db
from models.practice_attempt import PracticeAttempt


practice_bp = Blueprint("practice", __name__, url_prefix="/api/practice")
_BANK_PATH = Path(__file__).resolve().parents[1] / "ielts_massive_training_bank.json"


def _load_bank():
    try:
        with _BANK_PATH.open(encoding="utf-8") as handle:
            data = json.load(handle)
        return data.get("ielts_training_bank", {})
    except (OSError, ValueError):
        return {}


def _reading_questions(limit):
    questions = []
    for passage in _load_bank().get("reading", []):
        for item in passage.get("questions", []):
            questions.append({
                "id": f"{passage.get('id')}-Q{item.get('question_number')}",
                "passage_title": passage.get("passage_title", ""),
                "passage_text": passage.get("passage_text", ""),
                "question_number": item.get("question_number"),
                "question_type": item.get("question_type", "Short Answer"),
                "prompt": item.get("prompt", ""),
            })
            if len(questions) >= limit:
                return questions
    return questions


def _reading_answer_index():
    answers = {}
    for passage in _load_bank().get("reading", []):
        for item in passage.get("questions", []):
            key = f"{passage.get('id')}-Q{item.get('question_number')}"
            answers[key] = {
                "answer": str(item.get("answer", "")).strip(),
                "explanation": item.get("explanation", ""),
            }
    return answers


def _normalise(value):
    return " ".join(str(value or "").casefold().strip().split())


@practice_bp.route("/questions", methods=["GET"])
@jwt_required()
def questions():
    skill = (request.args.get("skill") or "reading").strip().lower()
    try:
        limit = max(1, min(int(request.args.get("limit", 10)), 40))
    except (TypeError, ValueError):
        return jsonify({"error": "limit must be an integer"}), 400

    if skill == "reading":
        items = _reading_questions(limit)
        if not items:
            return jsonify({"error": "Reading question bank is unavailable"}), 503
        return jsonify({
            "available": True,
            "skill": skill,
            "questions": items,
            "total_available": len(_reading_answer_index()),
            "scoring": "server-side exact answer matching with case and whitespace normalization",
        })

    if skill == "listening":
        return jsonify({
            "available": False,
            "skill": skill,
            "reason": "Real listening audio is not configured. Placeholder scripts are intentionally not exposed as audio.",
        })

    return jsonify({"error": "skill must be reading or listening"}), 400


@practice_bp.route("/attempts", methods=["GET"])
@jwt_required()
def list_attempts():
    uid = int(get_jwt_identity())
    rows = (
        PracticeAttempt.query.filter_by(user_id=uid)
        .order_by(PracticeAttempt.completed_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([row.to_dict() for row in rows])


@practice_bp.route("/attempts", methods=["POST"])
@jwt_required()
def submit_attempt():
    uid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    skill = (data.get("skill") or "").strip().lower()
    if skill != "reading":
        return jsonify({"error": "Only reading attempts can be scored until real listening audio is configured"}), 400

    question_ids = data.get("question_ids")
    answers = data.get("answers")
    if not isinstance(question_ids, list) or not question_ids:
        return jsonify({"error": "question_ids must be a non-empty list"}), 400
    if not isinstance(answers, dict):
        return jsonify({"error": "answers must be an object keyed by question id"}), 400

    answer_key = _reading_answer_index()
    unknown = [str(question_id) for question_id in question_ids if str(question_id) not in answer_key]
    if unknown:
        return jsonify({"error": "One or more question ids are not in the active question bank"}), 400

    unique_ids = list(dict.fromkeys(str(question_id) for question_id in question_ids))
    correct = sum(
        _normalise(answers.get(question_id)) == _normalise(answer_key[question_id]["answer"])
        for question_id in unique_ids
    )
    attempt = PracticeAttempt(
        user_id=uid,
        skill=skill,
        question_ids=json.dumps(unique_ids),
        answers=json.dumps({question_id: str(answers.get(question_id, "")) for question_id in unique_ids}),
        score=correct,
        total=len(unique_ids),
        time_spent_seconds=data.get("time_spent_seconds"),
    )
    db.session.add(attempt)
    db.session.commit()

    result = attempt.to_dict()
    result["results"] = [
        {
            "id": question_id,
            "correct": _normalise(answers.get(question_id)) == _normalise(answer_key[question_id]["answer"]),
            "correct_answer": answer_key[question_id]["answer"],
            "user_answer": answers.get(question_id, ""),
            "explanation": answer_key[question_id]["explanation"],
        }
        for question_id in unique_ids
    ]
    return jsonify(result), 201