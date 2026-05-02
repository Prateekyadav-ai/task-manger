const User = require('../models/user.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis=require('../db/redis');

async function registerUser(req, res) {
    try {
        const { name, username, password, email, address, role } = req.body;

        const normalizedUsername = username ? username.trim() : email.split('@')[0].replace(/\s+/g, '').toLowerCase();
        const nameParts = (name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || normalizedUsername;
        const lastName = nameParts.slice(1).join(' ') || firstName;

        // Check if the user already exists
        const isUserAlreadyExists = await User.findOne({
            $or: [{ username: normalizedUsername }, { email }]
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash the password
        const hash = await bcrypt.hash(password, 10);

        // Determine role when provided. Only allow Admin if env flag is enabled.
        let userRole = 'user';
        const requestedRole = (role || '').toLowerCase();
        if (requestedRole === 'admin' && process.env.ALLOW_ADMIN_REGISTRATION === 'true') {
            userRole = 'Admin';
        } else if (requestedRole === 'seller') {
            userRole = 'seller';
        }

        // Create the user
        const user = await User.create({
            username: normalizedUsername,
            password: hash,
            email,
            fullName: { firstName, lastName },
            address,
            role: userRole
        });

        // Generate JWT token
        const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            jwtSecret,
            { expiresIn: '1h' }
        );

        // Set the token as an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });

        // Respond with the created user details
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body || {};
       console.log('Request Body:', req.body);
    // Validate input
    if (!username && !email) {
      return res.status(400).json({ message: 'Username or email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email }]
    }).select('+password'); // Include password field explicitly

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or email' });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Set the token as an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    // Respond with user details
    return res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error('Error in loginUser:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
async function getCurrentUser(req, res) {
   return res.status(200).json({
        message: 'Current user info',
        id: req.user.id,
        username: req.user.username,
        email: req.user.email
    });
}
 async function logoutUser(req, res) {
  try {
    const token = req.cookies.token;

    // Skip Redis during testing
    if (token && process.env.NODE_ENV !== 'test') {
      try {
        await Promise.race([
          redis.set(`blacklist_${token}`, 'true', 'EX', 24 * 3600),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
        ]);
      } catch (redisError) {
        console.error('Error blacklisting token in Redis:', redisError.message);
      }
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logoutUser:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
async function getUserAddresses(req, res) {
  const id=req.user.id;
 const user=await User.findById(id).select('address');
 if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.status(200).json({
    message: 'User addresses retrieved successfully',
      addresses:user.address});
}

async function addAddress(req, res) {
  try {
    const userId = req.user.id;
    const { street, city, state, pincode, phone, isDefault } = req.body;

    // Validate pincode (6 digits)
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ errors: [{ msg: 'Pincode must be exactly 6 digits' }] });
    }

    // Validate phone (10 digits)
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ errors: [{ msg: 'Phone must be exactly 10 digits' }] });
    }

    // Validate required fields
    if (!street || !city || !state) {
      return res.status(400).json({ errors: [{ msg: 'Street, city, and state are required' }] });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If no addresses exist, set this as default
    const shouldBeDefault = user.address && user.address.length === 0 ? true : isDefault || false;

    // If marking as default, unset other defaults
    if (shouldBeDefault && user.address) {
      user.address.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      street,
      city,
      state,
      pincode,
      phone,
      isDefault: shouldBeDefault
    };

    if (!user.address) {
      user.address = [];
    }

    user.address.push(newAddress);
    await user.save();

    const addedAddress = user.address[user.address.length - 1];

    return res.status(201).json({
      message: 'Address added successfully',
      _id: addedAddress._id,
      street: addedAddress.street,
      city: addedAddress.city,
      state: addedAddress.state,
      pincode: addedAddress.pincode,
      phone: addedAddress.phone,
      isDefault: addedAddress.isDefault
    });
  } catch (error) {
    console.error('Error in addAddress:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteAddress(req, res) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Validate addressId format
    if (!addressId || addressId.length !== 24) {
      return res.status(400).json({ message: 'Invalid address ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the address in the user's addresses
    const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if user owns this address
    const address = user.address[addressIndex];
    if (!address) {
      return res.status(403).json({ message: 'Unauthorized to delete this address' });
    }

    user.address.splice(addressIndex, 1);
    await user.save();

    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addAddress,
    deleteAddress
};
