# Resume Builder Backend

A comprehensive backend API for a Resume Builder application built with Express.js, MongoDB, JWT authentication, and Passport.js Google OAuth.

## 🚀 Features

- **User Authentication**: Email/password registration and login with JWT tokens
- **Google OAuth**: Social login integration using Passport.js
- **Resume Management**: Full CRUD operations for resumes
- **Template System**: Pre-built resume templates with experience level filtering
- **PDF Generation**: Download resumes as professional PDF documents
- **Experience Level Management**: User experience level selection and template recommendations
- **Security**: JWT middleware, password hashing, rate limiting, and CORS protection

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js
- **Password Hashing**: bcryptjs
- **PDF Generation**: pdf-lib
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── config/
│   └── passport.js          # Passport.js configuration
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User model with authentication
│   └── Resume.js            # Resume model with schemas
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── resume.js            # Resume CRUD routes
│   └── templates.js         # Template management routes
├── utils/
│   └── pdfGenerator.js      # PDF generation utility
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google OAuth credentials (for social login)

### Installation

1. **Clone the repository**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/resume-builder
   JWT_SECRET=your-super-secret-jwt-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`

Register a new user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "experienceLevel": "entry-level"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

#### POST `/api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/google`

Initiate Google OAuth login.

#### GET `/api/auth/google/callback`

Google OAuth callback (handles redirect).

#### GET `/api/auth/profile`

Get current user profile (requires authentication).

#### PUT `/api/auth/experience-level`

Update user experience level (requires authentication).

**Request Body:**

```json
{
  "experienceLevel": "intermediate"
}
```

### Resume Endpoints

#### POST `/api/resume`

Create a new resume (requires authentication).

**Request Body:**

```json
{
  "name": "My Professional Resume",
  "templateId": "modern-professional",
  "contact": {
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  },
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2018-09-01",
      "endDate": "2022-05-01",
      "gpa": 3.8
    }
  ],
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Software Developer",
      "startDate": "2022-06-01",
      "current": true,
      "description": "Developed web applications using modern technologies"
    }
  ]
}
```

#### GET `/api/resume`

Get all resumes for the authenticated user.

#### GET `/api/resume/:id`

Get a specific resume by ID.

#### PUT `/api/resume/:id`

Update an existing resume.

#### DELETE `/api/resume/:id`

Delete a resume.

#### POST `/api/resume/:id/duplicate`

Duplicate an existing resume.

#### GET `/api/resume/:id/download`

Download resume as PDF.

#### GET `/api/resume/stats/overview`

Get resume statistics for the user.

### Template Endpoints

#### GET `/api/templates`

Get all available resume templates.

#### GET `/api/templates/:id`

Get a specific template by ID.

#### GET `/api/templates/category/:category`

Get templates by category.

#### GET `/api/templates/categories/list`

Get all template categories.

#### GET `/api/templates/search/:query`

Search templates by query.

#### GET `/api/templates/recommendations/user`

Get personalized template recommendations.

## 🔐 Authentication Flow

1. **Registration/Login**: User provides credentials and receives JWT token
2. **Protected Routes**: Include `Authorization: Bearer <token>` header
3. **Token Validation**: Middleware verifies JWT and attaches user to `req.user`
4. **Google OAuth**: Alternative authentication method using Passport.js

## 🗄️ Database Schema

### User Schema

```javascript
{
  email: String,           // Required, unique
  passwordHash: String,    // Required (unless Google user)
  googleId: String,        // Optional, for Google OAuth
  name: String,            // Required for Google users
  experienceLevel: String, // 'entry-level' | 'intermediate' | 'advanced'
  resumes: [ObjectId],     // Array of resume references
  createdAt: Date,
  lastLogin: Date
}
```

### Resume Schema

```javascript
{
  userId: ObjectId,        // Reference to User
  templateId: String,      // Template identifier
  name: String,            // Resume name
  contact: Object,         // Contact information
  education: [Object],     // Education history
  skills: [String],        // Skills array
  experience: [Object],    // Work experience
  summary: String,         // Professional summary
  languages: [Object],     // Language proficiencies
  certifications: [Object], // Certifications
  projects: [Object],      // Project portfolio
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with configurable expiration
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Request validation using express-validator
- **Helmet**: Security headers for Express applications

## 📄 PDF Generation

The backend uses `pdf-lib` to generate professional PDF resumes with:

- Professional formatting and typography
- Dynamic content rendering
- Multiple sections (experience, education, skills, etc.)
- Customizable layouts based on templates

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- `MONGODB_URI_ATLAS`: MongoDB Atlas connection string
- `JWT_SECRET`: Strong, unique JWT secret
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `FRONTEND_URL`: Production frontend URL

### Production Considerations

- Use MongoDB Atlas for database
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use strong JWT secrets
- Enable HTTPS in production
- Set up proper logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation
- Review error logs
- Ensure environment variables are properly configured
- Verify MongoDB connection and Google OAuth setup
