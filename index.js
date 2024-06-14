const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );

  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");

  if (!verify?.email) {
    return res.send(" You are not authorized");
  }
  req.user = verify.email;

  next();
}

const client = new MongoClient(process.env.URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("devdeive_course");
    const course = database.collection("course");
    const user = database.collection("user");

    //   course

    app.get("/course", async (req, res) => {
      const data = course.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      const result = await course.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.post("/course/add", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await course.insertOne(data);
      res.send(result);
    });
    app.delete("/course/delete/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await course.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });  

    app.patch("/course/edit/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const result = await course.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      res.send(result);
    });

    app.get("/course/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const result = await course.find({ authorEmail: email }).toArray();
      res.send(result); 
    });

    // user

    app.get("/user", async (req, res) => {
      const data = user.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const data = req.body;
      const token = createToken(data);
    // console.log(token);
      const itUserExist = await user.findOne({ email: data?.email });
      if (itUserExist?._id) {
        return res.send({
          token
        });
      }
      await user.insertOne(data);
      res.send({token});
    });
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await user.findOne({ email });
      res.send(result);
    });

    app.patch("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const updateData = req.body;
      const result = await user.updateOne(
        { email },
        { $set: updateData },
        { upsert: true }
      );
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.listen(port, (req, res) => {
  console.log(port);
});
