# Verto Quiz Application


## 🌐 Live Demo
[Click here](https://verto-76e7.vercel.app/)


Verto is a modern, full-stack quiz management system that leverages AI-powered question generation to create engaging educational assessments. Built with React, Node.js, TypeScript, and Google Gemini AI, it provides a comprehensive platform for administrators to create, manage, and analyze quizzes while offering users an intuitive quiz-taking experience.

## 🚀 Features

### For Administrators
- **Quiz Creation**: Create quizzes with customizable settings
- **AI Question Generation**: Generate questions from documents and through prompt  using Google Gemini AI
- **User Management**: Manage users and assign quizzes
- **Random Question Selection**: Each user gets a different set of questions
- **Results Analytics**: View detailed quiz results and performance metrics
- **Flexible Configuration**: Set time limits, cutoff scores, and negative marking

### For Users
- **Interactive Quiz Taking**: Clean, responsive quiz interface with timer
- **Real-time Progress**: Track progress and time remaining
- **Detailed Results**: View scores, explanations, and performance insights
- **Personal Dashboard**: Track assigned and completed quizzes

### Technical Features
- **Role-based Authentication**: Secure JWT-based authentication
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live quiz status and progress tracking
- **File Upload Support**: Upload PDF files for question generation
- **Database Optimization**: Efficient SQLite database with proper indexing
- **Security**: Input validation, CORS protection, rate limiting

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** with Sequelize ORM
- **JWT** for authentication
- **Google Gemini AI** for question generation
- **Multer** for file uploads
- **Joi** for validation

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for form handling
- **Vite** for build tooling

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js 18 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Google Gemini API key** - Required for AI question generation feature

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/PrashansaSoni/verto-quiz-application.git
cd verto-quiz-application
```


### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
DB_PATH=./database/quiz.db
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
BCRYPT_ROUNDS=12
```

#### Frontend Environment
Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Verto Quiz
```

### 4. Get Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your backend `.env` file

### 5. Start Development Servers
```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/health

## 👥 Default Users

For testing purposes, you can register new users or create them manually:

### Admin User
- **Role**: Admin
- **Capabilities**: Create quizzes, manage users, view analytics

### Regular User
- **Role**: User
- **Capabilities**: Take assigned quizzes, view results

## 📖 Usage Guide

### Creating Your First Quiz

1. **Login as Admin**
   - Register with role "admin" or use existing admin account

2. **Create Quiz**
   - Navigate to "Create Quiz"
   - Fill in quiz details (name, time limit, cutoff, etc.)
   - Click "Create Quiz"

3. **Generate Questions**
   - Upload a document (PDF, DOCX, TXT) or paste content
   - Specify number of questions and additional instructions
   - Click "Generate Questions" to use AI

4. **Review and Edit**
   - Review generated questions
   - Edit or add questions manually if needed

5. **Assign to Users**
   - Go to "Users" section
   - Select users and assign the quiz

### Taking a Quiz

1. **Login as User**
   - Use user credentials to login

2. **Start Quiz**
   - View assigned quizzes on dashboard
   - Click "Start" to begin

3. **Answer Questions**
   - Navigate through questions
   - Timer shows remaining time
   - Submit when complete

4. **View Results**
   - See score and performance
   - Review correct answers (if enabled)

## 🏗️ Project Structure

```
verto-quiz-application/
├── backend/
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── validators/      # Input validation
│   ├── database/            # SQLite database
│   ├── uploads/             # File uploads
│   └── logs/                # Application logs
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
└── docs/                    # Documentation
```

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `POST /api/admin/quizzes` - Create quiz
- `GET /api/admin/quizzes` - Get admin's quizzes
- `POST /api/admin/quizzes/:id/generate-questions` - Generate questions with AI
- `POST /api/admin/assign-quiz` - Assign quiz to users
- `GET /api/admin/quizzes/:id/results` - Get quiz results

### User Endpoints
- `GET /api/user/assigned-quizzes` - Get assigned quizzes
- `POST /api/user/quizzes/:id/start` - Start quiz
- `GET /api/user/quizzes/:id/questions` - Get quiz questions
- `POST /api/user/quizzes/:id/submit` - Submit quiz answers
- `GET /api/user/quizzes/:id/result` - Get quiz result


## 🧪 Testing

The project includes comprehensive test suites with a focus on critical scoring logic.

### Backend Tests

Comprehensive test suite with *29 test cases* covering all scoring scenarios:

bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with detailed coverage report
npm run test:coverage


#### Test Coverage

- ✅ *MCQ Scoring*: Single correct answer validation
- ✅ *Multiple Select*: All correct options validation
- ✅ *True/False*: Binary choice validation
- ✅ *Negative Marking*: 25% penalty scenarios
- ✅ *Percentage Calculation*: Precision and rounding
- ✅ *Edge Cases*: Empty answers, non-existent questions, zero marks
- ✅ *Mixed Question Types*: Complex scoring scenarios


**Thank you for taking the time to review it — your feedback means a lot!**


