require("dotenv").config();
const express = require("express");
const cors = require("cors");
const solutionRoutes = require("./routes/solutionRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/solutions", solutionRoutes);

module.exports = app;