const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendMail = require('../utils/mailer');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, password required' });

    const exists = await db.User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await db.User.create({ username, email, password: hash });

  
    sendMail(email, 'Welcome to JobPortal', `Hi ${username}, welcome aboard!`).catch(console.error);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });
   
    res.json({ user: token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email, password required' });

   
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Invalid email or password' });

    
    if (req.cookies && req.cookies.token) {
      const existingSession = await db.SessionToken.findOne({ where: { token: req.cookies.token } });
      if (existingSession && existingSession.userId !== user.id) {
        return res.status(400).json({ error: 'Please logout from the current account before logging in with another.' });
      }
    }

    
    const userSession = await db.SessionToken.findOne({ where: { userId: user.id } });
    if (userSession) {
      return res.status(400).json({ error: 'You are already logged in. Please logout first.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });

   
    await db.SessionToken.create({
      token,
      userId: user.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    });

    

   
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    res.json({ user:token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await db.SessionToken.destroy({ where: { token } });
      res.clearCookie('token');
    }
    res.json({ message: 'Logged out (session ended)' });
  } catch (err) {
    res.status(500).json({ error: 'Logout error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }


    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

   
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    

    const expires = new Date(Date.now() + 60 * 60 * 1000);

  
    await db.PasswordResetToken.create({
      token: resetTokenHash,
      userId: user.id,
      expires
    });

   
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.username},</p>
        <p>You requested a password reset for your JobPortal account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The JobPortal Team</p>
      </div>
    `;

    await sendMail(
      user.email,
      'Password Reset Request - JobPortal',
      `Hello ${user.username},\n\nYou requested a password reset. Click this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      emailHtml
    );

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

   
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
   
    const resetTokenRecord = await db.PasswordResetToken.findOne({
      where: {
        token: resetTokenHash,
        used: false,
        expires: { [db.Sequelize.Op.gt]: new Date() }
      },
      include: [{ model: db.User, as: 'user' }]
    });

    if (!resetTokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    
  
    await db.User.update(
      { password: hashedPassword },
      { where: { id: resetTokenRecord.userId } }
    );


    await db.PasswordResetToken.update(
      { used: true },
      { where: { id: resetTokenRecord.id } }
    );


    await db.SessionToken.destroy({ where: { userId: resetTokenRecord.userId } });

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
