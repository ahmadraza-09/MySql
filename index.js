const express = require("express");
const mysql = require("mysql");
require("dotenv").config();
const app = express();
app.use(express.json());
const PORT = 8000 || process.env.PORT;

const db = mysql.createConnection({
  database: process.env.DATABASE,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Database connected successfully");
  }
});

app.get("/", (req, res) => {
  try {
    res.status(200).send({ message: "Welcome to MySql API" });
  } catch (error) {
    res.status(404).send({ message: "There is an Error", error });
  }
});

app.use("/student", require("./Routes/StudentRoute"));

app.listen(PORT, (error) => {
  if (error) {
    console.error(error);
  } else {
    console.log(`Server has started at ${PORT}`);
  }
});
