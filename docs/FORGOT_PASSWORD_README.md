# Forgot Password Implementation

This document describes the forgot password and reset password functionality implemented in the JobPortal application.

## Features Implemented

### 1. Password Reset Token Model
- **File**: `models/PasswordResetToken.js`
- **Purpose**: Stores secure reset tokens with expiration times
- **Fields**:
  - `token`: Hashed reset token (SHA-256)
  - `userId`: Reference to user
  - `expires`: Token expiration time (1 hour)
  - `used`: Boolean flag to prevent reuse

### 2. API Endpoints

#### POST `/api/auth/forgot-password`
- **Purpose**: Request password reset
- **Body**: `{ "email": "user@example.com" }`
- **Response**: Success message (doesn't reveal if email exists)
- **Security**: Generates cryptographically secure random token

#### POST `/api/auth/reset-password`
- **Purpose**: Reset password using token
- **Body**: `{ "token": "reset_token", "password": "new_password" }`
- **Response**: Success/error message
- **Security**: Validates token, marks as used, invalidates sessions

### 3. Security Features

#### Token Security
- **Cryptographic Generation**: Uses `crypto.randomBytes(32)` for secure tokens
- **Hashing**: Tokens are hashed (SHA-256) before database storage
- **Expiration**: Tokens expire after 1 hour
- **Single Use**: Tokens are marked as used after password reset
- **Session Invalidation**: All existing sessions are invalidated after password reset

#### Email Security
- **No Information Leakage**: Same response for existing/non-existing emails
- **Professional Email**: HTML formatted email with clear instructions
- **Secure Links**: Reset links include the token as URL parameter

### 4. Automated Cleanup
- **File**: `scheduler/cleanupTokens.js`
- **Purpose**: Removes expired tokens from database
- **Schedule**: Runs every hour using node-cron
- **Security**: Prevents database bloat and reduces attack surface

### 5. Frontend Pages

#### `/forgot-password.html`
- Clean, responsive design
- Email validation
- Success/error message display
- AJAX form submission

#### `/reset-password.html`
- Token validation from URL
- Password confirmation
- Client-side validation
- Automatic redirect after success

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000

# JWT Configuration (existing)
JWT_SECRET=your-jwt-secret
JWT_EXPIRES=1d
```

## Database Migration

The new `PasswordResetToken` table will be automatically created when you restart the application due to Sequelize auto-sync.

## Usage Flow

1. **User requests password reset**:
   - Navigate to `/forgot-password.html`
   - Enter email address
   - System sends reset email

2. **User resets password**:
   - Click link in email (goes to `/reset-password.html?token=xxx`)
   - Enter new password
   - System validates token and updates password

3. **Security cleanup**:
   - Expired tokens are automatically removed
   - Used tokens remain for audit purposes

## Testing

### Test the forgot password flow:

1. Start the server: `npm start`
2. Visit: `http://localhost:3000/forgot-password.html`
3. Enter a registered email address
4. Check email for reset link
5. Click link and reset password

### API Testing with curl:

```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Reset password (replace TOKEN with actual token)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN", "password": "newpassword123"}'
```

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for forgot password requests
2. **Email Verification**: Ensure email addresses are verified during registration
3. **HTTPS**: Use HTTPS in production for secure token transmission
4. **Token Storage**: Tokens are hashed in database for security
5. **Session Management**: All sessions are invalidated after password reset

## Error Handling

The implementation includes comprehensive error handling:
- Invalid/expired tokens
- Missing required fields
- Database errors
- Email sending failures
- Network errors

All errors return appropriate HTTP status codes and user-friendly messages. 