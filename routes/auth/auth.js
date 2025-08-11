import express from 'express';
import multer from 'multer';
import { changePassword, changePasswordAdmin, deleteUser, getUsers, loginUser, loginValidator, register, validateUserRegistration, verifyLoginOtp } from '../../controller/auth/auth.js';
import { verifyToken } from '../../middleware/AuthMiddelware.js';

const router = express.Router();

// Configure multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/admin', upload.single('profile'), validateUserRegistration, register);
// http://localhost:8000/api/auth/admin
router.post('/user', upload.single('profile'), verifyToken, validateUserRegistration, register);
// http://localhost:8000/api/auth/user

// Login route
router.post('/login', loginValidator, loginUser);
// http://localhost:8000/api/auth/login

router.post('/verifyLoginOtp', verifyLoginOtp)


// Route to change password (ID from URL)
router.put('/changePassword/:id', changePassword);
// http://localhost:8000/api/auth/changePassword

//change password for admin only
router.post('/changePasswordAdmin', verifyToken, changePasswordAdmin);



// Route to delete a user (ID from URL)
router.delete('/deleteUser/:id', deleteUser);
// http://localhost:8000/api/auth/deleteUser


// Route to get all users (Only id, name, email)
router.get('/getUsers', getUsers);
// http://localhost:8000/api/auth/getUsers


export default router;
