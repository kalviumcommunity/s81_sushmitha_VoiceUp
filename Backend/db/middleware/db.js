const mongoose=require("mongoose");

const db=async()=>{
    try{
        mongoose.connect(process.env.MONGODB_URI);
        console.log("mongodb connected");
    }
    catch(e){
        console.log(e);
    }
}
module.exports=db;