/**
 * server.js — бэкенд ЦЦР.
 *
 * Маршруты:
 *   POST /api/leads            — приём заявки с публичной формы сайта (без авторизации)
 *   POST /api/login            — вход админа (admin/admin по умолчанию) → JWT в httpOnly cookie
 *   POST /api/logout           — выход
 *   GET  /api/me               — проверка сессии
 *   GET  /api/leads            — список клиентов (только админ)
 *   GET  /api/stats            — счётчики по статусам (только админ)
 *   PATCH /api/leads/:id       — смена статуса / комментария / оценки (только админ)
 *
 * Креды БД и админа — в .env. Один админ задаётся ADMIN_USERNAME/ADMIN_PASSWORD.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const ALLOWED_STATUSES = ['new', 'in_progress', 'on_hold', 'served', 'rejected'];

// ── Middleware ────────────────────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : true,   // в dev можно true; на проде укажи домены
  credentials: true,
}));
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

// Раздаём админку как статику (admin.html лежит рядом в /public)
app.use(express.static(path.join(__dirname, 'public')));

// Ограничение частоты на чувствительные маршруты
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const formLimiter  = rateLimit({ windowMs: 60 * 1000, max: 10 });

// ── Авторизация ───────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.cookies && req.cookies.ddc_token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Сессия истекла' });
  }
}

app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ u: username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie('ddc_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    });
    return res.json({ ok: true, username });
  }
  return res.status(401).json({ error: 'Неверный логин или пароль' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('ddc_token');
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ username: req.admin.u, role: req.admin.role });
});

// ── Публичный приём заявки с формы сайта ──────────────────────────────────────
app.post('/api/leads', formLimiter, async (req, res) => {
  const { full_name, email, phone, subject, message } = req.body || {};
  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ error: 'Укажите ФИО' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO leads (full_name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [
        String(full_name).trim().slice(0, 300),
        (email || '').trim().slice(0, 200),
        (phone || '').trim().slice(0, 60),
        (subject || '').trim().slice(0, 300),
        (message || '').trim().slice(0, 4000),
      ]
    );
    res.status(201).json({ ok: true, id: rows[0].id, created_at: rows[0].created_at });
  } catch (e) {
    console.error('POST /api/leads:', e.message);
    res.status(500).json({ error: 'Не удалось сохранить заявку' });
  }
});

// ── Админ: список клиентов ────────────────────────────────────────────────────
app.get('/api/leads', auth, async (req, res) => {
  const { status, q } = req.query;
  const where = [];
  const params = [];
  if (status && ALLOWED_STATUSES.includes(status)) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().toLowerCase()}%`);
    const i = params.length;
    where.push(`(LOWER(full_name) LIKE $${i} OR LOWER(email) LIKE $${i} OR LOWER(phone) LIKE $${i})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const { rows } = await db.query(
      `SELECT id, full_name, email, phone, subject, message, status,
              admin_comment, rating, created_at, updated_at
       FROM leads ${clause}
       ORDER BY created_at DESC
       LIMIT 500`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/leads:', e.message);
    res.status(500).json({ error: 'Ошибка чтения из базы' });
  }
});

// ── Админ: счётчики ───────────────────────────────────────────────────────────
app.get('/api/stats', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status`
    );
    const byStatus = Object.fromEntries(ALLOWED_STATUSES.map(s => [s, 0]));
    let total = 0;
    rows.forEach(r => { byStatus[r.status] = r.count; total += r.count; });
    res.json({
      total,
      new: byStatus.new,
      in_progress: byStatus.in_progress,
      on_hold: byStatus.on_hold,
      served: byStatus.served,
      rejected: byStatus.rejected,
    });
  } catch (e) {
    console.error('GET /api/stats:', e.message);
    res.status(500).json({ error: 'Ошибка чтения статистики' });
  }
});

// ── Админ: обновление клиента (статус / комментарий / оценка) ─────────────────
app.patch('/api/leads/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Некорректный id' });

  const sets = [];
  const params = [];
  const { status, admin_comment, rating } = req.body || {};

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }
    params.push(status); sets.push(`status = $${params.length}`);
  }
  if (admin_comment !== undefined) {
    params.push(String(admin_comment).slice(0, 4000));
    sets.push(`admin_comment = $${params.length}`);
  }
  if (rating !== undefined) {
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 0 || r > 5) {
      return res.status(400).json({ error: 'Оценка должна быть 0..5' });
    }
    params.push(r); sets.push(`rating = $${params.length}`);
  }
  if (!sets.length) return res.status(400).json({ error: 'Нет полей для обновления' });

  params.push(id);
  try {
    const { rows } = await db.query(
      `UPDATE leads SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, full_name, email, phone, subject, message, status,
                 admin_comment, rating, created_at, updated_at`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Клиент не найден' });
    res.json(rows[0]);
  } catch (e) {
    console.error('PATCH /api/leads:', e.message);
    res.status(500).json({ error: 'Не удалось обновить' });
  }
});

// Health-check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`ЦЦР backend слушает http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin.html`);
});
