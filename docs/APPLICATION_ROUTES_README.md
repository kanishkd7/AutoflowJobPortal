# Application Routes Documentation

This document describes the backend routes for users to view and manage their job applications.

## 🔗 **Available Routes**

### **1. List My Applications**
- **Route**: `GET /api/applications/my`
- **Authentication**: Required
- **Purpose**: Get all applications submitted by the authenticated user

#### **Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of applications per page (default: 10)
- `status` (optional): Filter by application status (e.g., 'applied', 'reviewed', 'accepted', 'rejected')

#### **Example Requests:**
```bash
# Get all applications (first page)
GET /api/applications/my

# Get applications with pagination
GET /api/applications/my?page=2&limit=5

# Filter by status
GET /api/applications/my?status=applied

# Combined filters
GET /api/applications/my?page=1&limit=20&status=reviewed
```

#### **Response Format:**
```json
{
  "applications": [
    {
      "id": 1,
      "status": "applied",
      "resumePath": "/uploads/resume.pdf",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "job": {
        "id": 5,
        "title": "Senior Software Engineer",
        "description": "We are looking for...",
        "location": "New York, NY",
        "type": "full-time",
        "salary": "$120,000 - $150,000",
        "requirements": "5+ years experience...",
        "benefits": "Health insurance, 401k...",
        "createdAt": "2024-01-10T09:00:00.000Z",
        "updatedAt": "2024-01-10T09:00:00.000Z",
        "company": {
          "id": 2,
          "name": "TechCorp Inc",
          "logo": "/uploads/company-logo.png",
          "location": "New York, NY",
          "website": "https://techcorp.com"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalApplications": 25,
    "applicationsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "status": "applied"
  }
}
```

---

### **2. Get Specific Application**
- **Route**: `GET /api/applications/:applicationId`
- **Authentication**: Required
- **Purpose**: Get detailed information about a specific application

#### **URL Parameters:**
- `applicationId`: The ID of the application to retrieve

#### **Example Request:**
```bash
GET /api/applications/123
```

#### **Response Format:**
```json
{
  "id": 123,
  "status": "reviewed",
  "resumePath": "/uploads/resume.pdf",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z",
  "job": {
    "id": 5,
    "title": "Senior Software Engineer",
    "description": "We are looking for...",
    "location": "New York, NY",
    "type": "full-time",
    "salary": "$120,000 - $150,000",
    "requirements": "5+ years experience...",
    "benefits": "Health insurance, 401k...",
    "createdAt": "2024-01-10T09:00:00.000Z",
    "updatedAt": "2024-01-10T09:00:00.000Z",
    "company": {
      "id": 2,
      "name": "TechCorp Inc",
      "logo": "/uploads/company-logo.png",
      "location": "New York, NY",
      "website": "https://techcorp.com",
      "description": "Leading technology company..."
    }
  }
}
```

---

### **3. Get Application Statistics**
- **Route**: `GET /api/applications/stats/my`
- **Authentication**: Required
- **Purpose**: Get statistics about the user's applications

#### **Example Request:**
```bash
GET /api/applications/stats/my
```

#### **Response Format:**
```json
{
  "totalApplications": 25,
  "recentApplications": 8,
  "statusBreakdown": {
    "applied": 15,
    "reviewed": 6,
    "accepted": 2,
    "rejected": 2
  },
  "lastUpdated": "2024-01-20T15:30:00.000Z"
}
```

---

### **4. Apply to Job**
- **Route**: `POST /api/applications/jobs/:jobId/apply`
- **Authentication**: Required
- **Purpose**: Submit an application for a specific job

#### **URL Parameters:**
- `jobId`: The ID of the job to apply for

#### **Example Request:**
```bash
POST /api/applications/jobs/5/apply
```

#### **Response Format:**
```json
{
  "message": "Applied successfully",
  "application": {
    "id": 123,
    "status": "applied",
    "resumePath": "/uploads/resume.pdf",
    "userId": 1,
    "jobId": 5,
    "createdAt": "2024-01-20T15:30:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

## 🔐 **Security Features**

### **Authentication**
- All routes require valid JWT authentication
- Users can only access their own applications
- Session validation ensures secure access

### **Data Protection**
- Company passwords are excluded from responses
- User-specific data filtering
- Input validation and sanitization

## 📊 **Application Status Values**

The application status can be one of the following:
- `applied`: Application submitted
- `reviewed`: Application under review
- `accepted`: Application accepted
- `rejected`: Application rejected
- `withdrawn`: Application withdrawn by user

## 🛠️ **Error Handling**

### **Common Error Responses:**

#### **401 Unauthorized**
```json
{
  "error": "No token provided"
}
```

#### **404 Not Found**
```json
{
  "error": "Application not found"
}
```

#### **500 Internal Server Error**
```json
{
  "error": "Could not fetch applications"
}
```

## 📝 **Usage Examples**

### **Frontend Integration Example:**

```javascript
// Get user's applications
async function getMyApplications(page = 1, limit = 10, status = null) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (status) {
    params.append('status', status);
  }
  
  const response = await fetch(`/api/applications/my?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Get application statistics
async function getApplicationStats() {
  const response = await fetch('/api/applications/stats/my', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Get specific application
async function getApplication(applicationId) {
  const response = await fetch(`/api/applications/${applicationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

## 🚀 **Testing with curl**

### **List Applications:**
```bash
curl -X GET "http://localhost:3000/api/applications/my?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Get Application Statistics:**
```bash
curl -X GET "http://localhost:3000/api/applications/stats/my" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Get Specific Application:**
```bash
curl -X GET "http://localhost:3000/api/applications/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📈 **Performance Features**

- **Pagination**: Efficient handling of large datasets
- **Selective Attributes**: Only necessary data is fetched
- **Optimized Queries**: Efficient database queries with proper joins
- **Caching Ready**: Structure supports easy caching implementation

## 🔄 **Route Flow**

```
User Request → Authentication Middleware → Route Handler → Database Query → Response
```

1. **Authentication**: JWT token validation
2. **Authorization**: User can only access their own data
3. **Processing**: Database queries with proper joins
4. **Response**: Formatted JSON with pagination and metadata 