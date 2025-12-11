// app/routes/auth.routes.js

module.exports = (app) => {
  const auth = require("../controllers/auth.controller.js");
  const router = require("express").Router();

  // STEP 1: Email access request
  router.post("/request_email_access", auth.request_email_access);

  // STEP 2 & 3: owner approval links
  router.get("/owner-approve/:token", auth.owner_approve);
  router.get("/owner-reject/:token", auth.owner_reject);

  app.use("/api/auth", router);
};
