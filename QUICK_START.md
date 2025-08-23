# 🚀 Quick Start Guide - Resume Builder Backend

## ⚡ Get Running in 5 Minutes

### 1. **Prerequisites Check**

```bash
# Check Node.js version (should be 14+)
node --version

# Check npm version
npm --version

# Check if MongoDB is available
mongosh --version  # Optional
```

### 2. **Environment Setup**

```bash
# Copy environment template
cp env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Required .env variables:**

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/resume-builder
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000
```

### 3. **Install & Run**

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**Or use the quick start script:**

```bash
./start.sh
```

### 4. **Verify Installation**

- Backend: http://localhost:5000
- Health Check: http://localhost:5000/api/health
- API Base: http://localhost:5000/api

## 🧪 Test the API

### Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "experienceLevel": "entry-level"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Templates

```bash
# Get all templates
curl http://localhost:5000/api/templates

# Get templates by category
curl http://localhost:5000/api/templates/category/professional
```

## 🐳 Docker Quick Start

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Using Docker Only

```bash
# Build image
docker build -t resume-builder-backend .

# Run container
docker run -p 5000:5000 --env-file .env resume-builder-backend
```

## 📱 API Endpoints Quick Reference

| Method | Endpoint                   | Description       | Auth Required |
| ------ | -------------------------- | ----------------- | ------------- |
| `POST` | `/api/auth/signup`         | User registration | ❌            |
| `POST` | `/api/auth/login`          | User login        | ❌            |
| `GET`  | `/api/auth/profile`        | Get user profile  | ✅            |
| `GET`  | `/api/templates`           | List templates    | ❌            |
| `POST` | `/api/resume`              | Create resume     | ✅            |
| `GET`  | `/api/resume`              | List user resumes | ✅            |
| `GET`  | `/api/resume/:id/download` | Download PDF      | ✅            |

## 🔧 Common Issues & Solutions

### MongoDB Connection Failed

```bash
# Start MongoDB locally
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### JWT Token Issues

- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration
- Verify `Authorization: Bearer <token>` header format

## 📚 Next Steps

1. **Frontend Integration**: Connect your React/Next.js frontend
2. **Google OAuth**: Set up Google OAuth credentials
3. **Production**: Deploy to cloud platform (Heroku, AWS, etc.)
4. **Customization**: Modify templates and PDF generation
5. **Testing**: Add comprehensive test suite

## 🆘 Need Help?

- 📖 Check the full [README.md](README.md)
- 🐛 Review error logs in console
- 🔍 Verify environment variables
- 📧 Check MongoDB connection
- 🚀 Ensure all dependencies are installed

---

**Happy Coding! 🎉**
