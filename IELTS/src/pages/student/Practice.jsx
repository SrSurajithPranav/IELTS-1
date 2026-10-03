import React, { useEffect, useMemo, useState } from "react";
import { practiceAPI } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PracticePage({ skill = "reading" }) {
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const load = async () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const [questionResponse, history] = await Promise.all([
        practiceAPI.getQuestions(skill, 10),
        practiceAPI.getAttempts(),
      ]);
      setAvailable(questionResponse?.available !== false);
      setReason(questionResponse?.reason || "");
      setQuestions(questionResponse?.questions || []);
      setAttempts(Array.isArray(history) ? history : []);
      setStartedAt(Date.now());
      setElapsed(0);
    } catch (error) {
      setAvailable(false);
      setReason(error.message || "Practice content is unavailable.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [skill]);

  useEffect(() => {
    if (!startedAt || result || !available) return undefined;
    const timer = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt, result, available]);

  const answered = useMemo(
    () => questions.filter((question) => String(answers[question.id] || "").trim()).length,
    [answers, questions],
  );

  const submit = async () => {
    if (!questions.length || submitting) return;
    setSubmitting(true);
    try {
      const response = await practiceAPI.submitAttempt({
        skill,
        question_ids: questions.map((question) => question.id),
        answers,
        time_spent_seconds: elapsed,
      });
      setResult(response);
      setAttempts((current) => [response, ...current].slice(0, 5));
    } catch (error) {
      setReason(error.message || "Could not save this attempt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        {skill === "reading" ? "Reading Practice" : "Listening Practice"}
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
        {skill === "reading"
          ? "Answer questions from the server-backed reading bank. Scoring happens on the backend and is saved to your account."
          : "Listening practice will appear when real audio and transcripts are configured."}
      </p>

      {loading && <Card>Loading practice content…</Card>}

      {!loading && !available && (
        <Card style={{ border: "1px solid var(--warn)", background: "rgba(183,121,31,.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Not available yet</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{reason}</div>
        </Card>
      )}

      {!loading && available && questions.length > 0 && !result && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Practice set</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                  {answered}/{questions.length} answered
                </div>
              </div>
              <Badge label={`Elapsed ${formatTime(elapsed)}`} color="accent" />
            </div>
          </Card>

          {questions.map((question, index) => (
            <Card key={question.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>Question {index + 1}</div>
                <Badge label={question.question_type} color="warn" />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{question.passage_title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{question.passage_text}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{question.prompt}</div>
              <input
                value={answers[question.id] || ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                placeholder="Type your answer"
                aria-label={`Answer to question ${index + 1}`}
                style={{
                  width: "100%", padding: "11px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--bg3)",
                  color: "var(--text)", outline: "none",
                }}
              />
            </Card>
          ))}

          <Button onClick={submit} loading={submitting} disabled={submitting}>
            Submit and save attempt
          </Button>
        </>
      )}

      {!loading && result && (
        <Card style={{ marginBottom: 18, border: "1px solid var(--success)", background: "rgba(47,133,90,.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Attempt saved</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>
            {result.score}/{result.total}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 14px" }}>
            {result.accuracy_percent}% accuracy · no IELTS band conversion is claimed
          </div>
          {result.results?.map((item) => (
            <div key={item.id} style={{ padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
              <strong>{item.correct ? "Correct" : "Review"}</strong> · Your answer: {item.user_answer || "—"} · Correct: {item.correct_answer}
              <div style={{ color: "var(--muted)", marginTop: 3 }}>{item.explanation}</div>
            </div>
          ))}
          <Button variant="outline" onClick={load} style={{ marginTop: 14 }}>Start another set</Button>
        </Card>
      )}

      {!loading && attempts.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Saved attempts</div>
          {attempts.slice(0, 5).map((attempt) => (
            <div key={attempt.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
              <span>{new Date(attempt.completed_at).toLocaleString()}</span>
              <strong>{attempt.score}/{attempt.total} · {attempt.accuracy_percent}%</strong>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}