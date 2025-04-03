import express from 'express';
import cookieParser from 'cookie-parser';
import cors from "cors"
import morgan from 'morgan';

 const app = express();



app.use(morgan("dev"))

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))

app.use(express.json({
    limit : '16kb'
}))

app.use(express.urlencoded({
    extended :true,
    limit : "16kb"
}))

app.use(express.static("public"))
app.use(cookieParser())

//routes import 

import userRouter from './routes/user.routes.js';


//routes declaration

app.use("/api/v1/users",userRouter)


 export default app;