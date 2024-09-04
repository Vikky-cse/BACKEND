// const jwt = require('jsonwebtoken');
// const User = require('../models/User'); // Import your User model here

// // Middleware to authenticate the token and authorize admin access
// function authenticateToken(req, res, next) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   const token = authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
//     if (err) {
//       console.error('Token Verification Error:', err);

//       if (err.name === 'TokenExpiredError') {
//         return res.status(401).json({ message: 'Token has expired' });
//       }

//       return res.status(403).json({ message: 'Forbidden' });
//     }

//     const foundUser = await User.findByPk(user.id);

//     if (!foundUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     req.user = { id: user.id, userType: foundUser.usertype };

//     next();
//   });
// }

// // Middleware to authorize admin access
// function authorizeAdmin(req, res, next) {
//   if (req.user.userType === 1) {
//     next(); // Admins are authorized
//   } else {
//     res.status(403).json({ message: 'Access denied. Admins only.' });
//   }
// }

// module.exports = { authenticateToken, authorizeAdmin };
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import your User model here
var requestIp = require('request-ip');
// Middleware to authenticate the token and authorize admin access
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
 
  console.log(req.path);
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
   
    jwt.verify(token, process.env.JWT_SECRET_KEY, async(err, user) => {
        if (err) {
            console.error('Token Verification Error:', err);
            console.log(token,"jwt")
            const requestOrigin = req.get('origin');
            console.log(requestOrigin,"ip")
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }

            return res.status(403).json({ message: 'Forbidden' });
        }

        const foundUser = await User.findByPk(user.id);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = { id: user.id, userType: foundUser.usertype };

        next();
    });
}

// Middleware to authorize admin access
function authorizeAdmin(req, res, next) {
    const requestOrigin = req.get('origin');

next();

    // if (req.user.userType == 1 && requestOrigin === "http://121.200.55.212:8367") {
    //     next(); // Admins are authorized
    // } else {
    //     res.status(403).json({ message: 'Access denied. Admins only.' });
    // }
}

// Middleware to authorize regular users
function authorizeUser(req, res, next) {
    if (req.user.userType === 0) {
        next(); // Regular users are authorized
    } else {
        res.status(403).json({ message: 'Access denied. Regular users only.' });
    }
}

module.exports = { authenticateToken, authorizeAdmin, authorizeUser };