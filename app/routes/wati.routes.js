module.exports = (app) => {
  const web_link = require("../controllers/wati.controller");

  var router = require("express").Router();

  //add by shubham jain
  router.post("/add_customer_by_wati", web_link.add_customer_by_wati);
  //add by shubham jain
  router.get("/successpaymenthitdata", web_link.successpaymenthitdata);
  router.post("/check_customer_presernt_or_not", web_link.check_customer_presernt_or_not);

  app.use("/api/wati_link", router);
};
