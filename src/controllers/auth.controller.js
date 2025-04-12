import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {
    const {fullName,email,password}=req.body;
    try {

        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are Required!"});
        }
        //hash password
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 Characters"});
        }
        const user = await User.findOne({email});
        if(user) return res.status(400).json({message:"Email Already Exists!"})

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password:hashedPassword
        })
        if (newUser) {
            // generate jwt token here
            generateToken(newUser._id,res)
            await newUser.save();

            res.status(201).json({
                _id:newUser._id,
                fullname:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
        }else{
            res.status(400).json({message : "Invalid User Data"})
        }

    } catch (error) {
        console.error("Error in Signup Controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}
export const login = async (req, res) => {
    const {email, password}=req.body;
    console.log("body data",req.body);
    try {
        const user = await User.findOne({email});

        if (!user) {
            return res.status(400).json({message:"Invalid Credentials!"})
        }
        const isPasswordCorrect = await bcrypt.compare(password,user.password)
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid Credentials!"})
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        })
    } catch (error) {
        console.error("Error in Login Controller", error.message);
        res.status(500).json({message:"Internal Server Error!"});
    }
}
export const logout = (req, res) => {
    try {
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Logged Out Successfully!!"});
    } catch (error) {
        console.log("Error in Logout Controller!");
        res.status(500).json({message:"Internal Server Error!"})

    }
}
export const updateProfile = async (req, res) =>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;
        if (!profilePic) {
            return res.status(400).json({message:"Profile Picture is Required!"});
        }
        const uploadResponse=await cloudinary.uploader.upload(profilePic);
        const updatedUser=await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});

        res.status(200).json({message:"Updated User!"});

    } catch (error) {
        console.error("error in update profile:",error)
        res.status(500).json({message:"Internal Server Error!"});
    }
}
export const checkAuth = async (req,res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("error in :",error)
        res.status(500).json({message:"Internal Server Error!"});
    }
}