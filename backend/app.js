const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const { mongoUrl } = require("./keys");  // Make sure the mongoUrl is correctly exported from the keys file

const app = express();

// Middleware
app.use(cors());  // Enable CORS
app.use(express.json());  // Parse JSON data in request bodies

// Importing Routes
require('./models/model');
require('./models/post');
app.use(require("./routes/auth"));
app.use(require("./routes/createPost"));
app.use(require("./routes/user"));

// Connect to MongoDB
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Successfully connected to MongoDB");
    })
    .catch(err => {
        console.log("Error connecting to MongoDB:", err);
    });

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});