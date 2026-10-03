/**
 * MockTest.jsx — timed mock tests driven by the question bank (no hardcoded passages).
 *  • Listening / Reading / Grammar / Vocabulary: multiple-choice, auto-scored, rough band estimate
 *  • Writing: random prompt from the bank, timed, word count, sent to the teacher for review
 *  • Speaking: random cue card, record audio, sent to the teacher for review
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getQuestions, WRITING_PROMPTS, SPEAKING_CUE_CARDS } from '../../data/questionBank';
import { submissionsAPI, mistakesAPI } from '../../services/api';

const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };
const btn = (primary, disabled) => ({
  padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
  background: primary ? 'var(--accent)' : 'transparent', color: primary ? '#fff' : 'var(--accent)',
  border: primary ? '1px solid transparent' : '1px solid var(--accent)',
});
const SKILLS = [
  { id: 'listening', label: 'Listening', mins: 15, kind: 'mcq' },
  { id: 'reading', label: 'Reading', mins: 20, kind: 'mcq' },
  { id: 'grammar', label: 'Grammar', mins: 10, kind: 'mcq' },
  { id: 'vocabulary', label: 'Vocabulary', mins: 10, kind: 'mcq' },
  { id: 'writing', label: 'Writing', mins: 40, kind: 'writing' },
  { id: 'speaking', label: 'Speaking', mins: 3, kind: 'speaking' },
];
const COUNT = 10;
// Very rough: scales the % correct onto the usual 40-question Listening/Reading band table.
const estimateBand = (pct) => {
  const raw40 = (pct / 100) * 40;
  const table = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5]];
  const hit = table.find(([min]) => raw40 >= min);
  return hit ? hit[1] : 2;
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function useCountdown(totalSecs, active, onEnd) {
  const [left, setLeft] = useState(totalSecs);
  const endRef = useRef(onEnd); endRef.current = onEnd;
  useEffect(() => { setLeft(totalSecs); }, [totalSecs, active]);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) { clearInterval(t); setTimeout(() => endRef.current && endRef.current(), 0); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [active]);
  return left;
}

function McqTest({ skill }) {
  const [qs, setQs] = useState(() => getQuestions(skill.id, COUNT));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState('');
  const left = useCountdown(skill.mins * 60, !done && qs.length > 0, () => finish());

  const score = qs.filter((q) => answers[q.id] === q.c).length;
  const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;

  async function finish() {
    if (done) return;
    setDone(true);
    const wrong = qs.filter((q) => answers[q.id] !== q.c);
    try {
      if (wrong.length) await mistakesAPI.log(wrong.slice(0, 10).map((q) => ({
        error_text: q.q.slice(0, 300), category: skill.id === 'grammar' ? 'grammar' : 'vocabulary', suggestion: q.opts[q.c],
      })));
      setSaved('Wrong answers were added to your Mistake Log.');
    } catch (_) { /* logging is best-effort */ }
  }
  const restart = () => { setQs(getQuestions(skill.id, COUNT)); setI(0); setAnswers({}); setDone(false); setSaved(''); };

  if (qs.length === 0) return <div style={card}>No questions available for this section yet.</div>;
  if (done) {
    return (
      <div style={card}>
        <div className="playfair" style={{ fontSize: 24, fontWeight: 700 }}>{score}/{qs.length} correct ({pct}%)</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 14px' }}>
          Rough band estimate: <b>{estimateBand(pct)}</b> (indicative only — your teacher’s review is the real score). {saved}
        </div>
        {qs.map((q, n) => (
          <div key={q.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
            <div><b>{n + 1}.</b> {q.q}</div>
            <div style={{ color: answers[q.id] === q.c ? 'var(--success)' : 'var(--danger)', marginTop: 3 }}>
              Your answer: {answers[q.id] != null ? q.opts[answers[q.id]] : '— none —'}
            </div>
            {answers[q.id] !== q.c && <div style={{ color: 'var(--success)' }}>Correct: {q.opts[q.c]}</div>}
            {q.exp && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{q.exp}</div>}
          </div>
        ))}
        <div style={{ marginTop: 14 }}><button style={btn(true)} onClick={restart}>Try a new set</button></div>
      </div>
    );
  }
  const q = qs[i];
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: 'var(--muted)' }}>Question {i + 1} of {qs.length}</span>
        <b style={{ color: left < 60 ? 'var(--danger)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>⏱ {mmss(left)}</b>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{q.q}</div>
      {q.opts.map((o, n) => (
        <button key={n} onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', marginBottom: 8, borderRadius: 10, fontSize: 13,
          fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text)',
          background: answers[q.id] === n ? 'rgba(20,108,114,.14)' : 'var(--bg3)',
          border: answers[q.id] === n ? '1px solid var(--accent)' : '1px solid var(--border)' }}>{o}</button>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button style={btn(false, i === 0)} disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
        {i < qs.length - 1
          ? <button style={btn(true)} onClick={() => setI(i + 1)}>Next →</button>
          : <button style={btn(true)} onClick={finish}>Finish test</button>}
      </div>
    </div>
  );
}

