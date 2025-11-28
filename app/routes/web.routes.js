module.exports = (app) => {
  const web_link = require("../controllers/web.controller.js");
  const router = require("express").Router();

  router.post("/request_otp", web_link.request_otp);
  router.post("/verify_otp", web_link.verify_otp);  // <-- NEW

  router.post("/customer_web_contact_form", web_link.save_contact_form);
  router.post("/customer_web_subscribe_email", web_link.save_subscribe);

  app.use("/api/web_link", router);
};
