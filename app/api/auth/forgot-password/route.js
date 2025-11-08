import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Please provide email' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset OTP - DCC Bazar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #16a34a; margin: 0; font-size: 32px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}