const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express());

app.get('/', (req, resp) => {
    resp.send("Stars Hotel is Running.");
});

//server response
app.listen(port, ()=>{
    console.log("Hotel is running on port:", port);
});