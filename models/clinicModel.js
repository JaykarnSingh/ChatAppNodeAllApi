
const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
   
   
    clinicName:{
        type:String
    },
    block:{
        type:String
    },
    
    email:{
        type:String
    },
    password:{
        type:String
    }

})

const User=mongoose.model("clinic",userSchema);
module.exports=User;