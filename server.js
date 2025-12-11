require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");

const app = express();
const db = require("./app/models");
var corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
};

//app.use(cors(corsOptions));
app.use(cors());

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Define the path to the "images" folder
const imagePath = path.join(__dirname, "app/assets/goal_master_image");
app.use("/goal_master_image", express.static(imagePath));

const imagePath2 = path.join(__dirname, "app/assets/ethi_front_image");
app.use("/ethi_front_image", express.static(imagePath2));

const imagePath3 = path.join(__dirname, "app/assets/ethi_admin_master_image");
app.use("/ethi_admin_master_image", express.static(imagePath3));

const imagePath4 = path.join(__dirname, "app/assets/ethi_testmonial_image");
app.use("/ethi_testmonial_image", express.static(imagePath4));

const imagePath5 = path.join(__dirname, "app/assets/ethi_user_image");
app.use("/ethi_user_image", express.static(imagePath5));

const imagePath6 = path.join(__dirname, "app/assets/ethi_doctor_image");
app.use("/ethi_doctor_image", express.static(imagePath6));

const imagePath7 = path.join(__dirname, "app/assets/ethi_feeds_image");
app.use("/ethi_feeds_image", express.static(imagePath7));

const imagePath8 = path.join(__dirname, "app/assets/ethi_user_document");
app.use("/ethi_user_document", express.static(imagePath8));

const imagePath9 = path.join(__dirname, "app/assets/ethi_notification_image");
app.use("/ethi_notification_image", express.static(imagePath9));

const imagePath10 = path.join(__dirname, "app/assets/ethi_video_master_image");
app.use("/ethi_video_master_image", express.static(imagePath10));

const imagePath11 = path.join(__dirname, "app/assets/ethi_query_master_image");
app.use("/ethi_query_master_image", express.static(imagePath11));

const imagePath12 = path.join(__dirname, "app/assets/ethi_doctor_csv");
app.use("/ethi_doctor_csv", express.static(imagePath12));

// simple route
app.use(
  fileUpload({
    limits: {
      fileSize: 10000000, // Around 10MB
    },
    abortOnLimit: true,
  })
);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
require("./app/routes/admin.routes")(app);
require("./app/routes/native.routes")(app);
require("./app/routes/doctor.routes")(app);
require("./app/routes/web.routes")(app);
require("./app/routes/wati.routes")(app);

// Auth routes
require("./app/routes/auth.routes")(app);


db.mongoose
  .connect(db.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!");
    console.log(err);
    process.exit();
  });
