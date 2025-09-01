# Job Notification System

This document describes the backend implementation for the job notification system that automatically notifies users when new jobs match their skills.

## 🎯 **Overview**

The notification system automatically creates notifications for users when:
1. **New jobs are posted** that match their skills
2. **Users add new skills** that match existing jobs
3. **Job matches exceed 25% threshold** to ensure relevance

## 🔗 **Available Routes**

### **1. Get User Notifications**
- **Route**: `GET /api/notifications`
- **Authentication**: Required
- **Purpose**: Get all notifications for the authenticated user

#### **Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of notifications per page (default: 10)

#### **Example Request:**
```bash
GET /api/notifications?page=1&limit=5
```

#### **Response Format:**
```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 123,
      "jobId": 456,
      "type": "job_match",
      "title": "New Job Match: Senior JavaScript Developer",
      "message": "A new job at TechCorp Inc matches your skills! Match percentage: 87.5%",
      "isRead": false,
      "matchScore": 3.5,
      "matchPercentage": 87.5,
      "matchedSkills": ["javascript", "react", "node.js"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "job": {
        "id": 456,
        "title": "Senior JavaScript Developer",
        "description": "We are looking for a skilled JavaScript developer...",
        "location": "New York, NY",
        "salary": "$120,000 - $150,000",
        "type": "full-time",
        "requirements": "5+ years experience with JavaScript, React, Node.js",
        "deadline": "2024-02-15T00:00:00.000Z",
        "createdAt": "2024-01-10T09:00:00.000Z",
        "company": {
          "id": 2,
          "name": "TechCorp Inc",
          "logo": "/uploads/company-logo.png"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalNotifications": 25,
    "notificationsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### **2. Get Unread Notification Count**
- **Route**: `GET /api/notifications/unread-count`
- **Authentication**: Required
- **Purpose**: Get count of unread notifications

#### **Response Format:**
```json
{
  "unreadCount": 5
}
```

---

### **3. Mark Notification as Read**
- **Route**: `PUT /api/notifications/:id/read`
- **Authentication**: Required
- **Purpose**: Mark a specific notification as read

#### **Example Request:**
```bash
PUT /api/notifications/1/read
```

#### **Response Format:**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": 1,
    "isRead": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### **4. Mark All Notifications as Read**
- **Route**: `PUT /api/notifications/mark-all-read`
- **Authentication**: Required
- **Purpose**: Mark all notifications as read

#### **Response Format:**
```json
{
  "message": "All notifications marked as read"
}
```

---

### **5. Delete Notification**
- **Route**: `DELETE /api/notifications/:id`
- **Authentication**: Required
- **Purpose**: Delete a specific notification

#### **Example Request:**
```bash
DELETE /api/notifications/1
```

#### **Response Format:**
```json
{
  "message": "Notification deleted successfully"
}
```

---

### **6. Delete All Notifications**
- **Route**: `DELETE /api/notifications`
- **Authentication**: Required
- **Purpose**: Delete all notifications for the user

#### **Response Format:**
```json
{
  "message": "All notifications deleted successfully"
}
```

## 🧠 **How It Works**

### **Automatic Notification Creation**

#### **1. New Job Posted**
When a company posts a new job:
1. Job is created in the database
2. `JobNotificationService.checkAndNotifyJobMatch()` is triggered
3. System fetches all users with skills
4. For each user, calculates match percentage with the new job
5. If match ≥ 25%, creates a notification

#### **2. User Adds Skills**
When a user adds new skills:
1. Skills are saved to the database
2. `JobNotificationService.processExistingJobsForUser()` is triggered
3. System fetches recent jobs (last 30 days)
4. Calculates match percentage for each job
5. If match ≥ 25%, creates notifications for matching jobs

### **Matching Algorithm**
Same algorithm as personalized jobs:
- **Title Match**: +2 points (highest priority)
- **Requirements Match**: +1 point (medium priority)
- **Description Match**: +0.5 points (lowest priority)

```
matchPercentage = (matchScore / totalUserSkills) * 100
```

### **Notification Types**
- `job_match`: When a job matches user skills
- `application_status`: For future use (application status updates)
- `general`: For general notifications

## 🛠️ **Database Schema**

### **Notifications Table**
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  jobId INT NOT NULL,
  type ENUM('job_match', 'application_status', 'general') DEFAULT 'job_match',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  matchScore FLOAT,
  matchPercentage FLOAT,
  matchedSkills JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (jobId) REFERENCES Jobs(id)
);
```

