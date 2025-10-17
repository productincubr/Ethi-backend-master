module.exports = (app) => {
  const web_link = require("../controllers/web.controller");

  var router = require("express").Router();

  router.post("/customer_web_contact_form", web_link.save_contact_form);
  router.post("/customer_web_subscribe_email", web_link.save_subscribe);

  app.use("/api/web_link", router);
};
