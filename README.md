# Brag Sheet - Personal Accomplishments Tracker

A web application for tracking quarterly accomplishments aligned with organizational objectives, using a configurable fiscal year calendar.

## Overview

The Personal Accomplishments Tracker (or Brag Sheet) helps you organize and document your professional achievements by quarter and fiscal year. Each accomplishment can be categorized by objective and includes an export feature for easy sharing with managers. Credit to [Julia Evans](https://jvns.ca/blog/brag-documents/) for the (original) idea and [Umacodes](https://www.youtube.com/@Umacodes) for motivating me to finally make one.

## Features

- **Quarterly Organization**: Track accomplishments by fiscal quarter (Q1-Q4)
- **Configurable Fiscal Year**: Choose any month as the start of your fiscal year (defaults to October)
- **Dynamic Quarter Labels**: Quarter dropdown automatically adjusts based on your fiscal year start month
- **Configuration Page**: Manage objectives and fiscal year settings via a dedicated config page (⚙️ gear icon)
- **Customizable Objectives**: Add, edit, and delete objective categories to match your organization's goals
  - 7 default objectives are seeded on first run (Simplification, Efficiency & Growth, Streamlined Delivery, Velocity & Innovation, Next Gen Architecture, Quality, Security)
- **Full CRUD Operations**: Create, read, update, and delete accomplishments
- **Export to Email**: Generate formatted email summaries for sharing
- **Persistent Storage**: Data persists across container restarts
- **Responsive UI**: Clean, modern interface with color-coded objectives

## Technologies Used

### Backend
- **Python 3.14** - Programming language
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **SQLite** - Database

### Frontend
- **React 19** - UI framework
- **Vite 6** - Build tool & dev server
- **JavaScript (ES6+)** - Programming language
- **CSS3** - Styling

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Prerequisites

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
  - Includes Docker Engine and Docker Compose
  - Available for macOS, Windows, and Linux

## Installation & Setup

1. **Clone or download the project**
   ```bash
   cd /path/to/bragsheet
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Open your browser to: **http://localhost:3000**
   - Backend API runs on: **http://localhost:5001**

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Usage

### Adding an Accomplishment
1. Enter a title (required)
2. Add a description (optional)
3. Select an objective category (optional)
4. Click "Add a Brag"

### Editing an Accomplishment
1. Click the pencil icon (✏️) on any accomplishment
2. Modify the fields
3. Click "Update your Brag"
4. Or click "Cancel" to discard changes

### Deleting an Accomplishment
1. Click the trash icon (🗑️) on any accomplishment
2. The accomplishment is immediately removed

### Exporting Accomplishments
1. Select the desired fiscal year and quarter
2. Click "📧 Export to Email"
3. Your default email client opens with a formatted list
4. Add recipient and send

### Viewing Different Periods
- Use the "Fiscal Year" dropdown to select a year
- Use the "Quarter" dropdown to select Q1, Q2, Q3, or Q4
- Accomplishments automatically filter to the selected period

### Configuration
1. Click the ⚙️ gear icon in the top-right corner of the header
2. **Fiscal Year**: Choose the start month for your fiscal year — quarter labels update automatically with a live preview
3. **Objectives**: Add new objectives, edit existing ones (pencil icon), or delete them (trash icon)
4. Click "← Back" to return to the main page

## Project Structure

```
bragsheet/
├── backend/
│   ├── Dockerfile
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── Dockerfile
│   ├── index.html          # Vite entry HTML
│   ├── package.json        # Node dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── public/
│   │   ├── favicon.png     # Browser tab icon
│   │   ├── gear.png        # Configuration icon
│   │   ├── pencil.png      # Edit icon
│   │   ├── trash.png       # Delete icon
│   │   ├── email.png       # Export icon
│   │   └── corgi_animated.gif  # Footer animation
│   └── src/
│       ├── App.jsx         # Main React component (includes ConfigPage)
│       ├── App.css         # Styles
│       └── main.jsx        # Entry point
├── images/                 # Icon library (Icons_Dark collection)
├── docker-compose.yml      # Container orchestration
└── README.md               # This file
```

## API Endpoints

### Accomplishments

#### GET `/api/accomplishments`
Retrieve all accomplishments or filter by quarter/year
- Query params: `quarter` (1-4), `fiscal_year` (YYYY)

#### POST `/api/accomplishments`
Create a new accomplishment
- Body: `{ title, description, objective, quarter, fiscal_year }`

#### PUT `/api/accomplishments/:id`
Update an existing accomplishment
- Body: `{ title, description, objective }`

#### DELETE `/api/accomplishments/:id`
Delete an accomplishment

### Objectives

#### GET `/api/objectives`
Retrieve all objectives (ordered by sort_order)

#### POST `/api/objectives`
Create a new objective
- Body: `{ name }`

#### PUT `/api/objectives/:id`
Update an objective (also updates all accomplishments referencing the old name)
- Body: `{ name }`

#### DELETE `/api/objectives/:id`
Delete an objective

### Settings

#### GET `/api/settings`
Retrieve all settings (key-value pairs)

#### PUT `/api/settings`
Update settings
- Body: `{ fy_start_month: 1-12 }`

### Period

#### GET `/api/current-period`
Get the current fiscal year and quarter (calculated based on configured start month)

## Data Persistence

Data is stored in a SQLite database at `data/accomplishments.db` within a Docker volume named `db-data` (mounted at `/app/data`). This ensures your data persists even when containers are stopped or restarted.

### Resetting the Database
To completely clear all data and start fresh:
```bash
docker-compose down -v
docker-compose up -d
```
**Warning**: This will permanently delete all accomplishments, objectives, and settings.

## Troubleshooting

### Port Already in Use
If port 3000 or 5001 is already in use:
1. Stop the conflicting service
2. Or modify the ports in `docker-compose.yml`

### Container Won't Start
```bash
# View logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose up -d --build
```

### Data Not Persisting
Ensure you're using `docker-compose down` (without `-v` flag) to preserve the volume.

## Development

### Running Locally (Without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Making Changes
After modifying code, rebuild the affected container:
```bash
docker-compose up -d --build frontend  # For frontend changes
docker-compose up -d --build backend   # For backend changes
```

### ToDo:


## License
Copyright © 2026 Henry Chilvers

MIT License: https://rem.mit-license.org
