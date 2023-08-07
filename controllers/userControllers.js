const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

//get user data
const getData = async (req, res, next) => {
  try {
    const { page = 1, limit = 250 } = req.body;
    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(Number(limit));

    if (users.length > 0) {
      res.send(users);
    } else {
      res.send({ result: "no users found" });
    }
  } catch (error) {
    next(error);
  }
};

 
//GET CURRENT USER DATA
const getCurrentUserData = async (req, res, next) => {

  console.log("Current user id");
  console.log(req.body);
  try{
    let result = await User.findById({ _id: req.params.id });
    if (result) {
      res.send(result);
    } else {
      res.status(400).json({ Error: "No user found" });
    }
  }catch(e){
      res.status(400).json({Error: "Wrong user Id"})
  }
};

const allUsers = asyncHandler(async (req, res) => {
 const keyword = req.query.search
   ? {
       $or: [
         { firstName: { $regex: req.query.search, $options: "i" } },
         { email: { $regex: req.query.search, $options: "i" } },
       ],
     }
   : {};

 const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
 res.send(users);
});


// Register the issue
const registerUser = asyncHandler(async (req, res) => {
 const { name, email, password, pic } = req.body;

 if (!name || !email || !password) {
   res.status(400);
   throw new Error("Please Enter all the Feilds");
 }

 const userExists = await User.findOne({ email });

 if (userExists) {
   res.status(400);
   throw new Error("User already exists");
 }

 const user = await User.create({
   name,
   email,
   password,
   pic,
 });

 if (user) {
   res.status(201).json({
     _id: user._id,
     name: user.name,
     email: user.email,
     isAdmin: user.isAdmin,
     pic: user.pic,
     token: generateToken(user._id),
   });
 } else {
   res.status(400);
   throw new Error("User not found");
 }
});


//Authenticate the user
const authUser = asyncHandler(async (req, res) => {
 const { email, password } = req.body;
 const user = await User.findOne({ email });
 if(email == null || email == ''){
    res.status(400).json({Error: "Email Can't be blank"})
 }
 if(password == null || password == ''){
  res.status(400).json({Error: "Password Can't be blank"})
}
if(!user){
  res.status(401).json({Error: "Invalid Email"})
}else{
  if(await user.matchPassword(password)){
    res.json(
      {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    }
    );
  }else{
      res.status(401).json({Error: "Invalid Email or Password"});
  }
}
}
);

// Export the modules

module.exports = {
 allUsers,
 registerUser,
 authUser,
 getData,
 getCurrentUserData,
};