## 🔧 **Configuration**

### **Match Threshold**
- Minimum match percentage: **25%**
- Only notifications with ≥25% match are created

### **Cleanup Settings**
- Old notifications are automatically deleted after **90 days**
- Cleanup runs every **24 hours**

### **Job Processing**
- When users add skills, system checks jobs from last **30 days**
- Prevents duplicate notifications for same user-job combination

## 🚀 **Usage Examples**

### **Frontend Integration**

```javascript
// Get user notifications
async function getUserNotifications(page = 1, limit = 10) {
  const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// Get unread count
async function getUnreadCount() {
  const response = await fetch('/api/notifications/unread-count', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Mark notification as read
async function markAsRead(notificationId) {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Mark all as read
async function markAllAsRead() {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}
```

### **Real-time Updates**
For real-time notifications, consider implementing WebSocket or Server-Sent Events:

```javascript
// Example with polling (simple approach)
setInterval(async () => {
  const { unreadCount } = await getUnreadCount();
  if (unreadCount > 0) {
    // Update UI with notification badge
    updateNotificationBadge(unreadCount);
  }
}, 30000); // Check every 30 seconds
```

## 🔐 **Security Features**

- **Authentication Required**: All routes require valid JWT tokens
- **User Isolation**: Users can only access their own notifications
- **Input Validation**: All inputs are validated and sanitized
- **Duplicate Prevention**: Prevents duplicate notifications for same user-job

## 📊 **Performance Optimizations**

- **Asynchronous Processing**: Notification creation doesn't block API responses
- **Efficient Queries**: Optimized database queries with proper joins
- **Pagination**: Handles large datasets efficiently
- **Automatic Cleanup**: Removes old notifications to maintain performance
- **Duplicate Prevention**: Avoids creating duplicate notifications

## 🧪 **Testing**

### **Test with curl:**

```bash
# 1. Login to get token
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Get notifications
curl -X GET "http://localhost:3000/api/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get unread count
curl -X GET "http://localhost:3000/api/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Mark notification as read
curl -X PUT "http://localhost:3000/api/notifications/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Mark all as read
curl -X PUT "http://localhost:3000/api/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 **Future Enhancements**

1. **Email Notifications**: Send email notifications for important matches
2. **Push Notifications**: Implement push notifications for mobile apps
3. **Notification Preferences**: Allow users to set notification preferences
4. **Smart Filtering**: Filter notifications based on user preferences
5. **Notification Templates**: Customizable notification messages
6. **Real-time Updates**: WebSocket implementation for instant notifications
7. **Notification Analytics**: Track notification engagement metrics
8. **Batch Processing**: Process notifications in batches for better performance

## 🔄 **Integration Points**

### **Automatic Triggers**
- **Job Creation**: `companyController.createJob()` → `JobNotificationService.checkAndNotifyJobMatch()`
- **Skill Addition**: `skillController.addSkill()` → `JobNotificationService.processExistingJobsForUser()`
- **Bulk Skill Addition**: `skillController.addMultipleSkills()` → `JobNotificationService.processExistingJobsForUser()`

### **Scheduled Tasks**
- **Cleanup**: `notificationCleanup.js` → `JobNotificationService.cleanupOldNotifications()`

### **API Endpoints**
- **Notification Management**: `notificationController.js` → `routes/notifications.js`
- **Integration**: `app.js` → `/api/notifications`

This notification system provides a comprehensive solution for keeping users informed about relevant job opportunities while maintaining performance and user experience. 