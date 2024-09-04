const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import your User model
require('dotenv').config();

// Registration controller
const register = async(req, res) => {
    try {
        const { User_name, password, gender, isHosteller, rollNo, name } = req.body;

        // Check if the username already exists
        const existingUser = await User.findOne({ where: { User_name } });
        const existingRollNo = await User.findOne({ where: { rollNo: rollNo.toUpperCase() } });
        if (existingUser) {

            return res.status(200).json({ error: 'Username already exists' });
        }
        if (existingRollNo) {

            return res.status(202).json({ error: 'RollNo already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        let nAmt = 0;
        if(gender == 0 && isHosteller == true){
            nAmt = 1800
        }
        await User.create({ name, User_name: User_name.toLowerCase(), password: hashedPassword, usertype: 0, gender, isHosteller, rollNo: rollNo.toUpperCase(), natural_amt: nAmt, amount: 0 });


        res.status(201).json({ message: "success" });
    } catch (error) {




        console.error(error);
        res.status(500).json({ error: 'Error registering user' });
    }
};

const registerAdmin = async(req, res) => {

    try {
        const { User_name, password, gender, isHosteller, rollNo, name } = req.body;

        // Check if the username already exists
        const existingUser = await User.findOne({ where: { User_name } });
        const existingRollNo = await User.findOne({ where: { rollNo: rollNo.toUpperCase() } });
        if (existingUser) {

            return res.status(200).json({ error: 'Username already exists' });
        }
        if (existingRollNo) {

            return res.status(202).json({ error: 'RollNo already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ name, User_name: User_name.toLowerCase(), password: hashedPassword, usertype: 1, gender, isHosteller, rollNo: rollNo.toUpperCase(), natural_amt: 0, amount: 0 });


        res.status(201).json({ message: "success" });
    } catch (error) {

        console.error(error);
        res.status(500).json({ error: 'Error registering user' });
    }

}

// Login controller
const loginAdmin = async(req, res) => {
    try {
        
        const requestIp = req.get('origin')
        console.log("Admin login requested from:",requestIp)
        // if (requestIp !== "http://121.200.55.212:8367") {

            
        //     return res.status(401).json({ error: 'Invalid password' });
        // }
        const { User_name, password } = req.body;

        // Find the user by their username
        const user = await User.findOne({ where: { User_name, usertype: 1 } });

        if (!user) {
            console.log(password,User_name)

            return res.status(401).json({ error: 'Invalid admin username' });

        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log(password,User_name)
            return res.status(401).json({ error: 'Invalid admin name or password' });
        }

        // Generate a JWT token with an expiry time of 1 day
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1d',
        });
        console.log(password,User_name,"success")

        res.status(200).json({ token, id: user.id, userName: user.User_name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in' });
    }
}
const login = async(req, res) => {
    try {
        const requestIp = req.get('origin')
        console.log("App login requested from:",requestIp)
        
        const { User_name, password , version } = req.body;
       
        if(!version){
            return res.status(401).json({ error: 'Invalid username' });
        }
        
        if(version != process.env.VERSION){
            return res.status(401).json({ error: 'Update App to continue' });
        }
        
        // Find the user by their username
        const user = await User.findOne({ where: { User_name} });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username' });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a JWT token with an expiry time of 1 day
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '24h',
        });

        res.status(200).json({ token, id: user.id, userName: user.User_name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const loginwithRfid = async(req, res) => {
    try {
        const requestIp = req.get('origin')
        console.log("Rfid login requested from:",requestIp)
        // if (requestIp !== "http://121.200.55.212:8366") {
        //     return res.status(401).json({ error: 'Invalid RFID' });
        // }

        const { rfid } = req.body;

        let user = null;

        // Check if authentication method is RFID
        if (rfid) {
            // Fetch the user associated with the RFID card
            user = await User.findOne({ where: { rfid ,  usertype:0 } });

            if (!user) {
                return res.status(401).json({ error: 'Invalid RFID card' });
            }
        }

        // Generate a JWT token with an expiry time of 1 day
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '30m',
        });



        res.status(200).json({ token, id: user.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const logoutwithRfid = async(req, res) => {
    try {
        const { rfid } = req.body;



        res.status(200).json({ message: "success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error logging in' });
    }
};






module.exports = {
    register,
    login,
    loginwithRfid,
    logoutwithRfid,
    registerAdmin,
    loginAdmin
};