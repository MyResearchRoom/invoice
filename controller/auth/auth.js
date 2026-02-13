import { executeQuery } from "../../config/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'
import { body, validationResult } from 'express-validator';

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});




// Validation middleware
export const validateUserRegistration = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),

    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .custom(async (value) => {
            const existingUser = await executeQuery('SELECT * FROM user WHERE email = ?', [value]);
            if (existingUser.length > 0) {
                throw new Error('Email already exists');
            }
            return true;
        }),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character (e.g., @, #, $, etc.)'),



];

export const loginValidator = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordValidator = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];








// export const register = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { name, email, password } = req.body;
//     const profile = req.file; // Access the uploaded file
//     let role = req.path === '/admin' ? 'admin' : req.path === '/user' ? 'user' : null;

//     // Validate role
//     if (!role) {
//         return res.status(400).json({ message: 'Invalid registration route' });
//     }

//     try {

//         console.log(req.user);

//         // Only check admin token if registering a user
//         if (role === 'user') {
//             if (!req.user || req.user.role !== 'Admin') {
//                 return res.status(403).json({ message: 'Forbidden: Only an admin can register a user' });
//             }
//         }

//         // Check if the user already exists
//         const existingUser = await executeQuery('SELECT * FROM user WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Insert the new user with profile details
//         await executeQuery(
//             'INSERT INTO user (name, email, password, role, profile, profileContentType) VALUES (?, ?, ?, ?, ?, ?)',
//             [name, email, hashedPassword, role, profile?.buffer, profile?.mimetype]
//         );

//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };




//new -15/07/2025
export const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const profile = req.file;

    console.log(role);


    // Allowed roles
    const validRoles = ['Admin', 'UserAll', 'EmployeeManager', 'ClientManager'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Only Admin can register a user' });
        }

        const existingUser = await executeQuery('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await executeQuery(
            'INSERT INTO user (name, email, password, role, profile, profileContentType) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, profile?.buffer, profile?.mimetype]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};





// Login user function
// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     console.log(email, password);


//     try {
//         // Fetch user from database
//         const users = await executeQuery('SELECT * FROM user WHERE email = ?', [email]);
//         console.log('Fetched users:', users); // Log the fetched users

//         if (users.length === 0) {
//             console.log('No user found with this email:', email); // Log the email checked
//             return res.status(400).json({ message: 'Invalid email or password' });
//         }

//         const user = users[0];
//         console.log('User password from DB:', user.password); // Log the user's hashed password

//         // Check password
//         const isMatch = await bcrypt.compare(password, user.password);
//         console.log('Password match result:', isMatch); // Log the result of password comparison
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid email or password' });
//         }

//         // Create a token
//         const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
//         user.password = "";

//         res.json({
//             token, user: {
//                 id: user.id,
//                 name: user.name,
//                 role: user.role,
//                 email: user.email
//             }
//         });
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const users = await executeQuery("SELECT * FROM user WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        await executeQuery("UPDATE user SET otp = ? WHERE email = ?", [otp, email]);
        // await transporter.sendMail({
        //     from: process.env.EMAIL_USER,
        //     to: email,
        //     subject: "Your Login OTP",
        //     html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`
        // });

        await transporter.sendMail({
  from: `"My Research Room" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Your Secure Login OTP",
  html: `
  <div style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(90deg,#0688CA,#5A267F);padding:20px;text-align:center;">
          <h2 style="color:#ffffff;margin:0;font-weight:600;">NeoWeSolutize Technology,Pune</h2>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:30px 25px;color:#333333;">
          <h3 style="margin-top:0;">Secure Login Verification</h3>
          <p style="font-size:14px;line-height:1.6;">
            Hello,
          </p>
          <p style="font-size:14px;line-height:1.6;">
            Use the One-Time Password (OTP) below to complete your login process.
            This OTP is valid for <b>5 minutes</b>.
          </p>

          <!-- OTP Box -->
          <div style="margin:25px 0;text-align:center;">
            <span style="display:inline-block;padding:15px 30px;font-size:26px;
              letter-spacing:6px;font-weight:bold;
              background:#f0f4ff;border:2px dashed #5A267F;
              border-radius:8px;color:#5A267F;">
              ${otp}
            </span>
          </div>

          <p style="font-size:13px;color:#666;line-height:1.6;">
            If you did not request this OTP, please ignore this email.
          </p>

          <p style="font-size:13px;color:#666;">
            For security reasons, please do not share this OTP with anyone.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f4f6f9;padding:15px;text-align:center;font-size:12px;color:#888;">
          © ${new Date().getFullYear()} My Research Room. All rights reserved.
        </td>
      </tr>

    </table>
  </div>
  `
});


        return res.status(200).json({ message: "OTP sent to your email." });
    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const verifyLoginOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const users = await executeQuery("SELECT * FROM user WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = users[0];

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await executeQuery(`UPDATE user SET otp = NULL where email = ?`, [email]);
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};





// Change password function (ID from URL)
export const changePassword = async (req, res) => {
    const { id } = req.params; // Get ID from URL
    const { newPassword } = req.body;

    try {
        // Fetch user from database
        const users = await executeQuery('SELECT * FROM user WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await executeQuery('UPDATE user SET password = ? WHERE id = ?', [hashedNewPassword, id]);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const changePasswordAdmin = async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized person" });
    }

    try {
        const users = await executeQuery("SELECT * FROM user WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        if (!user.password) {
            return res.status(400).json({ message: 'Password not found for user' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await executeQuery("UPDATE user SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};






// Delete user function (ID from URL)
export const deleteUser = async (req, res) => {
    const { id } = req.params; // Get ID from URL

    try {
        // Check if user exists
        const users = await executeQuery('SELECT * FROM user WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user from the database
        await executeQuery('DELETE FROM user WHERE id = ?', [id]);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};




// Get all users where role = 'User' (Only id, name, and email)
export const getUsers = async (req, res) => {
    try {
        // Fetch users with role 'User'
        const users = await executeQuery('SELECT id, name, email, role FROM user WHERE role IN (?, ?, ?)', ['UserAll', 'EmployeeManager', 'ClientManager']);

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

