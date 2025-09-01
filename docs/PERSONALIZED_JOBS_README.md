# Personalized Job Suggestions Feature

This document describes the backend implementation for personalized job suggestions based on user skills.

## 🎯 **Overview**

The system analyzes user skills and matches them against job requirements to provide personalized job recommendations. If a user has no skills, the system prompts them to add skills first.

## 🔗 **Available Routes**

### **1. Get Personalized Job Suggestions**
- **Route**: `GET /api/jobs/personalized/suggestions`
- **Authentication**: Required
- **Purpose**: Get job recommendations based on user's skills

#### **Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of jobs per page (default: 10)

#### **Example Request:**
```bash
GET /api/jobs/personalized/suggestions?page=1&limit=5
```

#### **Response Format:**
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "Senior JavaScript Developer",
      "description": "We are looking for a skilled JavaScript developer...",
      "location": "New York, NY",
      "salary": "$120,000 - $150,000",
      "type": "full-time",
      "requirements": "5+ years experience with JavaScript, React, Node.js",
      "deadline": "2024-02-15T00:00:00.000Z",
      "createdAt": "2024-01-10T09:00:00.000Z",
      "matchScore": 3.5,
      "matchedSkills": ["javascript", "react", "node.js"],
      "matchPercentage": 87.5,
      "company": {
        "id": 2,
        "name": "TechCorp Inc",
        "logo": "/uploads/company-logo.png",
        "location": "New York, NY",
        "website": "https://techcorp.com"
      }
    }
  ],
  "userSkills": [
    {
      "name": "javascript",
      "level": "Advanced"
    },
    {
      "name": "react",
      "level": "Intermediate"
    },
    {
      "name": "node.js",
      "level": "Intermediate"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalJobs": 25,
    "jobsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "totalRelevantJobs": 25,
    "userSkillCount": 4,
    "averageMatchPercentage": 75
  }
}
```

#### **Error Response (No Skills):**
```json
{
  "error": "No skills found",
  "message": "Please add your skills to get personalized job suggestions",
  "action": "add_skills"
}
```

---

### **2. Skill Management Routes**

#### **Get User Skills**
- **Route**: `GET /api/skills`
- **Authentication**: Required

#### **Add Single Skill**
- **Route**: `POST /api/skills`
- **Authentication**: Required
- **Body**:
```json
{
  "name": "python",
  "level": "Advanced"
}
```

#### **Add Multiple Skills**
- **Route**: `POST /api/skills/bulk`
- **Authentication**: Required
- **Body**:
```json
{
  "skills": [
    { "name": "python", "level": "Advanced" },
    { "name": "django", "level": "Intermediate" },
    { "name": "postgresql", "level": "Beginner" }
  ]
}
```

#### **Update Skill**
- **Route**: `PUT /api/skills/:id`
- **Authentication**: Required
- **Body**:
```json
{
  "name": "python",
  "level": "Advanced"
}
```

#### **Delete Skill**
- **Route**: `DELETE /api/skills/:id`
- **Authentication**: Required

## 🧠 **Matching Algorithm**

### **Scoring System:**
1. **Title Match**: +2 points (highest priority)
2. **Requirements Match**: +1 point (medium priority)
3. **Description Match**: +0.5 points (lowest priority)

### **Match Percentage Calculation:**
```
matchPercentage = (matchScore / totalUserSkills) * 100
```

### **Example:**
- User has 4 skills: ["javascript", "react", "node.js", "python"]
- Job title contains "JavaScript Developer" → +2 points
- Job requirements contain "React" → +1 point
- Job description contains "Node.js" → +0.5 points
- **Total Score**: 3.5
- **Match Percentage**: (3.5 / 4) * 100 = 87.5%

## 🔍 **How It Works**

### **Step 1: Check User Skills**
- Fetch all skills for the authenticated user
- If no skills found, return error with action prompt

### **Step 2: Fetch All Jobs**
- Get all available jobs with company information
- Include job title, description, and requirements

### **Step 3: Match Skills**
- For each job, check if user skills appear in:
  - Job title (highest weight)
  - Job requirements (medium weight)
  - Job description (lowest weight)

### **Step 4: Score and Sort**
- Calculate match score for each job
- Filter out jobs with no matches
- Sort by match score (highest first)

### **Step 5: Paginate and Return**
- Apply pagination to results
- Return jobs with match information

## 🛠️ **Usage Examples**

### **Complete Workflow:**

#### **1. Check if user has skills:**
```bash
curl -X GET "http://localhost:3000/api/jobs/personalized/suggestions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **2. If no skills, add skills:**
```bash
# Add single skill
curl -X POST "http://localhost:3000/api/skills" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "javascript",
    "level": "Advanced"
  }'

# Add multiple skills
curl -X POST "http://localhost:3000/api/skills/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": [
      {"name": "javascript", "level": "Advanced"},
      {"name": "react", "level": "Intermediate"},
      {"name": "node.js", "level": "Intermediate"}
    ]
  }'
```

