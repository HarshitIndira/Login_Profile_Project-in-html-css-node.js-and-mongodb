const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// // MongoDB setup
mongoose.connect('mongodb://localhost:27017/Indira');

const User = mongoose.model('user', { name: String, email: String, password: String });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static('static'));
app.use(express.static('css'));
app.use(express.static('js'));

// API endpoint for user authentication
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists in the database
    User.findOne({ email, password })
        .then(user => {
        
            if (!user) {
                res.status(401).json({ message: 'User not found user' });
            } else {
                // Generate JWT token
                const token = jwt.sign({ email: user.email }, 'secretKey', { expiresIn: '1h' });
                res.json({ token });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        });
});

// API endpoint to get user profile
app.get('/profile', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretKey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            User.findOne({ email: authData.email })
                .then(user => {
                    if (!user) {
                        res.status(404).json({ message: 'User not found' });
                    } else {
                        res.json(user);
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ message: 'Internal Server Error' });
                });
        }
    });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

