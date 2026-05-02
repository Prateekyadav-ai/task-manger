const {Redis}=require("ioredis")


const redis=new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
})


// redis.on("connect",()=>{
//     console.log("connected to redis");
// })
redis.connect()
  .then(() => {
    console.log('Redis connected');
  })
  .catch((err) => {
    console.log('Redis failed, continuing wnpithout it');
  });

module.exports=redis;