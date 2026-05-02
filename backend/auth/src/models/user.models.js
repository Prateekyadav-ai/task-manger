// const mongoose=require('mongoose');

// const addressSchema=new mongoose.Schema({
//     street:{
//         type:String,
//         required:true
//     },
//     city:{
//         type:String,
//         required:true
//     },
//     state:{
//         type:String,
//         required:true
//     },
//     zipCode:{
//         type:String,
//         required:true
//     },
//     country:{
//         type:String,
//         required:true
//     }
// });


// const userSchema=new mongoose.Schema({
//     username:{
//         type:String,
//         required:true,
//          unique:true},
//     password:{
//         type:String,
//         select:false,},
//     email:{
//         type:String,
//         unique:true,
//         required:true}, 
//     fullName:{
//         firstName:{
//             type:String,
//             required:true},
//         lastName:{
//             type:String,
//             required:true   
//         }
//     },
//     role:{
//         type:String,
//         enum:['user','seller'],
//         default:'user'
//     } , 
//     address:[addressSchema]         
// })

// const userModel=mongoose.model('User',userSchema);

// module.exports=userModel;

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        enum: ['user', 'seller', 'Admin'],
        default: 'user'
    },
    address: addressSchema  // 👈 single object (recommended)
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);