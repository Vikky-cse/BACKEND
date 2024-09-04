const Transaction = require('../models/Transaction');
const User = require('../models/user');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');



// Create a new user
const createUser = async(req, res) => {
    try {
        const { User_name, rfid, name, amount, usertype, gender, isHosteller, natural_amt, rollNo, password } = req.body;
        const user = await User.create({ User_name, rfid, name, amount, usertype, gender, isHosteller, natural_amt, rollNo, password });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error creating the user', err });
    }
};

// Read all users
const getAllUsers = async(req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Read a specific user by ID
const getUserById = async(req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user by ID' });
    }
};

const getUserByUserName = async(req, res) => {
    try {
        const userName = req.params.user_name; // Assuming the parameter in the URL is 'user_name'
        const user = await User.findOne({ where: { user_name: userName } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching user by user_name' });
    }
};

// Read a specific user by ID
const getUserByRFId = async(req, res) => {
    try {
        const rfid = req.params.id;
        let user = await User.findOne({ where: { rfid: rfid } });
        if (!user) {
            user = await User.findOne({ where: { rollNo: rfid } });
            if (!user) { return res.status(200).json({ error: 'User not found' }); } else { res.status(200).json(user); }

        } else { res.status(200).json(user); }

    } catch (err) {
        res.status(500).json({ error: 'Error fetching user by ID' });
    }
};

// Controller function to get a user by RFID or RollNo
const getUserByIdentifier = async(req, res) => {
    try {
        const { identifier } = req.params;
        console.log(identifier)
            // Find a user by RFID or RollNo
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { rfid: identifier },
                    { rollNo: identifier },
                ],
            },
        });

        if (user) {
            res.status(200).json({ user });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user by RFID or RollNo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}





// Update a user by ID
const updateUser = async(req, res) => {
    try {
        const userId = req.params.id;
        var updatedpassword;
        const { User_name, rfid, name, amount, usertype, gender, isHosteller, natural_amt, rollNo, password } = req.body;
        if(password){
           updatedpassword = await bcrypt.hash(password, 10);
           const updatedUser = await User.update({ User_name, rfid, name, amount, usertype, gender, isHosteller, natural_amt, rollNo, password:updatedpassword }, { where: { id: userId } });
        }
        else{
            const updatedUser = await User.update({ User_name, rfid, name, amount, usertype, gender, isHosteller, natural_amt, rollNo, password }, { where: { id: userId } });
        }
        res.status(200).json(true);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateRfid = async(req, res) => {
    try {
        const rollNo = req.params.rollNo;
        const { rfid } = req.body;
        const [rowsAffected, updatedUsers] = await User.update({ rfid }, { where: { rollNo: rollNo } });

        if (rowsAffected > 0) {
            res.status(200).json(updatedUsers);
        } else {
            res.status(201).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating the user' });
    }
};


const updateUserPassword = async(req, res) => {
    try {
        const userId = req.params.id; // Extract user ID from the request parameters
        const { password, newpassword } = req.body; // Extract password and new password from the request body

        // Find the user by their ID
        const user1 = await User.findByPk(userId);

        // Check if the provided current password matches the user's current password
        if (password == user1.password) {
            // Update the user's password with the new password
            const hashedPassword = await bcrypt.hash(newpassword, 10);
            const updatedUser = await User.update({ password: hashedPassword }, { where: { id: userId } });
            res.status(200).json(updatedUser); // Respond with the updated user object
        } else {
            res.status(500).json({ error: 'wrong password' }); // Respond with an error message if the passwords don't match
        }
    } catch (err) {
        res.status(500).json({ error: 'Error updating the user' }); // Respond with a generic error message if an exception occurs
    }
};

const updateUserPasswordbyAdmin = async(req, res) => {
    try {
        const { Rfid, newpassword } = req.body; // Extract RFID and new password from the request body
        // Find the user by their RFID
        const user1 = await User.findOne({ where: { rfid: Rfid } });
        if (!user1) {
            return res.status(200).json({ error: 'RFID Not Found' });
        }
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        // Update the user's password
        user1.password = hashedPassword;

        // Save the updated user record
        await user1.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error updating the user:', err);
        res.status(500).json({ error: 'Error updating the user' });
    }
};


// Delete a user by ID
const deleteUser = async(req, res) => {
    try {
        const userId = req.params.id;
        await User.destroy({ where: { id: userId } });
        res.status(204).end(); // 204 No Content - Successfully deleted
    } catch (err) {
        res.status(500).json({ error: 'Error deleting the user' });
    }
};



const loginUser = async(req, res) => {
    const { name, password, rfid } = req.query;

    try {
        let user;

        if (rfid) {
            user = await User.findOne({ where: { rfid } });
        } else {
            user = await User.findOne({ where: { User_name: name } });

            if (!user) {
                return res.status(200).json({ error: "User not found" });
            }

            // If using password-based login
            if (password == user.password) {
                // const passwordMatch = await bcrypt.compare(password, user.passwordHash);


            } else {
                return res.status(401).json({ message: "Incorrect password" });
            }
        }

        // Generate and send an authentication token (JWT) if needed
        // const token = generateAuthToken(user); // Implement this function

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};





// Update a user by ID
const Recharge = async(req, res) => {
    try {
        const { rfid, amount, biller } = req.body;

        let user = await User.findOne({ where: { 'rfid': rfid } });
        if (!user) {


            user = await User.findOne({ where: { 'rollNo': rfid } });

            if (!user) {
                return res.status(201).json({ error: 'User not found' });
            }

        }
        const newAmount = user.amount + amount;

        // Update user's amount
        await User.update({ amount: newAmount }, { where: { id: user.id } });



        // Create a new transaction record directly associating with the recharge TransactionType
        const newTransaction = await Transaction.create({
            Amount: amount,
            Transaction_Time: new Date(),
            Is_completed: true,
            transaction_by: biller,
            user_id: user.id,
            transactiontype: 1
        });

        res.status(200).json({ user, transaction: newTransaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating the user and creating a transaction' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser,
    updateUserPassword,
    getUserByRFId,
    Recharge,
    getUserByUserName,
    updateRfid,
    updateUserPasswordbyAdmin,
    getUserByIdentifier
};