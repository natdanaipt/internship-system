const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const db = new Database('internship.db');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ────────────────────────────────
// LOOKUP TABLES
// ────────────────────────────────
app.get('/api/faculties', (req, res) => {
  res.json(db.prepare('SELECT * FROM faculty').all());
});

app.get('/api/company-types', (req, res) => {
  res.json(db.prepare('SELECT * FROM company_type').all());
});

app.get('/api/visit-statuses', (req, res) => {
  res.json(db.prepare('SELECT * FROM visit_status').all());
});

// ────────────────────────────────
// STUDENTS
// ────────────────────────────────
app.get('/api/students', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, f.faculty_name,
           i.internship_id, i.company_id, i.academic_year,
           c.company_name, c.latitude, c.longitude, c.type_id,
           ct.type_name,
           v.visit_id, v.teacher_id, v.visit_date, v.status_id,
           vs.status_name,
           t.teacher_name,
           e.evaluation_id, e.score, e.problem_found
    FROM students s
    LEFT JOIN faculty f ON f.faculty_id = s.faculty_id
    LEFT JOIN internships i ON i.student_id = s.student_id
    LEFT JOIN companies c ON c.company_id = i.company_id
    LEFT JOIN company_type ct ON ct.type_id = c.type_id
    LEFT JOIN visits v ON v.internship_id = i.internship_id
    LEFT JOIN visit_status vs ON vs.status_id = v.status_id
    LEFT JOIN teachers t ON t.teacher_id = v.teacher_id
    LEFT JOIN evaluations e ON e.visit_id = v.visit_id
  `).all();
  res.json(rows);
});

app.post('/api/students', (req, res) => {
  const { student_id, first_name, last_name, faculty_id } = req.body;
  try {
    db.prepare('INSERT INTO students VALUES (?,?,?,?)').run(student_id, first_name, last_name, faculty_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  const { first_name, last_name, faculty_id } = req.body;
  db.prepare('UPDATE students SET first_name=?, last_name=?, faculty_id=? WHERE student_id=?')
    .run(first_name, last_name, faculty_id, req.params.id);
  res.json({ success: true });
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE student_id=?').run(req.params.id);
  res.json({ success: true });
});

// ────────────────────────────────
// COMPANIES
// ────────────────────────────────
app.get('/api/companies', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, ct.type_name FROM companies c
    LEFT JOIN company_type ct ON ct.type_id = c.type_id
  `).all();
  res.json(rows);
});

app.post('/api/companies', (req, res) => {
  const { company_name, latitude, longitude, type_id } = req.body;
  const result = db.prepare('INSERT INTO companies (company_name,latitude,longitude,type_id) VALUES (?,?,?,?)')
    .run(company_name, latitude, longitude, type_id);
  res.json({ success: true, company_id: result.lastInsertRowid });
});

app.put('/api/companies/:id', (req, res) => {
  const { company_name, latitude, longitude, type_id } = req.body;
  db.prepare('UPDATE companies SET company_name=?,latitude=?,longitude=?,type_id=? WHERE company_id=?')
    .run(company_name, latitude, longitude, type_id, req.params.id);
  res.json({ success: true });
});

app.delete('/api/companies/:id', (req, res) => {
  db.prepare('DELETE FROM companies WHERE company_id=?').run(req.params.id);
  res.json({ success: true });
});

