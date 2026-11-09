import { useEffect, useRef, useState } from 'react';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function api(path, options) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Something went wrong');
  return data;
}

const EXAMPLES = [
  'I need a pack of gel pens for the team',
  'Get a whiteboard for the meeting room',
  'Buy an ergonomic office chair',
  'Buy wireless headphones',
];

export default function App() {
  const [mandate, setMandate] = useState(null);
  const [mandateText, setMandateText] = useState(
    'Buy office supplies for my team. Max 50 dollars per purchase, 200 dollars per month, only stationery and office supplies. Ask me before anything above 30 dollars.'
  );
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const ran = useRef(false);

  async function load() {
    const [m, t, a] = await Promise.all([
      api('/api/mandate'),
      api('/api/tasks'),
      api('/api/tasks/audit/all'),
    ]);
    setMandate(m);
    setTasks(t);
    setAudit(a);
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname === '/success' && params.get('token')) {
        try {
          await api('/api/payments/capture', {
            method: 'POST',
            body: JSON.stringify({ orderId: params.get('token') }),
          });
          setMsg('Payment completed on the PayPal sandbox.');
        } catch (e) {
          setMsg(e.message);
        }
        window.history.replaceState({}, '', '/');
      }
      load().catch((e) => setMsg(e.message));
    })();
  }, []);

  async function run(label, fn) {
    setBusy(label);
    setMsg('');
    try {
      await fn();
      await load();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy('');
  }

  const saveMandate = () =>
    run('mandate', () => api('/api/mandate', { method: 'POST', body: JSON.stringify({ text: mandateText }) }));

  const sendTask = (text) =>
    run('task', async () => {
      await api('/api/tasks', { method: 'POST', body: JSON.stringify({ text }) });
      setTaskText('');
    });

  const decide = (id, action) =>
    run(action, () => api(`/api/tasks/${id}/${action}`, { method: 'POST' }));

  const p = mandate && mandate.policy;

  return (
    <div className="wrap">
      <h1>PayGuard Agent</h1>
      <p className="sub">Give your AI a wallet, not a blank cheque.</p>

      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <h2>1. Your spending mandate</h2>
        <textarea rows={3} value={mandateText} onChange={(e) => setMandateText(e.target.value)} />
        <div className="row">
          <button onClick={saveMandate} disabled={!!busy}>
            {busy === 'mandate' ? 'Reading your rules...' : 'Create policy'}
          </button>
        </div>
        {p && (
          <div className="policy">
            <div>Per purchase: <b>${p.per_purchase_limit}</b></div>
            <div>Monthly: <b>${p.monthly_limit}</b></div>
            <div>Ask me above: <b>${p.approval_threshold}</b></div>
            <div>Categories: <b>{p.allowed_categories.join(', ')}</b></div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>2. Give the agent a task</h2>
        <input
          placeholder="e.g. I need sticky notes for the team"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
        />
        <div className="row">
          <button onClick={() => sendTask(taskText)} disabled={!!busy || !taskText.trim()}>
            {busy === 'task' ? 'Agent is thinking...' : 'Send to agent'}
          </button>
        </div>
        <div className="row chips">
          {EXAMPLES.map((ex) => (
            <button key={ex} disabled={!!busy} onClick={() => sendTask(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>3. Agent activity</h2>
        {tasks.length === 0 && <div className="muted">No tasks yet.</div>}
        {tasks.map((t) => (
          <div className="task" key={t._id}>
            <div><b>{t.text}</b></div>
            {t.proposal && (
              <div className="muted">
                Agent chose: {t.proposal.quantity} x {t.proposal.name} ({t.proposal.vendor}), total ${t.proposal.total}
              </div>
            )}
            <div style={{ margin: '6px 0' }}>
              {t.decision && <span className={`badge ${t.decision}`}>{t.decision.replace('_', ' ')}</span>}{' '}
              <span className={`badge ${t.status}`}>{t.status.replace('_', ' ')}</span>
            </div>
            {t.reason && <div className="muted">{t.reason}</div>}
            <div className="row">
              {t.status === 'PENDING_APPROVAL' && (
                <>
                  <button onClick={() => decide(t._id, 'approve')} disabled={!!busy}>Approve</button>
                  <button className="danger" onClick={() => decide(t._id, 'reject')} disabled={!!busy}>Reject</button>
                </>
              )}
              {t.status === 'AWAITING_PAYMENT' && t.approveUrl && (
                <a className="pay" href={t.approveUrl}>Pay with PayPal (sandbox)</a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card audit">
        <h2>4. Audit trail</h2>
        {audit.slice(0, 20).map((a) => (
          <div key={a._id}>
            <span className="muted">{new Date(a.createdAt).toLocaleTimeString()}</span>{' '}
            <b>{a.event}</b>: {a.detail}
          </div>
        ))}
      </div>
    </div>
  );
}