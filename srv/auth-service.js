const cds = require('@sap/cds');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMail } = require('./utils/mail'); // ✅ Import mail utility
module.exports = (srv) => {

    // Helper functions
    const generateToken = (user) => jwt.sign({ phoneNumber: user.phoneNumber, role: user.role }, process.env.SECRET_KEY, { expiresIn: '10000d' });
    const generateRefreshToken = (user) => jwt.sign({ phoneNumber: user.phoneNumber }, process.env.REFRESH_SECRET, { expiresIn: '10000d' });
    const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // User Registration
    srv.on('register', async (req) => {
        const { phoneNumber, firstName, lastName, email, password } = req.data;
        const db = await cds.connect.to('db');
       
       try {
        const existingUser = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
        if (existingUser) return req.error(400, 'User with this phone number already exists');

        const passwordHash = await bcrypt.hash(password, 10);

    
        await db.run(
            INSERT.into('cap.dukanmitra.Users').entries({
                phoneNumber,
                firstName,
                lastName,
                email,
                passwordHash,
                username:phoneNumber

            })
        );
        sendOTPForRegistration(phoneNumber);
        //return "User registered successfully!";
       } catch (err) {
        return req.error(403, 'Network issue, try later');
    }


    });




async function userVerificationbyOTP(){
     const { phoneNumber, otp, newPassword } = req.data;
        const db = await cds.connect.to('db');
        try {
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
            if (!user) return req.error(404, 'User not found');
            if (user.otp !== otp) return req.error(400, 'Invalid OTP');
    
            const now = new Date();
            if (new Date(user.otpExpiry) < now) return req.error(400, 'OTP has expired');
    
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
            await db.run(UPDATE('cap.dukanmitra.Users').set({ passwordHash: newPasswordHash, otp: null, otpExpiry: null }).where({ phoneNumber }));
    
            return "Password reset successfully!";
        } catch (err) {
            return req.error(403, 'Invalid or expired refresh token');
        }
}


    // User Login
    srv.on('login', async (req) => {
        const { phoneNumber, password } = req.data;
        const db = await cds.connect.to('db');
        try {
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
            //const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber, isVerified: true }));
            //if (!user) return req.error(401, 'User not found');
            if (!user) return req.error(401, 'User not found or not verified');
           
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) return req.error(401, 'Invalid credentials');
    
            const token = generateToken(user);
            const refreshToken = generateRefreshToken(user);
    
            await db.run(UPDATE('cap.dukanmitra.Users').set({ refreshToken }).where({ phoneNumber }));
    
            return { token, refreshToken, user };
        } catch (err) {
            return req.error(403, 'Invalid credentials');
        }
  
    });

    // Refresh Token
    srv.on('refreshToken', async (req) => {
        const { refreshToken } = req.data;
        const db = await cds.connect.to('db');

        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: decoded.phoneNumber }));

            if (!user || user.refreshToken !== refreshToken) return req.error(403, 'Invalid refresh token');

            const newToken = generateToken(user);
            return { token: newToken };

        } catch (err) {
            return req.error(403, 'Invalid or expired refresh token');
        }
    });


    async function sendOTPForRegistration(phoneNumber) {
        // const { phoneNumber } = req.data;
        const db = await cds.connect.to('db');
        try {
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
            if (!user) return req.error(404, 'User not found');
    
            const otp = generateOTP();
            //const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
            const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
            await db.run(UPDATE('cap.dukanmitra.Users').set({ otp, otpExpiry: expiryTime }).where({ phoneNumber }));
    
            // Simulate sending OTP (replace this with an actual SMS API)
            console.log(`OTP for ${phoneNumber}: ${otp}`);
    
            //return "OTP sent successfully. It is valid for 10 minutes.";



  const email = user.email;
  const html = `
    <p>Your OTP for Dukan Mitra is: <strong>${otp}</strong></p>
    <p>Valid for 24 Hours.</p>
  `;
  await sendMail(email, "Dukan Mitra OTP Verification", html);
  return { message: `OTP sent to ${email}` };




        } catch (err) {
            return req.error(403, 'Invalid or expired refresh token');
        }
    }

    // Forgot Password: Request OTP
    srv.on('requestPasswordReset', async (req) => {
        const { phoneNumber } = req.data;
        const db = await cds.connect.to('db');
        try {
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
            if (!user) return req.error(404, 'User not found');
    
            const otp = generateOTP();
            //const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
            const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
            await db.run(UPDATE('cap.dukanmitra.Users').set({ otp, otpExpiry: expiryTime }).where({ phoneNumber }));
    
            // Simulate sending OTP (replace this with an actual SMS API)
            console.log(`OTP for ${phoneNumber}: ${otp}`);
    
            //return "OTP sent successfully. It is valid for 10 minutes.";



  const email = user.email;
  const html = `
    <p>Your OTP for Dukan Mitra is: <strong>${otp}</strong></p>
    <p>Valid for 24 Hours.</p>
  `;
  await sendMail(email, "Dukan Mitra OTP Verification", html);
  return { message: `OTP sent to ${email}` };




        } catch (err) {
            return req.error(403, 'Invalid or expired refresh token');
        }
  
    });

    // Forgot Password: Reset Password
    srv.on('resetPassword', async (req) => {
        const { phoneNumber, otp, newPassword } = req.data;
        const db = await cds.connect.to('db');
        try {
            const user = await db.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber }));
            if (!user) return req.error(404, 'User not found');
            if (user.otp !== otp) return req.error(400, 'Invalid OTP');
    
            const now = new Date();
            if (new Date(user.otpExpiry) < now) return req.error(400, 'OTP has expired');
    
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
            await db.run(UPDATE('cap.dukanmitra.Users').set({ passwordHash: newPasswordHash, otp: null, otpExpiry: null }).where({ phoneNumber }));
    
            return "Password reset successfully!";
        } catch (err) {
            return req.error(403, 'Invalid or expired refresh token');
        }

    });

    
};
