const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('internship.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INTEGER PRIMARY KEY,
    faculty_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS company_type (
    type_id INTEGER PRIMARY KEY,
    type_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visit_status (
    status_id INTEGER PRIMARY KEY,
    status_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    faculty_id INTEGER REFERENCES faculty(faculty_id)
  );

  CREATE TABLE IF NOT EXISTS companies (
    company_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    type_id INTEGER REFERENCES company_type(type_id)
  );

  CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_name TEXT NOT NULL,
    faculty_id INTEGER REFERENCES faculty(faculty_id)
  );

  CREATE TABLE IF NOT EXISTS internships (
    internship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT REFERENCES students(student_id),
    company_id INTEGER REFERENCES companies(company_id),
    academic_year INTEGER
  );

  CREATE TABLE IF NOT EXISTS visits (
    visit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    internship_id INTEGER REFERENCES internships(internship_id),
    teacher_id INTEGER REFERENCES teachers(teacher_id),
    visit_date TEXT,
    status_id INTEGER REFERENCES visit_status(status_id)
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    evaluation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER REFERENCES visits(visit_id),
    score INTEGER,
    problem_found TEXT
  );
`);
const iconv = require('iconv-lite');
function readCSV(filename) {
  const buf = fs.readFileSync(filename);
  const text = iconv.decode(buf, 'tis620');
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

// Import ตามลำดับ (ต้อง import ตารางหลักก่อน)
const faculty = readCSV('Faculty.csv');
const insFaculty = db.prepare('INSERT OR IGNORE INTO faculty VALUES (?,?)');
faculty.forEach(r => insFaculty.run(r.faculty_id, r.faculty_name));
console.log(`✅ faculty: ${faculty.length} rows`);

const companyType = readCSV('Company_Type.csv');
const insType = db.prepare('INSERT OR IGNORE INTO company_type VALUES (?,?)');
companyType.forEach(r => insType.run(r.type_id, r.type_name));
console.log(`✅ company_type: ${companyType.length} rows`);

const visitStatus = readCSV('Visit_Status.csv');
const insStatus = db.prepare('INSERT OR IGNORE INTO visit_status VALUES (?,?)');
visitStatus.forEach(r => insStatus.run(r.status_id, r.status_name));
console.log(`✅ visit_status: ${visitStatus.length} rows`);

const students = readCSV('Student.csv');
const insStudent = db.prepare('INSERT OR IGNORE INTO students VALUES (?,?,?,?)');
students.forEach(r => insStudent.run(r.student_id, r.first_name, r.last_name, r.faculty_id));
console.log(`✅ students: ${students.length} rows`);

const companies = readCSV('Company.csv');
const insCompany = db.prepare('INSERT OR IGNORE INTO companies (company_id,company_name,latitude,longitude,type_id) VALUES (?,?,?,?,?)');
companies.forEach(r => insCompany.run(r.company_id, r.company_name, r.latitude, r.longitude, r.type_id));
console.log(`✅ companies: ${companies.length} rows`);

const teachers = readCSV('Teacher.csv');
const insTeacher = db.prepare('INSERT OR IGNORE INTO teachers (teacher_id,teacher_name,faculty_id) VALUES (?,?,?)');
teachers.forEach(r => insTeacher.run(r.teacher_id, r.teacher_name, r.faculty_id));
console.log(`✅ teachers: ${teachers.length} rows`);

const internships = readCSV('Internship.csv');
const insInternship = db.prepare('INSERT OR IGNORE INTO internships (internship_id,student_id,company_id,academic_year) VALUES (?,?,?,?)');
internships.forEach(r => insInternship.run(r.internship_id, r.student_id, r.company_id, r.academic_year));
console.log(`✅ internships: ${internships.length} rows`);

const visits = readCSV('Visit.csv');
const insVisit = db.prepare('INSERT OR IGNORE INTO visits (visit_id,internship_id,teacher_id,visit_date,status_id) VALUES (?,?,?,?,?)');
visits.forEach(r => insVisit.run(r.visit_id, r.internship_id, r.teacher_id, r.visit_date, r.status_id));
console.log(`✅ visits: ${visits.length} rows`);

const evaluations = readCSV('Evaluation.csv');
const insEval = db.prepare('INSERT OR IGNORE INTO evaluations (evaluation_id,visit_id,score,problem_found) VALUES (?,?,?,?)');
evaluations.forEach(r => insEval.run(r.evaluation_id, r.visit_id, r.score, r.problem_found));
console.log(`✅ evaluations: ${evaluations.length} rows`);

console.log('\n🎉 Migration สำเร็จ!');