#### **3. Get personalized suggestions:**
```bash
curl -X GET "http://localhost:3000/api/jobs/personalized/suggestions?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Frontend Integration Example:**

```javascript
// Get personalized job suggestions
async function getPersonalizedJobs(page = 1, limit = 10) {
  try {
    const response = await fetch(`/api/jobs/personalized/suggestions?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.status === 400 && data.action === 'add_skills') {
      // Redirect to skills page or show skills form
      console.log('User needs to add skills first');
      return { needsSkills: true, message: data.message };
    }

    return data;
  } catch (error) {
    console.error('Error fetching personalized jobs:', error);
    throw error;
  }
}

// Add skills
async function addSkill(name, level = 'Intermediate') {
  const response = await fetch('/api/skills', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, level })
  });

  return await response.json();
}
```

## 📊 **Response Fields Explained**

### **Job Object:**
- `matchScore`: Total points from skill matching
- `matchedSkills`: Array of skills that matched this job
- `matchPercentage`: Percentage match (0-100)

### **Summary Object:**
- `totalRelevantJobs`: Number of jobs with at least one skill match
- `userSkillCount`: Number of skills the user has
- `averageMatchPercentage`: Average match percentage across all relevant jobs

### **User Skills:**
- `name`: Skill name (lowercase)
- `level`: Skill level (Beginner/Intermediate/Advanced)

## 🔐 **Security Features**

- **Authentication Required**: All routes require valid JWT tokens
- **User Isolation**: Users can only access their own skills and personalized data
- **Input Validation**: Skill names are validated and sanitized
- **Duplicate Prevention**: Users cannot add the same skill twice

## 🚀 **Performance Optimizations**

- **Efficient Queries**: Optimized database queries with proper joins
- **Pagination**: Handles large datasets efficiently
- **Case-Insensitive Matching**: Skills are stored and matched in lowercase
- **Selective Attributes**: Only necessary data is fetched

## 🧪 **Testing**

### **Test with curl:**

```bash
# 1. Login to get token
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Add skills
curl -X POST "http://localhost:3000/api/skills/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": [
      {"name": "javascript", "level": "Advanced"},
      {"name": "react", "level": "Intermediate"},
      {"name": "node.js", "level": "Intermediate"}
    ]
  }'

# 3. Get personalized jobs
curl -X GET "http://localhost:3000/api/jobs/personalized/suggestions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 **Future Enhancements**

1. **Skill Synonyms**: Match similar skills (e.g., "js" matches "javascript")
2. **Location Matching**: Consider user location preferences
3. **Salary Range**: Filter by salary expectations
4. **Job Type Preferences**: Filter by full-time/part-time preferences
5. **Machine Learning**: Improve matching algorithm with ML
6. **Skill Weights**: Allow users to set importance for different skills 