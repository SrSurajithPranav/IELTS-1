import unittest

from app import create_app


class StudentApiFlowTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        response = self.client.post(
            "/api/auth/register",
            json={
                "name": "Flow Student",
                "email": "flow.student@example.com",
                "password": "StrongPass123",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.headers = {"Authorization": f"Bearer {response.json['token']}"}

    def test_profile_mistake_and_reading_attempt_are_persistent(self):
        profile = self.client.get("/api/auth/me", headers=self.headers)
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.json["email"], "flow.student@example.com")

        mistake = self.client.post(
            "/api/mistakes/",
            json={"error_text": "subject verb agreement", "category": "grammar"},
            headers=self.headers,
        )
        self.assertEqual(mistake.status_code, 201)
        repeated = self.client.post(
            "/api/mistakes/",
            json={"error_text": "subject verb agreement", "category": "grammar"},
            headers=self.headers,
        )
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.json["frequency"], 2)

        questions = self.client.get(
            "/api/practice/questions?skill=reading&limit=1",
            headers=self.headers,
        )
        self.assertEqual(questions.status_code, 200)
        question = questions.json["questions"][0]
        attempt = self.client.post(
            "/api/practice/attempts",
            json={
                "skill": "reading",
                "question_ids": [question["id"]],
                "answers": {question["id"]: "not the answer"},
                "time_spent_seconds": 4,
            },
            headers=self.headers,
        )
        self.assertEqual(attempt.status_code, 201)
        self.assertEqual(attempt.json["total"], 1)
        self.assertEqual(attempt.json["score"], 0)

        history = self.client.get("/api/practice/attempts", headers=self.headers)
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.json), 1)

    def test_listening_never_exposes_placeholder_audio(self):
        response = self.client.get(
            "/api/practice/questions?skill=listening",
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json["available"])
        self.assertIn("real listening audio", response.json["reason"].lower())


if __name__ == "__main__":
    unittest.main()