function WritingTest({ skill }) {
  const prompt = useMemo(() => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)], []);
  const mins = prompt.timeMin || skill.mins;
  const [text, setText] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent
  const [err, setErr] = useState('');
  const words = text.split(/\s+/).filter(Boolean).length;
  const target = prompt.wordTarget || 250;

  const send = async () => {
    if (state !== 'idle') return;
    setState('sending'); setErr('');
    try { await submissionsAPI.submitPractice(`MOCK TEST — Writing (${prompt.type})\nPrompt: ${prompt.prompt}`, text); setState('sent'); }
    catch (e) { setErr(e.message || 'Could not submit'); setState('idle'); }
  };
  const left = useCountdown(mins * 60, state === 'idle', () => { if (text.trim()) send(); else setState('sent'); });

  if (state === 'sent') return <div style={card}>✅ Submitted to your teacher. Feedback will appear in your notifications.</div>;
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{prompt.type}</span>
        <b style={{ color: left < 120 ? 'var(--danger)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>⏱ {mmss(left)}</b>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{prompt.prompt}</p>
      <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your answer…"
        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 12, color: words >= target ? 'var(--success)' : 'var(--muted)' }}>{words} / {target} words</span>
        <button style={btn(true, !text.trim() || state === 'sending')} disabled={!text.trim() || state === 'sending'} onClick={send}>
          {state === 'sending' ? 'Sending…' : 'Submit to teacher'}
        </button>
      </div>
    </div>
  );
}

function SpeakingTest() {
  const cue = useMemo(() => SPEAKING_CUE_CARDS[Math.floor(Math.random() * SPEAKING_CUE_CARDS.length)], []);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [blob, setBlob] = useState(null);
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  const mr = useRef(null);
  const audioUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : ''), [blob]);

  useEffect(() => {
    if (!rec) return undefined;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream); const chunks = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => { setBlob(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach((t) => t.stop()); };
      mr.current = r; r.start(); setSecs(0); setBlob(null); setRec(true);
    } catch (_) { setErr('Microphone access was blocked. Allow it in your browser settings.'); }
  };
  const stop = () => { if (mr.current) mr.current.stop(); setRec(false); };
  const send = async () => {
    setState('sending'); setErr('');
    try { await submissionsAPI.submitPractice(`MOCK TEST — Speaking Part 2\nCue card: ${cue.prompt}`, '', blob); setState('sent'); }
    catch (e) { setErr(e.message || 'Could not submit'); setState('idle'); }
  };
  if (state === 'sent') return <div style={card}>✅ Recording sent to your teacher.</div>;
  return (
    <div style={card}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{cue.prompt}</div>
      <ul style={{ margin: '0 0 14px 18px', fontSize: 13, color: 'var(--muted)' }}>{cue.points.map((p) => <li key={p}>{p}</li>)}</ul>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btn(!rec)} onClick={rec ? stop : start}>{rec ? '⏹ Stop' : '⏺ Start recording'}</button>
        <b style={{ fontVariantNumeric: 'tabular-nums', color: secs > 120 ? 'var(--danger)' : 'var(--accent)' }}>{mmss(secs)}</b>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Aim for 1–2 minutes</span>
      </div>
      {blob && <div style={{ marginTop: 12 }}><audio controls src={audioUrl} style={{ width: '100%' }} />
        <div style={{ marginTop: 10 }}><button style={btn(true, state === 'sending')} disabled={state === 'sending'} onClick={send}>{state === 'sending' ? 'Sending…' : 'Submit to teacher'}</button></div></div>}
      {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{err}</div>}
    </div>
  );
}

export default function MockTestPage() {
  const [skillId, setSkillId] = useState('reading');
  const skill = SKILLS.find((s) => s.id === skillId);
  return (
    <div>
      <div className="playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Mock Test Studio ⏱</div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Questions come from the training bank. Objective sections are scored instantly; writing and speaking go to your teacher.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SKILLS.map((s) => <button key={s.id} style={btn(skillId === s.id)} onClick={() => setSkillId(s.id)}>{s.label}</button>)}
      </div>
      {skill.kind === 'mcq' && <McqTest key={skill.id} skill={skill} />}
      {skill.kind === 'writing' && <WritingTest key="w" skill={skill} />}
      {skill.kind === 'speaking' && <SpeakingTest key="s" />}
    </div>
  );
}
