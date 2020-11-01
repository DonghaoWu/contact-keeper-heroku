const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');

const router = express.Router();

// @route   POST api/users
// @des     Register a user
// @access  Public
router.post('/',
    [
        check('name', 'Name is required.').not().isEmpty(),
        check('email', 'Please include a valid email.').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { name, password, email } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ msg: 'User already exists.' })
            }

            const salt = await bcrypt.genSalt(10);

            const hashedPassword = await bcrypt.hash(password, salt);

            const newUserCredentials = new User({
                name,
                email,
                password: hashedPassword
            });

            const newUser = await newUserCredentials.save();

            const payload = {
                user: {
                    id: newUser.id
                }
            }

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                res.json({ token: token })
            });

        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server error.' })
        }
    }
);

module.exports = router;