# PDRM Accident Reporting System

A comprehensive accident reporting system for the Royal Malaysian Police (PDRM) that enables citizens to submit accident reports, PDRM officers to review and create statements, and insurance agents to analyze claims using VLM (Vision Language Model) technology.

## Features

### For Citizens
- Submit detailed accident reports with vehicle and incident information
- Upload up to 8 photos of accident damage
- Track report status (Submitted → Under Review → Completed)
- View detailed report information and official responses

### For PDRM Officers
- Review all submitted accident reports
- Create official police statements with case numbers
- Determine fault and provide recommendations
- Manage report status workflow

### For Insurance Agents
- Access reports with PDRM statements for claim processing
- Use VLM technology to analyze accident photos
- Compare photo evidence with written descriptions
- Generate consistency scores and damage assessments
- Approve or deny insurance claims

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (easily replaceable with PostgreSQL/MySQL)
- **JWT** - Authentication and authorization
- **Pydantic** - Data validation and serialization
- **VLM Integration** - Photo analysis capabilities

### Frontend
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **React Dropzone** - File upload functionality
- **Heroicons** - Professional icon set
- **Inter Font** - Modern, professional typography

### Design
- **Police Color Scheme** - Professional blue/navy theme
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant components
- **Modern UI/UX** - Clean, formal interface suitable for government use

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Clone the repository and navigate to the project directory**
   ```bash
   cd pdrm
   ```

2. **Create a Python virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Update .env file with your settings
   cp .env .env.local
   # Edit .env.local with your actual API keys and configuration
   ```

5. **Initialize the database**
   ```bash
   python -c "from database import create_tables; create_tables()"
   ```

6. **Start the FastAPI server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at: http://localhost:8000
   API Documentation: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install additional required dependencies**
   ```bash
   npm install @tailwindcss/forms
   # or
   yarn add @tailwindcss/forms
   ```

4. **Start the React development server**
   ```bash
   npm start
   # or
   yarn start
   ```

   The frontend will be available at: http://localhost:3000

## Usage

### Initial Setup

1. **Start both servers** (backend on :8000, frontend on :3000)
2. **Access the application** at http://localhost:3000
3. **Register accounts** for different user types:
   - Citizen account for submitting reports
   - PDRM account for reviewing reports
   - Insurance account for claim analysis

### Demo Accounts

For testing purposes, you can create accounts with these user types:

- **Citizen**: Regular users who submit accident reports
- **PDRM**: Police officers who review reports and create statements
- **Insurance**: Insurance agents who analyze claims

### Workflow

1. **Citizen submits report**
   - Fill out accident details, vehicle information
   - Upload photos (optional, max 8)
   - Submit for PDRM review

2. **PDRM reviews report**
   - Access PDRM portal to view submitted reports
   - Create official statement with case number
   - Determine fault and provide recommendations
   - Report status changes to "Under Review"

3. **Insurance processes claim**
   - Access insurance portal to view reports with PDRM statements
   - Use VLM analysis to examine photos
   - Generate consistency scores and damage assessments
   - Approve/deny claims with reasoning
   - Report status changes to "Completed"

## VLM Integration

The system includes placeholder VLM (Vision Language Model) integration for analyzing accident photos:

### Current Implementation
- Mock VLM service that simulates photo analysis
- Generates consistency scores between photos and descriptions
- Provides damage assessments and repair cost estimates

### Production Setup
To integrate with actual VLM services:

1. **Update `.env` file** with your VLM API credentials:
   ```
   VLM_API_KEY=your-actual-api-key
   VLM_API_URL=https://api.your-vlm-provider.com/v1
   ```

2. **Modify `vlm_service.py`** to use your preferred VLM provider:
   - OpenAI GPT-4 Vision
   - Google Cloud Vision AI
   - Azure Computer Vision
   - Custom VLM endpoints

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Reports (Citizens)
- `POST /reports` - Create accident report
- `GET /reports` - Get user's reports
- `GET /reports/{id}` - Get specific report
- `POST /reports/{id}/photos` - Upload photos

### PDRM
- `GET /pdrm/reports` - Get all reports for review
- `POST /pdrm/statements` - Create PDRM statement
- `PUT /pdrm/statements/{id}` - Update statement

### Insurance
- `GET /insurance/reports` - Get reports for analysis
- `POST /insurance/analyze` - Run VLM photo analysis
- `POST /insurance/analysis` - Submit insurance analysis

## Database Schema

### Users
- Authentication and profile information
- User types: citizen, pdrm, insurance

### Accident Reports
- Comprehensive accident details
- Vehicle information
- Incident descriptions
- Status tracking

### Photos
- File storage and metadata
- Linked to reports
- Optional descriptions

### PDRM Statements
- Official police assessments
- Case numbers and fault determination
- Officer findings and recommendations

### Insurance Analysis
- VLM analysis results
- Consistency scores
- Claim decisions and amounts

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Different permissions per user type
- **Input Validation** - Comprehensive data validation
- **File Upload Security** - Type and size restrictions
- **CORS Configuration** - Proper cross-origin setup

## Development

### Code Structure

```
pdrm/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database models and config
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   ├── vlm_service.py       # VLM integration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   └── index.css        # Tailwind styles
│   ├── public/
│   └── package.json         # Node.js dependencies
└── README.md
```

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`, update schemas in `schemas.py`
2. **Frontend**: Create new pages/components, update routing in `App.js`
3. **Database**: Modify models in `database.py`, create migration scripts
4. **Authentication**: Update role permissions in `auth.py`

## Deployment

### Production Considerations

1. **Environment Variables**
   - Use secure secret keys
   - Configure production database URLs
   - Set up actual VLM API credentials

2. **Database**
   - Migrate from SQLite to PostgreSQL/MySQL for production
   - Set up proper database backups
   - Configure connection pooling

3. **File Storage**
   - Use cloud storage (AWS S3, Google Cloud Storage)
   - Implement CDN for photo delivery
   - Set up proper file permissions

4. **Security**
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting
   - Implement audit logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is developed for the Royal Malaysian Police (PDRM) accident reporting system.

## Support

For technical support or questions about the system, please contact the development team.