const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');//db
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken');//jwt
const cookieParser = require('cookie-parser');//cookie parser
require('dotenv').config();//dotenv



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.by2eb1n.mongodb.net/?retryWrites=true&w=majority`;


//middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

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

        //custom middleware
        const verifyToken = async (req, resp, next) => {
            // get token
            const token = req?.headers?.authorization?.split(" ")[1];
            // console.log(1,token);

            if (!token) return resp.status(401).send({ message: "unauthorize access" });
            //verify token
            jwt.verify(token, process.env.ACCESS_SECRET, (error, decoded) => {
                // console.log(2, token);

                if (error) return resp.status(401).send({ message: "unauthorize access" });
                req.decoded = decoded;
                // console.log(decoded);
                next();
            });
        };
        //jwt
        app.post('/jwt', async (req, resp) => {
            const user = req.body;
            const token = await jwt.sign(user, process.env.ACCESS_SECRET, { expiresIn: '1h' });
            // console.log(0, token);
            resp.send({ token });
        });


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
        app.post('/bookings', verifyToken, async (req, resp) => {
            const booking = req.body;
            const { roomId, date } = booking;

            //checking room available or not
            //get all bookings for same room
            const booked = await bookings.find({ roomId: roomId }).toArray();
            //checking the date same or not
            const res = await booked.find(booking => booking.date === date);

            // console.log(res ? 'unavailable' : "available");
            const result = res ? { unavailable: true } : await bookings.insertOne(booking);
            resp.send(result);
        });
        //bookings of an user
        app.get('/bookings', verifyToken, async (req, resp) => {
            // console.log(req?.decoded?.email, req?.query?.email);
            if (req?.decoded?.email !== req?.query?.email) return resp.status(403).send({ message: "forbidden access" });
            let query = {};
            if (req.query.email) query = { email: req.query.email };

            const result = await bookings.find(query).toArray();
            resp.send(result);
        });
        //get a booking by id
        app.get('/booking/:id', async (req, resp) => {
            const { id } = req.params;
            const result = await bookings.findOne({ _id: new ObjectId(id) });
            resp.send(result);
        });
        //update a booking
        app.patch('/update/:id', verifyToken, async (req, resp) => {
            const b_id = req.params.id;
            const { newDate, roomId } = req.body;

            const query = { _id: new ObjectId(b_id) };
            const { email } = await bookings.findOne(query);
            console.log(email);

            if (req?.decoded?.email !== email) return resp.status(403).send({ message: "forbidden access" });

            //get all bookings for same room/roomId
            const booked = await bookings.find({ roomId: roomId }).toArray();
            //checking the date same or not
            const res = await booked.find(booking => booking.date === newDate);

            //res ? no : update
            if (res) return resp.send({ unavailable: true });

            //update
            const newDoc = {
                $set: {
                    date: newDate
                }
            };
            const result = await bookings.updateOne(query, newDoc);
            resp.send(result);
        });
        //delete a booking
        app.delete('/bookings/:id', verifyToken, async (req, resp) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookings.deleteOne(query);
            resp.send(result);
        });
        //post a review
        app.post('/review/:id', async (req, resp) => {
            const id = req.params.id;
            const newReview = req.body;
            const query = { _id: new ObjectId(id) }

            const { reviews } = await rooms.findOne(query);
            // console.log(newReview, reviews);
            await reviews.push(newReview);
            console.log(reviews);
            //update
            const newDoc = {
                $set:{
                    reviews:reviews
                }
            };
            const result = await rooms.updateOne(query, newDoc);
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
app.listen(port, () => {
    console.log("Hotel is running on port:", port);
});