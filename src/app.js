const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.get("/health", (req, res) => {
    res.send("Server is running....");
});

app.all("*", (req, res, next) => {
    const error = new Error(`Can't find ${req.originalUrl} on the server`);
    error.status = 404;
    next(error);
});

app.listen(port, () => {
    console.log(`Assignment 12 Server is running on port ${port}`);
});
