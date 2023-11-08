const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
//dotenv
require('dotenv').config();

//db
const { MongoClient, ServerApiVersion } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.by2eb1n.mongodb.net/?retryWrites=true&w=majority`;


//middleware
app.use(express());
app.use(cors());
//custom middleware

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        //my db collections
        const rooms = client.db("stars-hotel").collection("rooms");
        

        //all rooms
        app.get('/rooms', async (req, resp) => {
            const result = await rooms.find().toArray();
            resp.send(result);
        });
        //get featured rooms
        app.get('/featured-rooms', async (req, resp) => {
            const query = { "discount": { $gt: 0 } };
            const result = await rooms.find(query).toArray();
            console.log(result);
            resp.send(result);

        });


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

//root route
app.get('/', (req, resp) => {
    resp.send("Stars Hotel is Running.");
});

//server response
app.listen(port, ()=>{
    console.log("Hotel is running on port:", port);
});