# Verto Quiz Application

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
git clone https://github.com/your-username/verto-quiz-application.git
cd verto-quiz-application
```
> **Note**: Replace `your-username` with your actual GitHub username or organization name.

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

## 🚀 Deployment

### Using Docker

1. **Build and Run with Docker Compose**
```bash
# Set your Gemini API key
export GEMINI_API_KEY=your-api-key-here

# Build and start services
docker-compose up -d
```

2. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Manual Deployment

1. **Build Applications**
```bash
npm run build
```

2. **Deploy Backend**
```bash
cd backend
npm install --production
npm run build
npm start
```

3. **Deploy Frontend**
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or any static server
```

### Production Considerations

- Set strong JWT secrets
- Configure HTTPS/SSL
- Set up database backups
- Configure log rotation
- Set up monitoring
- Use environment-specific configurations

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection
- File upload restrictions

## 🧪 Running Tests

The project includes test configurations for both backend and frontend components.

### Backend Tests
```bash
# Navigate to backend directory
cd backend

# Run all backend tests
npm test

# Run tests with coverage (if configured)
npm run test:coverage

# Run linting
npm run lint
```

### Frontend Tests
```bash
# Navigate to frontend directory
cd frontend

# Run frontend tests (Note: Test framework needs to be configured)
npm test

# Run linting
npm run lint
```

### Running All Tests
```bash
# From the root directory, you can run tests for both backend and frontend
npm run test:all
```

> **Note**: The frontend currently doesn't have test scripts configured in package.json. You may need to add testing frameworks like Jest, React Testing Library, or Vitest to run frontend tests.

## 🏛️ Design Decisions & Assumptions

### Architecture Decisions
- **Monorepo Structure**: Frontend and backend are kept in the same repository for easier development and deployment
- **SQLite Database**: Chosen for simplicity and ease of setup. Can be easily migrated to PostgreSQL or MySQL for production
- **JWT Authentication**: Stateless authentication for scalability and simplicity
- **TypeScript**: Used throughout the project for better type safety and developer experience
- **Material-UI**: Provides consistent, professional UI components with minimal custom styling needed

### Key Assumptions
- **Single Tenant**: The application assumes a single organization/tenant model
- **File Size Limits**: Document uploads are limited to 10MB for performance and storage considerations
- **Question Randomization**: Each user gets a randomized subset of questions from the quiz pool
- **Timer-based Quizzes**: All quizzes are time-bound with automatic submission when time expires
- **Role-based Access**: Simple two-tier role system (Admin/User) is sufficient for most use cases
- **AI Dependency**: Google Gemini AI is required for question generation; manual question creation is available as fallback
- **Browser Compatibility**: Modern browsers with JavaScript enabled are assumed
- **Network Connectivity**: Stable internet connection required for AI features and real-time updates

### Security Considerations
- **Password Security**: Passwords are hashed using bcrypt with 12 rounds
- **Input Validation**: All user inputs are validated both client-side and server-side
- **File Upload Security**: File types and sizes are restricted to prevent malicious uploads
- **CORS Configuration**: Configured for development; should be restricted in production
- **Rate Limiting**: Implemented to prevent abuse of API endpoints

### Performance Considerations
- **Database Indexing**: Proper indexes on frequently queried fields
- **File Storage**: Local file storage for development; cloud storage recommended for production
- **Caching**: React Query provides client-side caching for API responses
- **Bundle Optimization**: Vite provides efficient bundling and code splitting

## 📊 Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `quizzes` - Quiz configurations
- `questions` - Question bank
- `question_options` - Answer options
- `user_quizzes` - Quiz assignments and results
- `user_answers` - Individual answer records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in the `docs/` folder
- Review the LLD.md for technical details
- Create an issue on GitHub

## 🔄 Updates and Roadmap

### Current Version: 1.0.0

### Planned Features
- Email notifications
- Advanced analytics
- Question categories
- Bulk user import
- Mobile app
- Integration with LMS platforms

---

**Built with ❤️ using React, Node.js, and Google Gemini AI**
