const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// middleware
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.sw3jgjt.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //   await client.connect();
        const userCollection = client.db("employeeDB").collection("user");
        const serviceCollection = client.db("employeeDB").collection("services");
        const opinionCollection = client.db("employeeDB").collection("opinion");
        const worksheetCollection = client.db("employeeDB").collection("worksheet");
        //jwt related api
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.Access_Token_Secret, { expiresIn: "1h" });
            res.send({ token });
        });
        // middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unauthorized access" });
            }
            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.Access_Token_Secret, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "unauthorized access" });
                }
                req.decoded = decoded;
                next();
            });
        };
        const verifyEmployee = async (req, res, next) => {
            const email = req.decoded.email;

            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isEmployee = user?.role.toLowerCase() === "employee";
            console.log(isEmployee);
            if (!isEmployee) {
                return res.status(403).send({ message: "forbidden access" });
            }
            next();
        };

        //service related api
        app.get("/services", async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result);
        });

        //user related api
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "User Already Exist", insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        //opinion related api
        app.post("/opinion", async (req, res) => {
            const message = req.body;
            const result = await opinionCollection.insertOne(message);
            res.send(result);
        });

        //employee related api
        app.get("/worksheet", verifyToken, verifyEmployee, async (req, res) => {
            const result = await worksheetCollection.find().toArray();
            res.send(result);
        });

        app.post("/worksheet", verifyToken, verifyEmployee, async (req, res) => {
            const data = req.body;
            const result = await worksheetCollection.insertOne(data);
            res.send(result);
        });
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //   await client.close();
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Server Is Running");
});

app.listen(port, () => {
    console.log(`Server Is Running On Port ${port}`);
});