// ────────────────────────────────
// TEACHERS
// ────────────────────────────────
app.get('/api/teachers', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, f.faculty_name FROM teachers t
    LEFT JOIN faculty f ON f.faculty_id = t.faculty_id
  `).all();
  res.json(rows);
});

app.post('/api/teachers', (req, res) => {
  const { teacher_name, faculty_id } = req.body;
  const result = db.prepare('INSERT INTO teachers (teacher_name,faculty_id) VALUES (?,?)')
    .run(teacher_name, faculty_id);
  res.json({ success: true, teacher_id: result.lastInsertRowid });
});

app.put('/api/teachers/:id', (req, res) => {
  const { teacher_name, faculty_id } = req.body;
  db.prepare('UPDATE teachers SET teacher_name=?,faculty_id=? WHERE teacher_id=?')
    .run(teacher_name, faculty_id, req.params.id);
  res.json({ success: true });
});

app.delete('/api/teachers/:id', (req, res) => {
  db.prepare('DELETE FROM teachers WHERE teacher_id=?').run(req.params.id);
  res.json({ success: true });
});

// ────────────────────────────────
// INTERNSHIPS
// ────────────────────────────────
app.get('/api/internships', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, s.first_name, s.last_name, c.company_name
    FROM internships i
    LEFT JOIN students s ON s.student_id = i.student_id
    LEFT JOIN companies c ON c.company_id = i.company_id
  `).all();
  res.json(rows);
});

app.post('/api/internships', (req, res) => {
  const { student_id, company_id, academic_year } = req.body;
  const result = db.prepare('INSERT INTO internships (student_id,company_id,academic_year) VALUES (?,?,?)')
    .run(student_id, company_id, academic_year);
  res.json({ success: true, internship_id: result.lastInsertRowid });
});

// ────────────────────────────────
// VISITS
// ────────────────────────────────
app.get('/api/visits', (req, res) => {
  const rows = db.prepare(`
    SELECT v.*, vs.status_name, t.teacher_name,
           s.first_name, s.last_name, c.company_name
    FROM visits v
    LEFT JOIN visit_status vs ON vs.status_id = v.status_id
    LEFT JOIN teachers t ON t.teacher_id = v.teacher_id
    LEFT JOIN internships i ON i.internship_id = v.internship_id
    LEFT JOIN students s ON s.student_id = i.student_id
    LEFT JOIN companies c ON c.company_id = i.company_id
  `).all();
  res.json(rows);
});

app.post('/api/visits', (req, res) => {
  const { internship_id, teacher_id, visit_date, status_id } = req.body;
  const result = db.prepare('INSERT INTO visits (internship_id,teacher_id,visit_date,status_id) VALUES (?,?,?,?)')
    .run(internship_id, teacher_id, visit_date, status_id);
  res.json({ success: true, visit_id: result.lastInsertRowid });
});

app.put('/api/visits/:id', (req, res) => {
  const { teacher_id, visit_date, status_id } = req.body;
  db.prepare('UPDATE visits SET teacher_id=?,visit_date=?,status_id=? WHERE visit_id=?')
    .run(teacher_id, visit_date, status_id, req.params.id);
  res.json({ success: true });
});

// ────────────────────────────────
// EVALUATIONS
// ────────────────────────────────
app.get('/api/evaluations', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, v.visit_date, t.teacher_name,
           s.first_name, s.last_name
    FROM evaluations e
    LEFT JOIN visits v ON v.visit_id = e.visit_id
    LEFT JOIN teachers t ON t.teacher_id = v.teacher_id
    LEFT JOIN internships i ON i.internship_id = v.internship_id
    LEFT JOIN students s ON s.student_id = i.student_id
  `).all();
  res.json(rows);
});

app.post('/api/evaluations', (req, res) => {
  const { visit_id, score, problem_found } = req.body;
  const result = db.prepare('INSERT INTO evaluations (visit_id,score,problem_found) VALUES (?,?,?)')
    .run(visit_id, score, problem_found);
  res.json({ success: true, evaluation_id: result.lastInsertRowid });
});

app.put('/api/evaluations/:id', (req, res) => {
  const { score, problem_found } = req.body;
  db.prepare('UPDATE evaluations SET score=?,problem_found=? WHERE evaluation_id=?')
    .run(score, problem_found, req.params.id);
  res.json({ success: true });
});

app.listen(3000, () => console.log('🚀 Server รันที่ http://localhost:3000'));