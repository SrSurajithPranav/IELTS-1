/**
 * FeaturePages.jsx — student + teacher pages added on top of the core planner.
 *
 * Student : SpeakingTopicBankPage, MistakeLogPage, StudentBookingsPage,
 *           CalendarPage, ProfilePage, ReportPage
 * Teacher : AdminTopicBankPage, AdminAttendancePage, AdminBatchesPage,
 *           AdminAnnouncementsPage, AdminBookingsPage, AdminAnalyticsPage
 *
 * All data comes from the Flask API (see services/api.js). No paid services.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from 'recharts';
import {
  apiCall, speakingTopicsAPI, mistakesAPI, attendanceAPI, announcementsAPI, bookingsAPI,
  batchesAPI, studentsAPI, sessionsAPI, plansAPI, reportsAPI,
} from '../services/api';

// ── primitives (use the app's CSS variables so light/dark themes work) ──
const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 14px)', padding: 20 };
const inp = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '10px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
};
const lbl = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, fontWeight: 600 };
const BTN = {
  primary: { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' },
  outline: { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' },
  danger: { background: 'var(--danger)', color: '#fff', border: '1px solid transparent' },
  success: { background: 'var(--success)', color: '#fff', border: '1px solid transparent' },
  ghost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' },
};
const Btn = ({ children, onClick, v = 'primary', disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...BTN[v], padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style,
  }}>{children}</button>
);
const TONES = {
  accent: ['rgba(20,108,114,.14)', 'var(--accent)'], success: ['rgba(47,133,90,.14)', 'var(--success)'],
  warn: ['rgba(183,121,31,.16)', 'var(--warn)'], danger: ['rgba(197,48,48,.12)', 'var(--danger)'],
  gold: ['rgba(214,148,41,.16)', 'var(--gold)'], muted: ['var(--bg3)', 'var(--muted)'],
};
const Pill = ({ children, tone = 'accent' }) => {
  const t = TONES[tone] || TONES.accent;
  return (
    <span style={{ background: t[0], color: t[1], fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 99, letterSpacing: '.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</span>
  );
};
const Title = ({ children }) => <div className="playfair" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{children}</div>;
const Sub = ({ children }) => <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>{children}</p>;
const Empty = ({ icon, text }) => (
  <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
    <div style={{ fontSize: 34, marginBottom: 8 }}>{icon}</div>{text}
  </div>
);
const Flash = ({ msg }) => !msg ? null : (
  <div style={{ ...card, marginBottom: 14, padding: '10px 16px', fontSize: 13,
    color: msg.ok ? 'var(--success)' : 'var(--danger)', border: `1px solid ${msg.ok ? 'var(--success)' : 'var(--danger)'}` }}>{msg.text}</div>
);
const Row = ({ children, style, className }) => <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', ...style }}>{children}</div>;
const grid = (min) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12 });
// Session/slot times are stored as naive local time (same convention as the Sessions page).
const fmtDT = (iso) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
const errText = (e) => (e && e.message) || 'Something went wrong';
const list = (d) => (Array.isArray(d) ? d : []);

// ═════════════════════════════════════════════════════════════
// STUDENT — SPEAKING TOPIC BANK
// ═════════════════════════════════════════════════════════════
export function SpeakingTopicBankPage() {
  const [part, setPart] = useState(2);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const limits = { 1: 60, 2: 120, 3: 300 };

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const next = async () => {
    setLoading(true); setErr(''); setSecs(0); setRunning(false);
    try { setTopic(await speakingTopicsAPI.random(part)); }
    catch (e) { setTopic(null); setErr(errText(e)); }
    setLoading(false);
  };
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <Title>Speaking Topic Bank 🎙️</Title>
      <Sub>Random IELTS questions for self-practice. Time yourself, then record your answer on the Speaking page.</Sub>
      <div style={{ ...card, marginBottom: 14 }}>
        <Row style={{ marginBottom: 16 }}>
          {[1, 2, 3].map((p) => (
            <Btn key={p} v={part === p ? 'primary' : 'ghost'} onClick={() => setPart(p)}>Part {p}</Btn>
          ))}
          <Btn onClick={next} disabled={loading} style={{ marginLeft: 'auto' }}>{loading ? 'Loading…' : '🎲 New topic'}</Btn>
        </Row>
        {err && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        {topic ? (
          <div style={{ padding: 18, background: 'var(--bg3)', borderRadius: 12 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Pill>Part {topic.part}</Pill>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Target ≈ {limits[topic.part]}s</span>
            </Row>
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>{topic.question}</p>
            <Row>
              <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: secs > limits[topic.part] ? 'var(--danger)' : 'var(--accent)' }}>{mmss(secs)}</span>
              <Btn v={running ? 'danger' : 'success'} onClick={() => setRunning((r) => !r)}>{running ? '⏹ Stop' : '▶ Start'}</Btn>
              <Btn v="ghost" onClick={() => { setSecs(0); setRunning(false); }}>Reset</Btn>
            </Row>
          </div>
        ) : <div style={{ textAlign: 'center', padding: 28, color: 'var(--muted)', fontSize: 13 }}>Press “New topic” to get a question.</div>}
      </div>
      <div style={{ ...card, fontSize: 12, color: 'var(--muted)' }}>
        Part 1 → short answers (~1 min) · Part 2 → 1 min prep + 2 min talk · Part 3 → extended discussion with reasons and examples.
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — TOPIC BANK
// ═════════════════════════════════════════════════════════════
export function AdminTopicBankPage() {
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({ part: 2, question: '' });
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => speakingTopicsAPI.list().then((d) => setTopics(list(d))).catch((e) => setMsg({ text: errText(e) })), []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    try { await speakingTopicsAPI.create(form); setForm({ part: form.part, question: '' }); setMsg({ ok: true, text: 'Topic added.' }); load(); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  const remove = async (id) => { try { await speakingTopicsAPI.remove(id); load(); } catch (e) { setMsg({ text: errText(e) }); } };

  return (
    <div>
      <Title>Speaking Topic Bank</Title>
      <Sub>Add Part 1/2/3 questions. Students get random ones from this list.</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 16 }}>
        <Row style={{ marginBottom: 10 }}>
          {[1, 2, 3].map((p) => <Btn key={p} v={form.part === p ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, part: p }))}>Part {p}</Btn>)}
        </Row>
        <textarea rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="Type the question…" />
        <Btn onClick={add} disabled={!form.question.trim()}>+ Add topic</Btn>
      </div>
      {topics.length === 0 ? <Empty icon="🎙️" text="No topics yet." /> : topics.map((t) => (
        <div key={t.id} style={{ ...card, marginBottom: 8, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 200 }}><Pill>Part {t.part}</Pill><p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{t.question}</p></div>
            <Btn v="ghost" onClick={() => remove(t.id)}>Delete</Btn>
          </Row>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// STUDENT — MISTAKE LOG
// ═════════════════════════════════════════════════════════════
export function MistakeLogPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ error_text: '', suggestion: '', category: 'grammar' });
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => mistakesAPI.get().then((d) => setRows(list(d))).catch(() => setRows([])), []);
  useEffect(() => { load(); }, [load]);
  const tone = { grammar: 'danger', spelling: 'warn', vocabulary: 'accent', punctuation: 'gold' };

  const add = async () => {
    try { await mistakesAPI.log([form]); setForm({ error_text: '', suggestion: '', category: form.category }); load(); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  const clear = async (id) => { await mistakesAPI.clear(id).catch(() => {}); load(); };

  return (
    <div>
      <Title>Mistake Log 🏷️</Title>
      <Sub>Your recurring errors, most frequent first. Wrong mock-test answers land here automatically; you can log your own too.</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={grid(180)}>
          <div><label style={lbl}>Mistake</label><input style={inp} value={form.error_text} onChange={(e) => setForm((f) => ({ ...f, error_text: e.target.value }))} placeholder="e.g. He go to school" /></div>
          <div><label style={lbl}>Correction</label><input style={inp} value={form.suggestion} onChange={(e) => setForm((f) => ({ ...f, suggestion: e.target.value }))} placeholder="He goes to school" /></div>
          <div><label style={lbl}>Type</label>
            <select style={inp} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {['grammar', 'vocabulary', 'spelling', 'punctuation', 'general'].map((c) => <option key={c}>{c}</option>)}
            </select></div>
        </div>
        <div style={{ marginTop: 12 }}><Btn onClick={add} disabled={!form.error_text.trim()}>+ Log mistake</Btn></div>
      </div>
      {rows.length === 0 ? <Empty icon="✅" text="Nothing logged yet." /> : (
        <div style={grid(260)}>
          {rows.map((m) => (
            <div key={m.id} style={{ ...card, borderLeft: '3px solid var(--danger)', padding: 16 }}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Pill tone={tone[m.category] || 'muted'}>{m.category}</Pill>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{m.frequency || 1}</span>
              </Row>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>“{m.error_text}”</div>
              {m.suggestion && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>→ “{m.suggestion}”</div>}
              <div style={{ marginTop: 10 }}><Btn v="ghost" onClick={() => clear(m.id)} style={{ padding: '4px 10px', fontSize: 11 }}>Mastered ✓</Btn></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// STUDENT — BOOK A 1-ON-1 (solo) SESSION
// ═════════════════════════════════════════════════════════════
export function StudentBookingsPage() {
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => bookingsAPI.getSlots().then((d) => setSlots(list(d))).catch(() => setSlots([])), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, ok) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ text: errText(e) }); }
    await load(); setBusy(false);
  };
  const mine = slots.filter((s) => s.booked_by_me);
  const open = slots.filter((s) => !s.is_booked);

  return (
    <div>
      <Title>1-on-1 Sessions 📅</Title>
      <Sub>Solo training runs once every 2 days. Pick a slot that suits you.</Sub>
      <Flash msg={msg} />
      {mine.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Your bookings</div>
          {mine.map((s) => (
            <div key={s.id} style={{ ...card, marginBottom: 8, padding: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDT(s.start_time)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.duration_min} min</div></div>
                <Btn v="ghost" disabled={busy} onClick={() => act(() => bookingsAPI.cancel(s.id), 'Booking cancelled.')}>Cancel</Btn>
              </Row>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Available slots</div>
      {open.length === 0 ? <Empty icon="📅" text="No open slots right now. Ask your teacher to add some." /> : open.map((s) => (
        <div key={s.id} style={{ ...card, marginBottom: 8, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDT(s.start_time)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.duration_min} min</div></div>
            <Btn disabled={busy} onClick={() => act(() => bookingsAPI.book(s.id), 'Slot booked!')}>Book</Btn>
          </Row>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — SOLO SLOT SCHEDULER
// ═════════════════════════════════════════════════════════════
export function AdminBookingsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ start_date: today, time: '18:00', count: 10, every_n_days: 2, duration_min: 30 });
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => bookingsAPI.getSlots().then((d) => setSlots(list(d))).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = async () => {
    try { const r = await bookingsAPI.generate(form); setMsg({ ok: true, text: `${r.created} slot(s) created.` }); load(); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  const remove = async (id) => { await bookingsAPI.cancel(id).catch(() => {}); load(); };

  return (
    <div>
      <Title>Solo Session Slots</Title>
      <Sub>Create a run of 1-on-1 slots (default: one every 2 days).</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={grid(130)}>
          <div><label style={lbl}>First day</label><input type="date" style={inp} value={form.start_date} onChange={set('start_date')} /></div>
          <div><label style={lbl}>Time</label><input type="time" style={inp} value={form.time} onChange={set('time')} /></div>
          <div><label style={lbl}>How many</label><input type="number" min="1" max="60" style={inp} value={form.count} onChange={set('count')} /></div>
          <div><label style={lbl}>Every N days</label><input type="number" min="1" max="14" style={inp} value={form.every_n_days} onChange={set('every_n_days')} /></div>
          <div><label style={lbl}>Minutes</label><input type="number" min="10" max="180" style={inp} value={form.duration_min} onChange={set('duration_min')} /></div>
        </div>
        <div style={{ marginTop: 12 }}><Btn onClick={generate}>Generate slots</Btn></div>
      </div>
      {slots.length === 0 ? <Empty icon="🗓️" text="No upcoming slots." /> : slots.map((s) => (
        <div key={s.id} style={{ ...card, marginBottom: 8, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDT(s.start_time)} · {s.duration_min} min</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.is_booked ? `Booked by ${s.student_name || 'student'}` : 'Open'}</div></div>
            <Row><Pill tone={s.is_booked ? 'success' : 'muted'}>{s.is_booked ? 'booked' : 'open'}</Pill>
              <Btn v="ghost" onClick={() => remove(s.id)} style={{ padding: '4px 10px', fontSize: 11 }}>Delete</Btn></Row>
          </Row>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — ATTENDANCE
// ═════════════════════════════════════════════════════════════
export function AdminAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [sel, setSel] = useState(null);
  const [roster, setRoster] = useState([]);
  const [att, setAtt] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => { sessionsAPI.getAll().then((d) => setSessions(list(d))).catch((e) => setMsg({ text: errText(e) })); }, []);

  // Roster = the session's batch members, or the solo student, or everyone as a fallback.
  const open = async (s) => {
    setSel(s); setMsg(null);
    try {
      let people = [];
      if (s.batch_id) people = list((await batchesAPI.get(s.batch_id)).members);
      else if (s.student_id) { const all = list(await studentsAPI.getAll()); people = all.filter((x) => x.id === s.student_id); }
      else people = list(await studentsAPI.getAll());
      setRoster(people);
      setAtt(list(await attendanceAPI.forSession(s.id)));
    } catch (e) { setMsg({ text: errText(e) }); }
  };
  const mark = async (studentId, status) => {
    try { await attendanceAPI.mark(sel.id, studentId, status); setAtt(list(await attendanceAPI.forSession(sel.id))); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  const statusOf = (id) => (att.find((a) => a.student_id === id) || {}).status;
  const color = { present: 'var(--success)', absent: 'var(--danger)', late: 'var(--warn)' };

  return (
    <div>
      <Title>Attendance</Title>
      <Sub>Pick a session, then mark each student. Batch sessions list that batch’s members; solo sessions list the student.</Sub>
      <Flash msg={msg} />
      <div style={grid(300)}>
        <div>
          {sessions.length === 0 ? <Empty icon="📅" text="No sessions yet. Create one under Sessions." /> : sessions.map((s) => (
            <div key={s.id} onClick={() => open(s)} style={{ ...card, marginBottom: 8, padding: 14, cursor: 'pointer',
              border: sel && sel.id === s.id ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{fmtDT(s.scheduled_at)} · {s.session_type}</div>
            </div>
          ))}
        </div>
        {sel && (
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>{sel.title}</div>
            {roster.length === 0 ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>No students to mark.</div> : roster.map((st) => (
              <div key={st.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13 }}>{st.name}</span>
                  <Row style={{ gap: 6 }}>
                    {['present', 'late', 'absent'].map((s) => (
                      <button key={s} onClick={() => mark(st.id, s)} style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        border: '1px solid var(--border)', background: statusOf(st.id) === s ? color[s] : 'var(--bg3)',
                        color: statusOf(st.id) === s ? '#fff' : 'var(--muted)' }}>{s}</button>
                    ))}
                  </Row>
                </Row>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — BATCHES (grouped by level / strength)
// ═════════════════════════════════════════════════════════════
const LEVEL_TONE = { beginner: 'warn', intermediate: 'accent', advanced: 'success' };

export function AdminBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ name: '', level: 'intermediate', max_students: 8, schedule: '', zoom_link: '' });
  const [planId, setPlanId] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      setBatches(list(await batchesAPI.getAll()));
      setStudents(list(await studentsAPI.getAll()));
      const p = await plansAPI.getAll(); setPlans(list(p && p.plans ? p.plans : p));
    } catch (e) { setMsg({ text: errText(e) }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const open = async (b) => { try { setSel(await batchesAPI.get(b.id)); } catch (e) { setMsg({ text: errText(e) }); } };
  const run = async (fn, ok, id) => {
    try { await fn(); setMsg({ ok: true, text: ok }); await load(); if (id) setSel(await batchesAPI.get(id)); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  const memberIds = new Set(((sel && sel.members) || []).map((m) => m.id));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <Title>Batches 👥</Title>
      <Sub>Group students by level so each class is taught at the right pace. Set a size limit and a live-class link per batch.</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={grid(170)}>
          <div><label style={lbl}>Name *</label><input style={inp} value={form.name} onChange={set('name')} placeholder="e.g. Band 6→7 Evening" /></div>
          <div><label style={lbl}>Level</label>
            <select style={inp} value={form.level} onChange={set('level')}>{['beginner', 'intermediate', 'advanced'].map((l) => <option key={l}>{l}</option>)}</select></div>
          <div><label style={lbl}>Max students</label><input type="number" min="1" style={inp} value={form.max_students} onChange={set('max_students')} /></div>
          <div><label style={lbl}>Schedule</label><input style={inp} value={form.schedule} onChange={set('schedule')} placeholder="Mon/Wed/Fri 7PM" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Zoom / Meet / Jitsi link</label><input style={inp} value={form.zoom_link} onChange={set('zoom_link')} placeholder="https://meet.jit.si/…" /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn disabled={!form.name.trim()} onClick={() => run(async () => { await batchesAPI.create(form); setForm({ ...form, name: '' }); }, 'Batch created.')}>+ Create batch</Btn>
        </div>
      </div>

      <div style={grid(300)}>
        <div>
          {batches.length === 0 ? <Empty icon="👥" text="No batches yet." /> : batches.map((b) => (
            <div key={b.id} onClick={() => open(b)} style={{ ...card, marginBottom: 8, padding: 14, cursor: 'pointer',
              border: sel && sel.id === b.id ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div><Pill tone={LEVEL_TONE[b.level]}>{b.level}</Pill>
              </Row>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{b.member_count}/{b.max_students} students{b.schedule ? ` · ${b.schedule}` : ''}</div>
            </div>
          ))}
        </div>
        {sel && (
          <div style={card}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{sel.name}</div>
              <Btn v="danger" style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={() => { if (window.confirm('Delete this batch?')) run(async () => { await batchesAPI.remove(sel.id); setSel(null); }, 'Batch deleted.'); }}>Delete</Btn>
            </Row>
            {sel.zoom_link && <a href={sel.zoom_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>Open live class ↗</a>}
            <div style={{ margin: '14px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ASSIGN A PLAN TO THE WHOLE BATCH</div>
            <Row>
              <select style={{ ...inp, flex: 1 }} value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">Choose plan…</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Btn disabled={!planId} onClick={() => run(() => batchesAPI.assignPlan(sel.id, Number(planId)), 'Plan assigned to all members.', sel.id)}>Assign</Btn>
            </Row>
            <div style={{ margin: '16px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>MEMBERS</div>
            {(sel.members || []).length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>No members yet.</div>}
            {(sel.members || []).map((m) => (
              <Row key={m.id} style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{m.name}</span>
                <Btn v="ghost" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => run(() => batchesAPI.removeMember(sel.id, m.id), 'Removed.', sel.id)}>Remove</Btn>
              </Row>
            ))}
            <div style={{ margin: '16px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ADD STUDENT</div>
            {students.filter((s) => !memberIds.has(s.id)).map((s) => (
              <Row key={s.id} style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{s.name}</span>
                <Btn v="outline" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => run(() => batchesAPI.addMember(sel.id, s.id), 'Added.', sel.id)}>Add</Btn>
              </Row>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — ANNOUNCEMENTS
// ═════════════════════════════════════════════════════════════
export function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => announcementsAPI.getAll().then((d) => setItems(list(d))).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const send = async () => {
    try { await announcementsAPI.create(form); setForm({ title: '', content: '' }); setMsg({ ok: true, text: 'Sent to all students.' }); load(); }
    catch (e) { setMsg({ text: errText(e) }); }
  };
  return (
    <div>
      <Title>Announcements 📢</Title>
      <Sub>Shows as a banner on every student’s dashboard and pings them instantly.</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 16 }}>
        <input style={{ ...inp, marginBottom: 10 }} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" />
        <textarea rows={3} style={{ ...inp, resize: 'vertical', marginBottom: 10 }} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Message…" />
        <Btn onClick={send} disabled={!form.content.trim()}>Send to all students</Btn>
      </div>
      {items.length === 0 ? <Empty icon="📢" text="No announcements." /> : items.map((a) => (
        <div key={a.id} style={{ ...card, marginBottom: 8, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{a.content}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{fmtDT(a.created_at)}</div>
            </div>
            <Btn v="ghost" onClick={async () => { await announcementsAPI.remove(a.id).catch(() => {}); load(); }}>Delete</Btn>
          </Row>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// STUDENT — CALENDAR (live sessions + own 1-on-1 bookings) + attendance
// ═════════════════════════════════════════════════════════════
export function CalendarPage() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [events, setEvents] = useState([]);
  const [att, setAtt] = useState(null);
  const [pickDay, setPickDay] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const out = [];
    try {
      list(await sessionsAPI.getAll()).forEach((s) => out.push({ key: `s${s.id}`, when: new Date(s.scheduled_at), title: s.title, kind: s.session_type === 'solo' ? 'Solo' : 'Class', url: s.jitsi_url, sessionId: s.id }));
    } catch (_) { /* no sessions */ }
    try {
      list(await bookingsAPI.getSlots()).filter((b) => b.booked_by_me).forEach((b) => out.push({ key: `b${b.id}`, when: new Date(b.start_time), title: '1-on-1 session', kind: 'Booked' }));
    } catch (_) { /* no bookings */ }
    setEvents(out);
    attendanceAPI.me().then(setAtt).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const y = cursor.getFullYear(); const m = cursor.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const onDay = (d) => events.filter((e) => e.when.getFullYear() === y && e.when.getMonth() === m && e.when.getDate() === d);
  const isToday = (d) => { const t = new Date(); return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d; };
  const selected = pickDay ? onDay(pickDay) : [];

  const join = async (e) => {
    window.open(e.url, '_blank', 'noopener,noreferrer');
    if (e.sessionId) { try { await attendanceAPI.checkIn(e.sessionId); setMsg({ ok: true, text: 'Attendance recorded.' }); load(); } catch (_) { /* ignore */ } }
  };

  return (
    <div>
      <Title>Calendar 🗓️</Title>
      <Sub>Your live classes and 1-on-1 sessions. Joining a class marks you present.</Sub>
      <Flash msg={msg} />
      {att && att.total > 0 && <div style={{ ...card, marginBottom: 14, padding: 14, fontSize: 13 }}>Attendance: <b>{att.attended}/{att.total}</b> sessions ({att.percent}%)</div>}
      <div style={card}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <Btn v="ghost" onClick={() => setCursor(new Date(y, m - 1, 1))}>‹</Btn>
          <div style={{ fontWeight: 700 }}>{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <Btn v="ghost" onClick={() => setCursor(new Date(y, m + 1, 1))}>›</Btn>
        </Row>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{d}</div>)}
          {cells.map((d, i) => d === null ? <div key={i} /> : (
            <button key={i} onClick={() => setPickDay(d)} style={{
              minHeight: 44, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              border: pickDay === d ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: isToday(d) ? 'rgba(20,108,114,.14)' : 'var(--bg3)', color: 'var(--text)', position: 'relative' }}>
              {d}{onDay(d).length > 0 && <span style={{ display: 'block', width: 6, height: 6, borderRadius: 99, background: 'var(--gold)', margin: '2px auto 0' }} />}
            </button>
          ))}
        </div>
      </div>
      {pickDay && (
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{new Date(y, m, pickDay).toLocaleDateString(undefined, { dateStyle: 'full' })}</div>
          {selected.length === 0 ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nothing scheduled.</div> : selected.map((e) => (
            <Row key={e.key} style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.when.toLocaleTimeString(undefined, { timeStyle: 'short' })} · {e.kind}</div></div>
              {e.url && <Btn onClick={() => join(e)}>Join</Btn>}
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PROFILE (student + teacher)
// ═════════════════════════════════════════════════════════════
export function ProfilePage({ user, onUpdated }) {
  const [form, setForm] = useState({ name: user.name || '', zoom_link: user.zoom_link || '' });
  const [msg, setMsg] = useState(null);
  const save = async () => {
    try {
      const u = await apiCall(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      setMsg({ ok: true, text: 'Profile saved.' });
      if (onUpdated) onUpdated({ name: u.name, zoom_link: u.zoom_link });
    } catch (e) { setMsg({ text: errText(e) }); }
  };
  const bands = [['Listening', user.listening_band], ['Reading', user.reading_band], ['Writing', user.writing_band], ['Speaking', user.speaking_band]];
  return (
    <div>
      <Title>My Profile</Title>
      <Sub>{user.email} · {user.role === 'admin' ? 'Teacher' : 'Student'}</Sub>
      <Flash msg={msg} />
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ ...grid(220), marginBottom: 12 }}>
          <div><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={lbl}>{user.role === 'admin' ? 'Your default live-class link' : 'Preferred meeting link (optional)'}</label>
            <input style={inp} value={form.zoom_link} onChange={(e) => setForm((f) => ({ ...f, zoom_link: e.target.value }))} placeholder="https://…" /></div>
        </div>
        <Btn onClick={save} disabled={!form.name.trim()}>Save</Btn>
      </div>
      {user.role !== 'admin' && (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>🔥 {user.streak || 0}-day streak</div>
          <div style={grid(110)}>
            {bands.map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg3)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{v ?? '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PROGRESS REPORT (printable → "Save as PDF" from the browser; no library)
// ═════════════════════════════════════════════════════════════
export function ReportView({ report }) {
  if (!report) return null;
  const { student, plan, completion, bands, streak, attendance, band_history: hist, top_mistakes: mistakes, weak_areas: weak } = report;
  const Stat = ({ k, v }) => (
    <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{v ?? '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</div>
    </div>
  );
  return (
    <div id="printable-report" style={{ ...card }}>
      <div className="playfair" style={{ fontSize: 22, fontWeight: 700 }}>IELTS Progress Report</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        {student.name} · {student.email} · generated {new Date(report.generated_at + 'Z').toLocaleDateString()}
      </div>
      {plan ? <div style={{ fontSize: 13, marginBottom: 12 }}>Plan: <b>{plan.name}</b> — day {Math.min(plan.current_day, plan.duration_days)} of {plan.duration_days}</div>
        : <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--muted)' }}>No active plan.</div>}
      <div style={{ ...grid(110), marginBottom: 16 }}>
        <Stat k="Overall band" v={bands.overall || null} /><Stat k="Listening" v={bands.listening} /><Stat k="Reading" v={bands.reading} />
        <Stat k="Writing" v={bands.writing} /><Stat k="Speaking" v={bands.speaking} />
      </div>
      <div style={{ ...grid(110), marginBottom: 16 }}>
        <Stat k="Tasks done" v={`${completion.done}/${completion.total}`} /><Stat k="Completion" v={`${completion.percent}%`} />
        <Stat k="Streak" v={`${streak} 🔥`} /><Stat k="Attendance" v={attendance.percent != null ? `${attendance.percent}%` : null} />
      </div>
      {weak.length > 0 && <div style={{ fontSize: 13, marginBottom: 12 }}>Focus areas (set by teacher): {weak.map((w) => <Pill key={w} tone="warn">{w}</Pill>)}</div>}
      {hist.length > 1 && (
        <div style={{ height: 180, marginBottom: 16 }}>
          <ResponsiveContainer><LineChart data={hist}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={[0, 9]} tick={{ fontSize: 10 }} /><Tooltip />
            <Line type="monotone" dataKey="band" stroke="var(--accent)" strokeWidth={2} dot /></LineChart></ResponsiveContainer>
        </div>
      )}
      {mistakes.length > 0 && (
        <div><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Most frequent mistakes</div>
          {mistakes.map((m) => <div key={m.id} style={{ fontSize: 12, marginBottom: 3 }}>• “{m.error_text}” ×{m.frequency}{m.suggestion ? ` → “${m.suggestion}”` : ''}</div>)}</div>
      )}
    </div>
  );
}

export function ReportPage() {
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { reportsAPI.me().then(setReport).catch((e) => setErr(errText(e))); }, []);
  return (
    <div>
      <Row className="no-print" style={{ justifyContent: 'space-between' }}>
        <div><Title>Progress Report 📄</Title><Sub>Print this page or choose “Save as PDF” in the print dialog.</Sub></div>
        <Btn onClick={() => window.print()} disabled={!report}>🖨 Print / Save PDF</Btn>
      </Row>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      <ReportView report={report} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEACHER — ANALYTICS (+ per-student report)
// ═════════════════════════════════════════════════════════════
export function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    reportsAPI.analytics().then(setData).catch((e) => setErr(errText(e)));
    studentsAPI.getAll().then((d) => setStudents(list(d))).catch(() => {});
  }, []);
  const bandRows = data ? Object.entries(data.avg_bands).map(([k, v]) => ({ skill: k, band: v || 0 })) : [];
  const Stat = ({ k, v }) => <div style={{ ...card, textAlign: 'center', padding: 16 }}><div style={{ fontSize: 24, fontWeight: 700 }}>{v ?? '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</div></div>;

  return (
    <div>
      <Title>Analytics 📈</Title>
      <Sub>Submissions, bands, batches and who needs a nudge.</Sub>
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}
      {data && (<>
        <div style={{ ...grid(130), marginBottom: 14 }}>
          <Stat k="Students" v={data.students} /><Stat k="Pending reviews" v={data.pending_reviews} />
          <Stat k="Avg band" v={data.avg_overall || null} /><Stat k="Attendance" v={data.attendance_percent != null ? `${data.attendance_percent}%` : null} />
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Submissions — last 14 days</div>
          <div style={{ height: 180 }}><ResponsiveContainer><BarChart data={data.submission_trend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip />
            <Bar dataKey="submissions" fill="var(--accent)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Average band by skill</div>
          <div style={{ height: 160 }}><ResponsiveContainer><BarChart data={bandRows}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="skill" tick={{ fontSize: 11 }} /><YAxis domain={[0, 9]} tick={{ fontSize: 10 }} /><Tooltip />
            <Bar dataKey="band" fill="var(--gold)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Batches</div>
          {data.batches.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No batches yet.</div> : data.batches.map((b) => (
            <Row key={b.id} style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span>{b.name} <Pill tone={LEVEL_TONE[b.level]}>{b.level}</Pill></span>
              <span style={{ color: 'var(--muted)' }}>{b.students} students · avg band {b.avg_score ?? '—'}</span>
            </Row>
          ))}
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Needs a nudge (inactive 4+ days)</div>
          {data.at_risk.length === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>Everyone is active 🎉</div> : data.at_risk.map((s) => (
            <div key={s.id} style={{ fontSize: 13, padding: '4px 0' }}>{s.name} <span style={{ color: 'var(--muted)', fontSize: 11 }}>· last active {s.last_active || 'never'}</span></div>
          ))}
        </div>
      </>)}
      <div style={card}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Student progress report</div>
        <Row>
          <select style={{ ...inp, flex: 1 }} defaultValue="" onChange={(e) => e.target.value && reportsAPI.student(e.target.value).then(setReport).catch((x) => setErr(errText(x)))}>
            <option value="">Select a student…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {report && <Btn onClick={() => window.print()}>🖨 Print / PDF</Btn>}
        </Row>
        {report && <div style={{ marginTop: 14 }}><ReportView report={report} /></div>}
      </div>
    </div>
  );
}
