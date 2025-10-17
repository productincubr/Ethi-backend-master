const db = require("../models");

const ethi_customer_web_form = db.ethi_customer_web_form;
const ethi_customer_web_subscribe_email = db.ethi_customer_web_subscribe_email;
const options = {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};
function currentDatetime() {
  const currentDate = new Date();
  const currentDateTime = currentDate
    .toLocaleString("en-IN", options)
    .replace(",", "");
  return currentDateTime;
}
const already_exists = "Data Already Exists.";
const save_success = "Successfully Saved";
const error_msg = "Something Went Wrong, Please Try Again.";
const post_empty = "Content can not be empty!.";

exports.save_contact_form = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const fullName_ss = req.body.fullName;
      const phoneNo_ss = req.body.phoneNo;
      const email_ss = req.body.email;

      const addingdata = new ethi_customer_web_form({
        entry_date: currentDatetime(),
        fullName: fullName_ss,
        email: email_ss,
        phoneNo: phoneNo_ss,
        flag: "c",
      });

      const query = {
        $and: [
          {
            email: email_ss,
          },
          {
            phoneNo: phoneNo_ss,
          },
          {
            flag: "c",
          },
        ],
      };

      ethi_customer_web_form
        .findOne(query)
        .then(async (existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            await addingdata.save();
            res.send({ message: save_success, error: true });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.save_subscribe = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_email_ss = req.body.email;
      const addingdata = new ethi_customer_web_subscribe_email({
        entry_date: currentDatetime(),
        email: doctor_email_ss,
        flag: "c",
      });

      const query = {
        $and: [
          {
            email: doctor_email_ss,
          },
          {
            flag: "c",
          },
        ],
      };

      ethi_customer_web_subscribe_email
        .findOne(query)
        .then(async (existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            await addingdata.save();
            res.send({ message: save_success, error: true });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};
