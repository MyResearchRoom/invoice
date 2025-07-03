import { executeQuery } from "../../config/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult  } from 'express-validator';





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








export const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const profile = req.file; // Access the uploaded file
    let role = req.path === '/admin' ? 'admin' : req.path === '/user' ? 'user' : null;

    // Validate role
    if (!role) {
        return res.status(400).json({ message: 'Invalid registration route' });
    }

    try {

        console.log(req.user);
        
        // Only check admin token if registering a user
        if (role === 'user') {
            if (!req.user || req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Forbidden: Only an admin can register a user' });
            }
        }

        // Check if the user already exists
        const existingUser = await executeQuery('SELECT * FROM user WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user with profile details
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
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    

    try {
        // Fetch user from database
        const users = await executeQuery('SELECT * FROM user WHERE email = ?', [email]);
        console.log('Fetched users:', users); // Log the fetched users

        if (users.length === 0) {
            console.log('No user found with this email:', email); // Log the email checked
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('User password from DB:', user.password); // Log the user's hashed password

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch); // Log the result of password comparison
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create a token
        const token = jwt.sign({ id: user.id, name: user.name ,role:user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        user.password = "";

        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
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
        const users = await executeQuery('SELECT id, name, email FROM user WHERE role = ?', ['User']);

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

