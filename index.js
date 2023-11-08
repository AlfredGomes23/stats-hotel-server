const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
//dotenv
require('dotenv').config();

//db
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.by2eb1n.mongodb.net/?retryWrites=true&w=majority`;


//middleware
app.use(express.json());
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
        const bookings = client.db("stars-hotel").collection("bookings");


        //all rooms
        app.get('/rooms', async (req, resp) => {
            const result = await rooms.find().toArray();
            resp.send(result);
        });
        //get discounts
        app.get('/discounts', async (req, resp) => {
            const query = { "discount": { $gt: 0 } };
            const result = await rooms.find(query).toArray();
            resp.send(result);
        });
        //get featured rooms
        app.get('/featured', async (req, resp) => {
            const query = { "featured": { $eq: true } };
            const result = await rooms.find(query).toArray();
            resp.send(result);
        });
        //get a specific room
        app.get('/rooms/:id', async (req, resp) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await rooms.findOne(query);
            resp.send(result);
        });
        //post a booking
        app.post('/bookings', async (req, resp) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookings.insertOne(booking);
            resp.send(result);
        });
        //bookings of an user
        app.get('/bookings', async (req, resp) => {

            let query = {};
            if (req.query.email) query = { email: req.query.email };

            const result = await bookings.find(query).toArray();
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
app.listen(port, () => {
    console.log("Hotel is running on port:", port);
});