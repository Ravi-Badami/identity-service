
const app=require("./app")
const connectDB=require('./config/db');
require("dotenv").config();
const logger = require('./config/logger');

connectDB();


const PORT=process.env.PORT||5000;


app.listen(PORT,()=>{
  logger.info(`listening to ${PORT}`);
})