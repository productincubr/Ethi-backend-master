// app/controllers/web.controller.js

const db = require("../models");

// Website forms ke models
const ethi_customer_web_form = db.ethi_customer_web_form;
const ethi_customer_web_subscribe_email =
  db.ethi_customer_web_subscribe_email;

// 🔴 Yeh important hai: Customer OTP login ke liye hum yahi model use karenge
const ethi_customers = db.ethi_customers;

// India time ke options
const options = {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

// Current datetime string (tumhaare existing code ka helper)
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

/* ------------------------------------------------------------------
   1) WEBSITE CONTACT FORM
------------------------------------------------------------------- */

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

/* ------------------------------------------------------------------
   2) WEBSITE SUBSCRIBE EMAIL FORM
------------------------------------------------------------------- */

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

/* ------------------------------------------------------------------
   3) REQUEST OTP FOR LOGIN (REAL FLOW, 1 MINUTE EXPIRY)
   Route: POST /api/web_link/request_otp
------------------------------------------------------------------- */

exports.request_otp = async (req, res) => {
  try {
    // raw input, jaise "+91 98765 43210"
    const rawMobile = (req.body.mobile || "").toString().trim();

    // sirf digits rakho ( +, space, dash sab hata do )
    let mobile = rawMobile.replace(/\D/g, "");

    // last 10 digits le lo (india pattern)
    if (mobile.length >= 10) {
      mobile = mobile.slice(-10);
    }

    if (!mobile || mobile.length !== 10) {
      return res.send({
        message: "Please send a valid 10 digit mobile number",
        error: true,
      });
    }

    // 6-digit random OTP generate karo (000000–999999 nahi, 100000–999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Customer record find karo
    let customer = await ethi_customers.findOne({
      customer_mobile_no: mobile,
    });

    if (!customer) {
      // naya customer create karo minimal data ke saath
      customer = new ethi_customers({
        entry_date: currentDatetime(),
        customer_mobile_no: mobile,
        mobile_no_without_zip: mobile,
        login_type: "mobile",
        login_id: mobile,
        otp: otp,
        login_step: "OTP_SENT",
        flag: "c",
      });
    } else {
      // existing customer update karo
      customer.otp = otp;
      customer.login_type = "mobile";
      customer.login_id = mobile;
      customer.login_step = "OTP_SENT";
      // timestamps: true hai, isliye updatedAt change hoga → expiry ke liye use karenge
    }

    await customer.save();

    // 👉 Yaha SMS provider se OTP send karna hai (MSG91, Twilio, etc.)
    // Abhi ke liye hum console me print kar rahe hain, taaki tum dev me dekh sako:
    console.log("LOGIN OTP for", mobile, "=>", otp);

    return res.send({
      message: "OTP sent successfully",
      error: false,
      // dev ke liye optional: frontend me mat dikhana production me
      // otp_demo: otp,
      expires_in_seconds: 60, // 1 minute
    });
  } catch (err) {
    console.log("REQUEST_OTP_ERROR", err);
    return res.send({
      message: "Something went wrong while generating OTP",
      error: true,
    });
  }
};

/* ------------------------------------------------------------------
   4) VERIFY OTP FOR LOGIN (REAL CHECK + 1 MINUTE EXPIRY)
   Route: POST /api/web_link/verify_otp
------------------------------------------------------------------- */

exports.verify_otp = async (req, res) => {
  try {
    const rawMobile = (req.body.mobile || "").toString().trim();
    const otp = (req.body.otp || "").toString().trim();

    let mobile = rawMobile.replace(/\D/g, "");
    if (mobile.length >= 10) {
      mobile = mobile.slice(-10);
    }

    if (!mobile || mobile.length !== 10) {
      return res.send({
        error: true,
        message: "Valid mobile number is required",
      });
    }

    if (!otp || otp.length !== 6) {
      return res.send({
        error: true,
        message: "Please enter a valid 6 digit OTP",
      });
    }

    // Customer ko fetch karo
    const customer = await ethi_customers.findOne({
      customer_mobile_no: mobile,
    });

    if (!customer || !customer.otp) {
      return res.send({
        error: true,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // ⏱ 1 MINUTE EXPIRY LOGIC
    // Jab humne OTP set kiya tha, tab customer.save() hua tha
    // timestamps: true hone ki wajah se updatedAt set hua
    const now = new Date();
    const lastUpdated = customer.updatedAt || customer.createdAt || now;
    const diffMs = now - lastUpdated; // milliseconds me difference
    const oneMinuteMs = 1 * 60 * 1000;

    if (diffMs > oneMinuteMs) {
      return res.send({
        error: true,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // ✅ OTP match check
    if (customer.otp !== otp) {
      return res.send({
        error: true,
        message: "Incorrect OTP. Please try again.",
      });
    }

    // Yaha tak aa gaye matlab OTP sahi + time ke andar hai
    // Ab OTP clear kar do, login_step update karo
    customer.otp = null;
    customer.login_step = "OTP_VERIFIED";

    // TODO: Agar tum login_token use karna chahte ho to yaha generate karo
    // For example simple random string, ya JWT
    // Filhaal simple placeholder:
    // const token = crypto.randomBytes(24).toString("hex");
    // customer.login_token = token;

    await customer.save();

    return res.send({
      error: false,
      message: "OTP verified successfully",
      data: {
        customer_id: customer._id,
        customer_mobile_no: customer.customer_mobile_no,
        customer_name: customer.customer_name || null,
        // login_token: token, // future me use kar sakte ho
      },
    });
  } catch (err) {
    console.log("VERIFY_OTP_ERROR", err);
    return res.send({
      error: true,
      message: "Something went wrong while verifying OTP",
    });
  }
};
