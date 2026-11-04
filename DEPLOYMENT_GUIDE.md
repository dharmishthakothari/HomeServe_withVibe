# HomeServe Horizon | Production Deployment Guide
## Full-Stack Cloud Architecture (Vercel / Netlify + Render + Cloud MySQL)

---

### 1. Cloud Architecture Overview
```
[React 19 + Tailwind CSS Frontend] (Vercel / Netlify CDN)
               │
               ▼ HTTPS REST APIs (/api/*)
[FastAPI Python Backend] (Render / Railway / AWS ECS)
               │
               ▼ Encrypted MySQL Connection (Port 3306)
[Managed MySQL 8.0 Database] (Aiven / PlanetScale / Render MySQL / AWS RDS)
```

---

### 2. Frontend Deployment (Vercel or Netlify)
1. **Repository Setup**: Push repository to GitHub.
2. **Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend.onrender.com`
4. **Vite Proxy / Rewrites**:
   Create `vercel.json` in `frontend/`:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

### 3. Backend Deployment (Render or Railway)
1. **Service Type**: Web Service
2. **Runtime**: Python 3.11
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables**:
   ```ini
   SECRET_KEY=your-production-high-entropy-secret-key-32chars
   DB_USER=avnadmin
   DB_PASSWORD=your-cloud-db-password
   DB_HOST=mysql-cloud-host.aivencloud.com
   DB_PORT=14502
   DB_NAME=homeserve_db
   CORS_ORIGINS=https://homeserve-horizon.vercel.app
   ```

---

### 4. Database Setup (Cloud MySQL 8.0)
1. Provision a MySQL 8.0 instance on **Aiven for MySQL**, **PlanetScale**, or **Render Database**.
2. Run database migration script:
   ```bash
   python -m backend.create_tables
   python -m backend.app.utils.seed_data
   ```

---

### 5. Verification Checklist
- [x] Test `GET /api/health` returns `{"status": "healthy", "database": "mysql"}`
- [x] Test Swagger API interactive documentation at `https://your-backend.onrender.com/docs`
- [x] Test demo login with persona switcher on live frontend URL.

