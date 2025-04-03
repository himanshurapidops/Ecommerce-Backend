import dotenv from 'dotenv';
import connectDB from "./database/db.js";
import app from "./app.js"

dotenv.config({path :'../env'})

console.log(process.env.MONGO_URI)

 connectDB()

 .then(()=>{
 app.listen(process.env.PORT||8000),()=>{

    console.log("server is running on port",process.env.PORT)

    app.on("error",(error)=>{

        console.log( "ERROR:",error);
        throw error
    }   )
}})
 
 .catch((error)=>{
    console.log("Mongo db failed connection !",error)
 })

