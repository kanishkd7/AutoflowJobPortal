# Admin Job Approval System

This document describes the admin role system where jobs need admin approval before being visible to users and sending notifications.

## 🎯 **Overview**

The system now includes an admin role that:
1. **Reviews jobs** posted by companies before they go live
2. **Approves/rejects jobs** based on content quality
3. **Controls job visibility** - only approved jobs are shown to users
4. **Manages notifications** - notifications are sent only after admin approval

## 🔐 **Admin Authentication**

### **Admin Login**
- **Route:** `POST /api/admin/login`
- **Body:**
```json
{
  "email": "admin@jobportal.com",
  "password": "admin123"
}
```

### **Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@jobportal.com"
  }
}
```

## 📋 **Admin Routes**

### **1. Get Pending Jobs**
- **Route:** `GET /api/admin/jobs/pending`
- **Authentication:** Required (Admin Bearer Token)
- **Query Parameters:** `page`, `limit`
- **Purpose:** Get all jobs waiting for approval

### **2. Approve Job**
- **Route:** `PUT /api/admin/jobs/:jobId/approve`
- **Authentication:** Required (Admin Bearer Token)
- **Purpose:** Approve a job and make it visible to users

### **3. Reject Job**
- **Route:** `PUT /api/admin/jobs/:jobId/reject`
- **Authentication:** Required (Admin Bearer Token)
- **Purpose:** Reject a job (remains hidden from users)

### **4. Get Job Statistics**
- **Route:** `GET /api/admin/jobs/stats`
- **Authentication:** Required (Admin Bearer Token)
- **Purpose:** Get counts of total, pending, approved, and rejected jobs

## 🔄 **Job Flow**

### **Before Admin Approval:**
1. Company posts job → Job status: `pending`
2. Job is **NOT visible** to users
3. **NO notifications** are sent
4. Only company and admin can see the job

### **After Admin Approval:**
1. Admin approves job → Job status: `approved`
2. Job becomes **visible** to users
3. **Notifications are sent** to matching users
4. Users can apply to the job

### **After Admin Rejection:**
1. Admin rejects job → Job status: `rejected`
2. Job remains **hidden** from users
3. **NO notifications** are sent
4. Company can see the rejected status

## 🛠️ **Database Changes**

### **Job Table Updates:**
```sql
ALTER TABLE Job ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Job ADD COLUMN adminId INT NULL;
ALTER TABLE Job ADD FOREIGN KEY (adminId) REFERENCES Admin(id);
```

### **New Admin Table:**
```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

## 🚀 **Setup Instructions**

### **1. Create Admin User:**
```bash
node create-admin.js
```

### **2. Default Admin Credentials:**
- **Email:** admin@jobportal.com
- **Password:** admin123

### **3. Restart Application:**
The new admin system will be active after restart.

## 📱 **Postman Testing**

### **Admin Authentication:**
```bash
POST /api/admin/login
Body: {
  "email": "admin@jobportal.com",
  "password": "admin123"
}
```

### **Test Job Approval Flow:**
1. **Company posts job** → Job status: pending
2. **Admin gets pending jobs** → See pending job
3. **Admin approves job** → Job status: approved
4. **Users can see job** → Job appears in job listings
5. **Notifications sent** → Users get notified of matching job

### **Test Job Rejection Flow:**
1. **Company posts job** → Job status: pending
2. **Admin rejects job** → Job status: rejected
3. **Users cannot see job** → Job hidden from listings
4. **No notifications** → Users don't get notified

## 🔒 **Security Features**

- **Admin-only access** to approval routes
- **Role-based authentication** using JWT tokens
- **Company isolation** - companies can only see their own jobs
- **User isolation** - users can only see approved jobs

## 📊 **Admin Dashboard Features**

### **Job Management:**
- View all pending jobs with company details
- Approve jobs with one click
- Reject jobs with reason tracking
- View job statistics and counts

### **Monitoring:**
- Track approval/rejection rates
- Monitor job posting activity
- View system health metrics

## ⚠️ **Important Notes**

1. **Existing jobs** will have status: `pending` by default
2. **Admin must approve** all existing jobs to make them visible
3. **Notifications are delayed** until admin approval
4. **Rejected jobs** remain in database but are hidden from users
5. **Company can see** all their jobs regardless of status

## 🧪 **Testing Scenarios**

### **Scenario 1: New Job Posting**
1. Company creates job → Status: pending
2. Admin reviews job → Sees in pending list
3. Admin approves job → Status: approved
4. Users see job → Can apply
5. Notifications sent → Users get notified

### **Scenario 2: Job Rejection**
1. Company creates job → Status: pending
2. Admin reviews job → Sees in pending list
3. Admin rejects job → Status: rejected
4. Users cannot see job → Hidden from listings
5. No notifications → Users don't get notified

### **Scenario 3: Existing Jobs**
1. Restart application → All existing jobs: pending
2. Admin reviews each job → Approve or reject
3. Only approved jobs → Visible to users
4. Rejected jobs → Hidden from users

This admin system ensures job quality control and prevents spam while maintaining a clean user experience. 