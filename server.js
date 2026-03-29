const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

const db = new sqlite3.Database(path.join(__dirname, 'internship.db'));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// หน้าแรก
app.get('/', (req, res) => {
  res.send('🚀 Internship System API is running!');
});

// helper
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

// --------------------
// LOOKUP TABLES
// --------------------
app.get('/api/faculties', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM faculty'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/company-types', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM company_type'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/visit-statuses', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM visit_status'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// STUDENTS
// --------------------
app.get('/api/students', async (req, res) => {
  try {
    const rows = await query(`
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
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { student_id, first_name, last_name, faculty_id } = req.body;
    await run(
      'INSERT INTO students VALUES (?,?,?,?)',
      [student_id, first_name, last_name, faculty_id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { first_name, last_name, faculty_id } = req.body;
    await run(
      'UPDATE students SET first_name=?, last_name=?, faculty_id=? WHERE student_id=?',
      [first_name, last_name, faculty_id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await run('DELETE FROM students WHERE student_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// COMPANIES
// --------------------
app.get('/api/companies', async (req, res) => {
  try {
    const rows = await query(`
      SELECT c.*, ct.type_name 
      FROM companies c
      LEFT JOIN company_type ct ON ct.type_id = c.type_id
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const { company_name, latitude, longitude, type_id } = req.body;
    const result = await run(
      'INSERT INTO companies (company_name, latitude, longitude, type_id) VALUES (?,?,?,?)',
      [company_name, latitude, longitude, type_id]
    );
    res.json({ success: true, company_id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const { company_name, latitude, longitude, type_id } = req.body;
    await run(
      'UPDATE companies SET company_name=?, latitude=?, longitude=?, type_id=? WHERE company_id=?',
      [company_name, latitude, longitude, type_id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    await run('DELETE FROM companies WHERE company_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// TEACHERS
// --------------------
app.get('/api/teachers', async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.*, f.faculty_name 
      FROM teachers t
      LEFT JOIN faculty f ON f.faculty_id = t.faculty_id
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { teacher_name, faculty_id } = req.body;
    const result = await run(
      'INSERT INTO teachers (teacher_name, faculty_id) VALUES (?,?)',
      [teacher_name, faculty_id]
    );
    res.json({ success: true, teacher_id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/teachers/:id', async (req, res) => {
  try {
    const { teacher_name, faculty_id } = req.body;
    await run(
      'UPDATE teachers SET teacher_name=?, faculty_id=? WHERE teacher_id=?',
      [teacher_name, faculty_id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    await run('DELETE FROM teachers WHERE teacher_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// INTERNSHIPS
// --------------------
app.get('/api/internships', async (req, res) => {
  try {
    const rows = await query(`
      SELECT i.*, s.first_name, s.last_name, c.company_name
      FROM internships i
      LEFT JOIN students s ON s.student_id = i.student_id
      LEFT JOIN companies c ON c.company_id = i.company_id
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/internships', async (req, res) => {
  try {
    const { student_id, company_id, academic_year } = req.body;
    const result = await run(
      'INSERT INTO internships (student_id, company_id, academic_year) VALUES (?,?,?)',
      [student_id, company_id, academic_year]
    );
    res.json({ success: true, internship_id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// VISITS
// --------------------
app.get('/api/visits', async (req, res) => {
  try {
    const rows = await query(`
      SELECT v.*, vs.status_name, t.teacher_name,
             s.first_name, s.last_name, c.company_name
      FROM visits v
      LEFT JOIN visit_status vs ON vs.status_id = v.status_id
      LEFT JOIN teachers t ON t.teacher_id = v.teacher_id
      LEFT JOIN internships i ON i.internship_id = v.internship_id
      LEFT JOIN students s ON s.student_id = i.student_id
      LEFT JOIN companies c ON c.company_id = i.company_id
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const { internship_id, teacher_id, visit_date, status_id } = req.body;
    const result = await run(
      'INSERT INTO visits (internship_id, teacher_id, visit_date, status_id) VALUES (?,?,?,?)',
      [internship_id, teacher_id, visit_date, status_id]
    );
    res.json({ success: true, visit_id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/visits/:id', async (req, res) => {
  try {
    const { teacher_id, visit_date, status_id } = req.body;
    await run(
      'UPDATE visits SET teacher_id=?, visit_date=?, status_id=? WHERE visit_id=?',
      [teacher_id, visit_date, status_id, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// EVALUATIONS
// --------------------
app.get('/api/evaluations', async (req, res) => {
  try {
    const rows = await query(`
      SELECT e.*, v.visit_date, t.teacher_name,
             s.first_name, s.last_name
      FROM evaluations e
      LEFT JOIN visits v ON v.visit_id = e.visit_id
      LEFT JOIN teachers t ON t.teacher_id = v.teacher_id
      LEFT JOIN internships i ON i.internship_id = v.internship_id
      LEFT JOIN students s ON s.student_id = i.student_id
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const { visit_id, score, problem_found } = req.body;
    const result = await run(
      'INSERT INTO evaluations (visit_id, score, problem_found) VALUES (?,?,?)',
      [visit_id, score, problem_found]
    );
    res.json({ success: true, evaluation_id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/evaluations/:id', async (req, res) => {
  try {
    const { score, problem_found } = req.body;
    await run(
      'UPDATE evaluations SET score=?, problem_found=? WHERE evaluation_id=?',
      [score, problem_found, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// PORT
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});