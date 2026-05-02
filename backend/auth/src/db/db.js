const mongoose=require('mongoose');



async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("db connected sucessfully");
    }catch(err){
        console.error("databased connection failes",err);
    }
}
module.exports=connectDB;