import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = 'http://localhost:5001/api';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getQuarterLabels(startMonth) {
  const labels = [];
  for (let q = 0; q < 4; q++) {
    const first = (startMonth - 1 + q * 3) % 12;
    const last = (first + 2) % 12;
    labels.push(`Q${q + 1} (${MONTH_NAMES[first]}-${MONTH_NAMES[last]})`);
  }
  return labels;
}

function getFyLabel(startMonth) {
  const startName = MONTH_NAMES[startMonth - 1];
  const endIdx = (startMonth - 2 + 12) % 12;
  return `${startName} 1 - ${MONTH_NAMES[endIdx]} ${endIdx === 1 ? 28 : [3,5,8,10].includes(endIdx) ? 30 : 31}`;
}

function ConfigPage({ onBack, version }) {
  const [objectives, setObjectives] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [fyStartMonth, setFyStartMonth] = useState(10);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchObjectives();
    fetchSettings();
  }, []);

  const fetchObjectives = async () => {
    const res = await fetch(`${API_URL}/objectives`);
    setObjectives(await res.json());
  };

  const fetchSettings = async () => {
    const res = await fetch(`${API_URL}/settings`);
    const data = await res.json();
    if (data.fy_start_month) setFyStartMonth(parseInt(data.fy_start_month));
    if (data.user_name !== undefined) setUserName(data.user_name);
  };

  const saveSetting = async (key, value) => {
    await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
  };

  const handleStartMonthChange = async (e) => {
    const month = parseInt(e.target.value);
    setFyStartMonth(month);
    saveSetting('fy_start_month', month);
  };

  const handleUserNameBlur = () => {
    saveSetting('user_name', userName);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch(`${API_URL}/objectives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    setNewName('');
    fetchObjectives();
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await fetch(`${API_URL}/objectives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    });
    setEditingId(null);
    fetchObjectives();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/objectives/${id}`, { method: 'DELETE' });
    fetchObjectives();
  };

  const quarterLabels = getQuarterLabels(fyStartMonth);

  return (
    <div className="App">
      <header>
        <div className="header-row">
          <button onClick={onBack} className="back-btn">← Back</button>
          <div>
            <h1>Configuration</h1>
            <p>Manage Settings & Objectives</p>
          </div>
          <div style={{width: '80px'}} />
        </div>
      </header>

      <div className="config-section">
        <h2>General</h2>
        <div className="config-row">
          <label>
            Your Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onBlur={handleUserNameBlur}
              placeholder="e.g. Henry"
              className="config-input"
            />
          </label>
        </div>
      </div>

      <div className="config-section">
        <h2>Fiscal Year</h2>
        <div className="config-row">
          <label>
            Start Month:
            <select value={fyStartMonth} onChange={handleStartMonthChange}>
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </label>
          <div className="quarter-preview">
            {quarterLabels.map((label, i) => (
              <span key={i} className="quarter-preview-badge">{label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="config-section">
        <h2>Objectives</h2>
        <form onSubmit={handleAdd} className="config-form">
          <input
            type="text"
            placeholder="New objective name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit">Add Objective</button>
        </form>

        <div className="objectives-list">
          {objectives.map((obj) => (
            <div key={obj.id} className="objective-item">
              {editingId === obj.id ? (
                <div className="objective-edit-row">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(obj.id)} className="save-btn">Save</button>
                  <button onClick={() => setEditingId(null)} className="cancel-btn">Cancel</button>
                </div>
              ) : (
                <div className="objective-display-row">
                  <span>{obj.name}</span>
                  <div className="objective-actions">
                    <button onClick={() => { setEditingId(obj.id); setEditName(obj.name); }} className="edit-btn" title="Edit">
                      <img src="/pencil.png" alt="Edit" />
                    </button>
                    <button onClick={() => handleDelete(obj.id)} className="delete-btn" title="Delete">
                      <img src="/trash.png" alt="Delete" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <footer>
        <img src="/corgi_animated.gif" alt="happy corgi" style={{width: '40px', height: '40px', marginRight: '8px', verticalAlign: 'middle'}} /> Copyright © 2026 Henry Chilvers - Happy bragging! (humbly of course)
        {version && <p className="version-label">v{version}</p>}
      </footer>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('main');
  const [accomplishments, setAccomplishments] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [objectives, setObjectives] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState({ fiscal_year: 0, quarter: 0 });
  const [selectedQuarter, setSelectedQuarter] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [fyStartMonth, setFyStartMonth] = useState(10);
  const [version, setVersion] = useState('');
  const [userName, setUserName] = useState('');

  const fetchSettings = useCallback(async () => {
    const res = await fetch(`${API_URL}/settings`);
    const data = await res.json();
    if (data.fy_start_month) setFyStartMonth(parseInt(data.fy_start_month));
    if (data.user_name !== undefined) setUserName(data.user_name);
  }, []);

  const fetchObjectives = useCallback(async () => {
    const res = await fetch(`${API_URL}/objectives`);
    const data = await res.json();
    setObjectives(data.map(o => o.name));
  }, []);

  const fetchCurrentPeriod = useCallback(async () => {
    const response = await fetch(`${API_URL}/current-period`);
    const data = await response.json();
    setCurrentPeriod(data);
    setSelectedQuarter(data.quarter);
    setSelectedYear(data.fiscal_year);
  }, []);

  const fetchAccomplishments = useCallback(async (quarter, fiscalYear) => {
    let url = `${API_URL}/accomplishments`;
    if (quarter && fiscalYear) {
      url += `?quarter=${quarter}&fiscal_year=${fiscalYear}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    setAccomplishments(data);
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchCurrentPeriod();
    fetchAccomplishments();
    fetchObjectives();
    fetch(`${API_URL}/version`).then(r => r.json()).then(d => setVersion(d.version));
  }, [fetchSettings, fetchCurrentPeriod, fetchAccomplishments, fetchObjectives]);

  useEffect(() => {
    if (selectedQuarter && selectedYear) {
      fetchAccomplishments(selectedQuarter, selectedYear);
    }
  }, [selectedQuarter, selectedYear, fetchAccomplishments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      await fetch(`${API_URL}/accomplishments/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, objective })
      });
      setEditingId(null);
    } else {
      await fetch(`${API_URL}/accomplishments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, objective,
          quarter: selectedQuarter,
          fiscal_year: selectedYear
        })
      });
    }

    setTitle('');
    setDescription('');
    setObjective('');
    fetchAccomplishments(selectedQuarter, selectedYear);
  };

  const handleEdit = (acc) => {
    setEditingId(acc.id);
    setTitle(acc.title);
    setDescription(acc.description || '');
    setObjective(acc.objective || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setObjective('');
  };

  const handleExport = () => {
    const subject = `Accomplishments - Q${selectedQuarter} FY${selectedYear}`;
    let body = `Accomplishments for Q${selectedQuarter} FY${selectedYear}\n\n`;
    accomplishments.forEach((acc, index) => {
      body += `${index + 1}. ${acc.title}`;
      if (acc.objective) body += ` (${acc.objective})`;
      body += '\n';
    });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/accomplishments/${id}`, { method: 'DELETE' });
    fetchAccomplishments(selectedQuarter, selectedYear);
  };

  const handleBackFromConfig = () => {
    setPage('main');
    fetchObjectives();
    fetchSettings().then(() => fetchCurrentPeriod());
  };

  const quarterLabels = getQuarterLabels(fyStartMonth);

  if (page === 'config') {
    return <ConfigPage onBack={handleBackFromConfig} version={version} />;
  }

  return (
    <div className="App">
      <header>
        <div className="header-row">
          <div style={{width: '40px'}} />
          <div>
            <h1>{userName ? `${userName}'s` : 'My'} Brag Sheet</h1>
            <p>Fiscal Year: {getFyLabel(fyStartMonth)}</p>
          </div>
          <button onClick={() => setPage('config')} className="gear-btn" title="Configuration">
            <img src="/gear.png" alt="Settings" />
          </button>
        </div>
      </header>

      <div className="period-selector">
        <label>
          Fiscal Year:
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[...Array(5)].map((_, i) => {
              const year = currentPeriod.fiscal_year - 2 + i;
              return <option key={year} value={year}>FY{year}</option>;
            })}
          </select>
        </label>
        <label>
          Quarter:
          <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}>
            {quarterLabels.map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
        </label>
        <button onClick={handleExport} className="export-btn" disabled={accomplishments.length === 0}>
          <img src="/email.png" alt="Export" style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} />
          Export to Email
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Accomplishment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
        <select value={objective} onChange={(e) => setObjective(e.target.value)}>
          <option value="">Select objective (optional)</option>
          {objectives.map((obj) => (
            <option key={obj} value={obj}>{obj}</option>
          ))}
        </select>
        <div className="form-buttons">
          <button type="submit">{editingId ? 'Update your' : 'Add a'} Brag</button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
          )}
        </div>
      </form>

      <div className="accomplishments-list">
        {accomplishments.length === 0 ? (
          <p className="empty">No accomplishments recorded yet.</p>
        ) : (
          accomplishments.map((acc) => (
            <div key={acc.id} className="accomplishment-card">
              <div className="card-header">
                <h3>{acc.title}</h3>
                <div className="card-meta">
                  <span className="quarter-badge">Q{acc.quarter} FY{acc.fiscal_year}</span>
                  <button onClick={() => handleEdit(acc)} className="edit-btn" title="Edit">
                    <img src="/pencil.png" alt="Edit" />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="delete-btn" title="Delete">
                    <img src="/trash.png" alt="Delete" />
                  </button>
                </div>
              </div>
              {acc.objective && <div className="objective-tag" data-objective={acc.objective}>{acc.objective}</div>}
              {acc.description && <p>{acc.description}</p>}
            </div>
          ))
        )}
      </div>

      <footer>
        <img src="/corgi_animated.gif" alt="happy corgi" style={{width: '40px', height: '40px', marginRight: '8px', verticalAlign: 'middle'}} /> Copyright © 2026 Henry Chilvers - Happy bragging! (humbly of course)
        {version && <p className="version-label">v{version}</p>}
      </footer>
    </div>
  );
}

export default App;
