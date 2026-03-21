from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

VERSION = '1.0.0'
DB_PATH = 'data/accomplishments.db'


DEFAULT_OBJECTIVES = [
    'Simplification',
    'Efficiency & Growth',
    'Streamlined Delivery',
    'Velocity & Innovation',
    'Next Gen Architecture',
    'Quality',
    'Security'
]


def init_db():
    import os
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS accomplishments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  objective TEXT,
                  quarter INTEGER NOT NULL,
                  fiscal_year INTEGER NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    try:
        c.execute('ALTER TABLE accomplishments ADD COLUMN objective TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass

    c.execute('''CREATE TABLE IF NOT EXISTS objectives
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL UNIQUE,
                  sort_order INTEGER NOT NULL DEFAULT 0)''')

    c.execute('SELECT COUNT(*) FROM objectives')
    if c.fetchone()[0] == 0:
        for i, obj in enumerate(DEFAULT_OBJECTIVES):
            c.execute('INSERT INTO objectives (name, sort_order) VALUES (?, ?)', (obj, i))
        conn.commit()

    c.execute('''CREATE TABLE IF NOT EXISTS settings
                 (key TEXT PRIMARY KEY, value TEXT NOT NULL)''')
    c.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
              ('fy_start_month', '10'))
    c.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
              ('user_name', ''))
    conn.commit()
    conn.close()


def get_fy_start_month():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT value FROM settings WHERE key='fy_start_month'")
    row = c.fetchone()
    conn.close()
    return int(row[0]) if row else 10


def get_fiscal_year_quarter(date=None, start_month=None):
    if date is None:
        date = datetime.now()
    if start_month is None:
        start_month = get_fy_start_month()

    month = date.month
    year = date.year

    # Months since FY start (wrapping around)
    offset = (month - start_month) % 12
    quarter = (offset // 3) + 1
    # FY is labeled by the year it ends in (if start >= month, we're in next year's FY)
    if month >= start_month:
        fiscal_year = year + 1
    else:
        fiscal_year = year

    return fiscal_year, quarter


@app.route('/api/accomplishments', methods=['GET'])
def get_accomplishments():
    quarter = request.args.get('quarter', type=int)
    fiscal_year = request.args.get('fiscal_year', type=int)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if quarter and fiscal_year:
        c.execute('SELECT * FROM accomplishments WHERE quarter=? AND fiscal_year=? ORDER BY created_at DESC',
                  (quarter, fiscal_year))
    else:
        c.execute(
            'SELECT * FROM accomplishments ORDER BY fiscal_year DESC, quarter DESC, created_at DESC')

    accomplishments = [dict(row) for row in c.fetchall()]
    conn.close()

    return jsonify(accomplishments)


@app.route('/api/accomplishments', methods=['POST'])
def create_accomplishment():
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    objective = data.get('objective', '')
    quarter = data.get('quarter')
    fiscal_year = data.get('fiscal_year')

    if not quarter or not fiscal_year:
        fiscal_year, quarter = get_fiscal_year_quarter()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO accomplishments (title, description, objective, quarter, fiscal_year) VALUES (?, ?, ?, ?, ?)',
              (title, description, objective, quarter, fiscal_year))
    conn.commit()
    accomplishment_id = c.lastrowid
    conn.close()

    return jsonify({'id': accomplishment_id, 'title': title, 'description': description,
                    'objective': objective, 'quarter': quarter, 'fiscal_year': fiscal_year}), 201


@app.route('/api/accomplishments/<int:id>', methods=['DELETE'])
def delete_accomplishment(id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM accomplishments WHERE id=?', (id,))
    conn.commit()
    conn.close()

    return '', 204


@app.route('/api/accomplishments/<int:id>', methods=['PUT'])
def update_accomplishment(id):
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    objective = data.get('objective', '')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE accomplishments SET title=?, description=?, objective=? WHERE id=?',
              (title, description, objective, id))
    conn.commit()
    conn.close()

    return jsonify({'id': id, 'title': title, 'description': description, 'objective': objective})


@app.route('/api/version', methods=['GET'])
def get_version():
    return jsonify({'version': VERSION})


@app.route('/api/current-period', methods=['GET'])
def get_current_period():
    fiscal_year, quarter = get_fiscal_year_quarter()
    return jsonify({'fiscal_year': fiscal_year, 'quarter': quarter})


@app.route('/api/settings', methods=['GET'])
def get_settings():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT key, value FROM settings')
    settings = {row['key']: row['value'] for row in c.fetchall()}
    conn.close()
    return jsonify(settings)


@app.route('/api/settings', methods=['PUT'])
def update_settings():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    for key, value in data.items():
        c.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                  (key, str(value)))
    conn.commit()
    conn.close()
    return jsonify(data)


@app.route('/api/objectives', methods=['GET'])
def get_objectives():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM objectives ORDER BY sort_order')
    objectives = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(objectives)


@app.route('/api/objectives', methods=['POST'])
def create_objective():
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM objectives')
    next_order = c.fetchone()[0]
    try:
        c.execute('INSERT INTO objectives (name, sort_order) VALUES (?, ?)', (name, next_order))
        conn.commit()
        obj_id = c.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Objective already exists'}), 409
    conn.close()
    return jsonify({'id': obj_id, 'name': name, 'sort_order': next_order}), 201


@app.route('/api/objectives/<int:id>', methods=['PUT'])
def update_objective(id):
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT name FROM objectives WHERE id=?', (id,))
    old = c.fetchone()
    if old:
        old_name = old[0]
        c.execute('UPDATE objectives SET name=? WHERE id=?', (name, id))
        c.execute('UPDATE accomplishments SET objective=? WHERE objective=?', (name, old_name))
        conn.commit()
    conn.close()
    return jsonify({'id': id, 'name': name})


@app.route('/api/objectives/<int:id>', methods=['DELETE'])
def delete_objective(id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM objectives WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return '', 204


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', debug=True, port=5000)
