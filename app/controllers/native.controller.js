const db = require("../models");
const path = require("path");
const fs = require("fs");

const puppeteer = require("puppeteer");
const axios = require("axios");
const stripe_old = require("stripe")(process.env.STRIPE_LIVE_SECRET_KEY);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { RtcTokenBuilder, RtcRole } = require("agora-token");
const ethi_customers = db.ethi_customers;
const ethi_corporate = db.ethi_corporate;
const ethi_goals_master = db.ethi_goals_master;
const ethi_customers_goals = db.ethi_customers_goals;
const ethi_front_master = db.ethi_front_master;
const ethi_admin_master = db.ethi_admin_master;
const ethi_testmonial = db.ethi_testmonial;
const ethi_faq_master = db.ethi_faq_master;
const ethi_package_master = db.ethi_package_master;
const ethi_subscription_plan = db.ethi_subscription_plan;
const ethi_doctor_master = db.ethi_doctor_master;
const ethi_feeds_master = db.ethi_feeds_master;
const ethi_feeds_like = db.ethi_feeds_like;
const ethi_feeds_bookmark = db.ethi_feeds_bookmark;
const ethi_quote_master = db.ethi_quote_master;
const ethi_doctor_diet_plan = db.ethi_doctor_diet_plan;
const ethi_appointment_with_doctor = db.ethi_appointment_with_doctor;
const ethi_video_master = db.ethi_video_master;
const ethi_progress_diet_plan = db.ethi_progress_diet_plan;
const ethi_customers_document = db.ethi_customers_document;
const ethi_help_center_master = db.ethi_help_center_master;
const ethi_notification_master = db.ethi_notification_master;
const ethi_query_master = db.ethi_query_master;
const ethi_doctors_goals = db.ethi_doctors_goals;
const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;
const channelName = process.env.AGORA_CHANNEL_NAME;
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

const options2 = {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

function currentDatetimeonly_date() {
  const currentDate = new Date();
  const currentDateTime = currentDate
    .toLocaleString("en-IN", options2)
    .replace(",", "");

  let date_formate = currentDateTime.split("/");
  let date_formate_show =
    date_formate[2] + "-" + date_formate[1] + "-" + date_formate[0];

  return date_formate_show;
}

function currentimeonly_date() {
  const date = new Date();
  const formattedDateTime = date.toLocaleString("en-IN", options);
  const [datePart, timePart] = formattedDateTime.split(", ");
  // Extract time from the timePart
  const [time, period] = timePart.split(" ");
  const [hours, minutes] = time.split(":");
  // Format hours in 12-hour format
  const formattedHours = parseInt(hours, 10) % 12 || 12;
  const formattedTime = `${formattedHours}:${minutes} ${period}`;
  return `${datePart}, ${formattedTime}`;
}

const crypto = require("crypto");
// Generate an MD5 hash for a value (e.g., microtime)
function generateMD5Hash() {
  const microtime = new Date().getTime().toString();
  const md5Hash = crypto.createHash("md5").update(microtime).digest("hex");
  return md5Hash;
}

const error_msg = "Something Went Wrong, Please Try Again";
const post_empty = "Content can not be empty!";
const no_doctor_found = "No Doctor Found, Please Try Again";
const save_success = "Successfully Saved";
const data_user_image = "/ethi_user_image/";
const data_doctor_image = "/ethi_doctor_image/";
const data_feed_image = "/ethi_feeds_image/";
const data_goal_image = "/goal_master_image/";

// Fetch data from Collection2 with condition
const data_front_image = "/ethi_front_image/";
// Fetch data from Collection2 with condition
const data_admin_image = "/ethi_admin_master_image/";
// Fetch data from Collection2 with condition
const data_testmonial_image = "/ethi_testmonial_image/";
// Fetch data from Collection2 with condition
const data_ethi_video_master_image = "/ethi_video_master_image/";

const data_user_document_image = "/ethi_user_document/";

// Fetch data from Collection2 with condition
const data_notification_image = "/ethi_notification_image/";
// Retrieve login data for user
exports.login_to_application = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const user_customer_mobile_no = req.body.code_for + req.body.phone_no;
      const user_customer_mobile_no_without_zip = req.body.phone_no;
      const firebase_token_id = req.body.firebase_token;
      const click_type = req.body.click_type;

      const query = {
        $and: [
          {
            customer_mobile_no: user_customer_mobile_no,
          },
          {
            login_type: "normal",
          },
          // Add more conditions as needed
        ],
      };

      const filter = {
        customer_mobile_no: user_customer_mobile_no,
        login_type: "normal",
      };
      let otp_send = 1234;
      if (click_type === "0") {
        otp_send = generateOTP();
        const update = {
          $set: {
            otp: otp_send,
            firebase_token: firebase_token_id,
          },
        };
        await ethi_customers.updateOne(filter, update, {
          useFindAndModify: false,
        });
      }

      await ethi_customers
        .find(query)
        .then((data) => {
          if (data[0]) {
            if (click_type === "0") {
              sendotp(otp_send, user_customer_mobile_no_without_zip);
            }

            const ethi_customers_data = data[0];
            const responseData = {
              ethi_customers_data,
              data_user_image,
            };

            res.send(responseData);
          } else {
            res.send({
              message: "Please Signup Mobile No Not Present.",
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.signup_to_application = (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const user_customer_mobile_no = req.body.code_for + req.body.phone_no;
      const user_customer_mobile_no_without_zip = req.body.phone_no;
      const customer_name_user = req.body.customer_name_user;
      const customer_email_user = req.body.customer_email;
      const firebase_token_id = req.body.firebase_token;
      const login_type_id = req.body.login_type;
      const login_token_id = req.body.login_token;
      const login_id_id = req.body.login_id;

      let query = {
        $and: [
          {
            customer_mobile_no: user_customer_mobile_no,
          },
          {
            login_type: login_type_id,
          },
          // Add more conditions as needed
        ],
      };
      if (customer_email_user !== "") {
        query = {
          $and: [
            {
              customer_email: customer_email_user,
            },
            {
              login_type: login_type_id,
            },
            // Add more conditions as needed
          ],
        };
      }

      const otp_send = generateOTP();

      const ethi_customers_ss = new ethi_customers({
        entry_date: currentDatetime(),
        customer_name: customer_name_user,
        customer_mobile_no: user_customer_mobile_no,
        mobile_no_without_zip: user_customer_mobile_no_without_zip,
        customer_email: customer_email_user,
        customer_image: "user_image.png",
        date_of_birth: "",
        gender: "",
        height_fit: "0",
        height_cm: "0",
        weight_kg: "0",
        weight_lbs: "0",
        blood_group: "",
        address: "",
        pincode: "",
        city: "",
        state: "",
        contry: "",
        feeling_type: "",
        send_msg_flag: 0,
        receive_msg_flag: 0,
        last_msg_send: "",
        last_msg_time: "",
        firebase_token: firebase_token_id,
        otp: otp_send,
        last_subscription_id: "",
        last_doctor_id: "",
        choose_goal: "0",
        hours_water: "5",
        sleep_hour: "8",
        step_count: "0",
        heart_rate: "0",
        login_type: login_type_id,
        login_id: login_id_id,
        login_token: login_token_id,
        package_select_status: "0",
        package_id: "0",
        package_start_date: "",
        package_end_date: "",
        period_start_date: "",
        referred_by: "",
        description: "",
        add_by: "application",
        call_flag: "0",
        Comment: "",
        period_end_date: "",
        period_days: "",
        login_step: 0,
        flag: "c",
      });

      ethi_customers
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: "Mobile No Already Present. Please Login.",
            });
          } else {
            const newCustomer = new ethi_customers(ethi_customers_ss);
            newCustomer
              .save()
              .then((savedCustomer) => {
                sendotp(otp_send, user_customer_mobile_no_without_zip);
                console.log("click 3");
                res.send(savedCustomer);
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                });
              });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.signup_to_application_google = (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const user_customer_mobile_no = req.body.code_for + req.body.phone_no;
      const user_customer_mobile_no_without_zip = req.body.phone_no;
      const customer_name_user = req.body.customer_name_user;
      const customer_email_user = req.body.customer_email;
      const firebase_token_id = req.body.firebase_token;
      const login_type_id = req.body.login_type;
      const login_token_id = req.body.login_token;
      const login_id_id = req.body.login_id;

      let query = {
        $and: [
          {
            customer_mobile_no: user_customer_mobile_no,
          },
          {
            login_type: login_type_id,
          },
          // Add more conditions as needed
        ],
      };
      if (customer_email_user !== "") {
        query = {
          $and: [
            {
              customer_email: customer_email_user,
            },
            {
              login_type: login_type_id,
            },
            {
              customer_name: customer_name_user,
            },
            // Add more conditions as needed
          ],
        };
      }

      const otp_send = generateOTP();

      const ethi_customers_ss = new ethi_customers({
        entry_date: currentDatetime(),
        customer_name: customer_name_user,
        customer_mobile_no: user_customer_mobile_no,
        mobile_no_without_zip: user_customer_mobile_no_without_zip,
        customer_email: customer_email_user,
        customer_image: "user_image.png",
        date_of_birth: "",
        gender: "",
        height_fit: "0",
        height_cm: "0",
        weight_kg: "0",
        weight_lbs: "0",
        blood_group: "",
        address: "",
        pincode: "",
        city: "",
        state: "",
        contry: "",
        feeling_type: "",
        send_msg_flag: 0,
        receive_msg_flag: 0,
        last_msg_send: "",
        last_msg_time: "",
        firebase_token: firebase_token_id,
        otp: otp_send,
        last_subscription_id: "",
        last_doctor_id: "",
        choose_goal: "0",
        hours_water: "5",
        sleep_hour: "8",
        login_type: login_type_id,
        login_id: login_id_id,
        login_token: login_token_id,
        package_select_status: "0",
        package_id: "0",
        package_start_date: "",
        package_end_date: "",
        login_step: 0,
        flag: "c",
      });

      ethi_customers
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            const ethi_customers_data = existingCustomer;
            const responseData = {
              ethi_customers_data,
              data_user_image,
            };

            res.send(responseData);
          } else {
            const newCustomer = new ethi_customers(ethi_customers_ss);
            newCustomer
              .save()
              .then((savedCustomer) => {
                const ethi_customers_data = savedCustomer;
                const responseData = {
                  ethi_customers_data,
                  data_user_image,
                };
                res.send(responseData);
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                });
              });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.signup_to_corporate = (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_name_user = req.body.customer_name;
      const company_name_get = req.body.company_name;
      const work_email_id_get = req.body.work_email_id;
      const mobile_no_get = req.body.mobile_no;
      const no_of_employee_get = req.body.no_of_employee;

      const query = {
        $and: [
          {
            mobile_no: mobile_no_get,
          },
        ],
      };

      const ethi_corporate_ss = new ethi_corporate({
        entry_date: currentDatetime(),
        customer_name: customer_name_user,
        company_name: company_name_get,
        work_email_id: work_email_id_get,
        mobile_no: mobile_no_get,
        no_of_employee: no_of_employee_get,
        status_for_check: "c",
        flag: "c",
      });

      ethi_corporate
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: "Mobile No Already Present.",
            });
          } else {
            const newCustomer = new ethi_corporate(ethi_corporate_ss);
            newCustomer
              .save()
              .then((savedCustomer) => {
                res.send(savedCustomer);
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                });
              });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.goal_master_data = async (req, res) => {
  try {
    const customer_id = req.body.customer_id;
    var condition = {
      flag: "c",
    };

    var condition11 = {
      flag: "c",
      customer_id: customer_id,
    };
    // Fetch data from Collection1 with condition
    const old_goal = await ethi_customers_goals.find(condition11).exec();

    // Fetch data from Collection1 with condition
    const data1 = await ethi_goals_master.find(condition).exec();

    // Combine the results into a single object
    const responseData = {
      data1,
      old_goal,
      data_goal_image,
    };
    res.send(responseData);
  } catch (error) {
    res.send({
      message: error_msg,
    });
  }
};

// Retrieve login data for user
exports.update_customer_goal = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const with_id_goal = req.body.with_id_goal;
      const without_id_goal = req.body.without_id_goal;
      const customer_id = req.body.customer_id;
      const firebase_token = req.body.firebase_token;

      const filter1 = {
        customer_id: customer_id,
      };

      const filter = {
        _id: customer_id,
      };

      const update = {
        $set: {
          choose_goal: "1",
          login_step: "1",
        },
      };

      ethi_customers_goals
        .deleteMany(filter1)
        .then((result) => {
          ethi_customers
            .updateOne(filter, update, {
              useFindAndModify: false,
            })
            .then((data) => {
              if (with_id_goal.length > 0) {
                with_id_goal.forEach((item, index) => {
                  const newCustomer = new ethi_customers_goals({
                    entry_date: currentDatetime(),
                    customer_id: customer_id,
                    goal_id: item.goal_id,
                    customer_goal_name: item.goal_name,
                    customer_goal_detail: item.goal_details,
                    customer_goal_image: item.goal_image,
                    flag: "c",
                  });
                  newCustomer.save();
                });
              }
              if (without_id_goal.length > 0) {
                without_id_goal.forEach(async (item, index) => {
                  const query = {
                    $and: [
                      { goal_name: item.goal_name },
                      { goal_details: item.goal_details },
                      // Add more conditions as needed
                    ],
                  };

                  const data = await ethi_goals_master.find(query);
                  if (!data[0]) {
                    const ethi_goals_master_data = new ethi_goals_master({
                      entry_date: currentDatetime(),
                      goal_name: item.goal_name,
                      goal_details: item.goal_details,
                      flag: "c",
                      goal_image: "",
                    });

                    const savedCustomer = await ethi_goals_master_data.save();

                    const newCustomer = new ethi_customers_goals({
                      entry_date: currentDatetime(),
                      customer_id: customer_id,
                      goal_id: savedCustomer._id,
                      customer_goal_name: item.goal_name,
                      customer_goal_detail: item.goal_details,
                      customer_goal_image: "",
                      flag: "c",
                    });

                    await newCustomer.save();
                  }
                });
              }
              res.send({
                message1: "compelete",
              });
            })
            .catch((err) => {
              res.send({
                message: error_msg,
              });
            });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.get_front_master_and_goal = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id = req.body.customer_id;
      var condition = {
        flag: "c",
        customer_id: customer_id,
      };
      var condition2 = {
        flag: "c",
      };

      // Fetch data from Collection1 with condition
      const data1 = await ethi_customers_goals.find(condition).exec();
      const data2 = await ethi_front_master.find(condition2).exec();
      const data6 = await ethi_admin_master.find(condition2).exec();

      const data7 = await ethi_testmonial.find(condition2).exec();
      const data9 = await ethi_faq_master.find(condition2).exec();

      const responseData = {
        data1,
        data2,
        data_goal_image,
        data_front_image,
        data_admin_image,
        data6,
        data7,
        data_testmonial_image,
        data9,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.get_package_master = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      var condition = {
        flag: "c",
        status_for: "0",
      };
      var condition2 = {
        flag: "c",
      };
      // Fetch data from Collection1 with condition
      const data1 = await ethi_package_master.find(condition).exec();
      const data2 = await ethi_admin_master.find(condition2).exec();

      // Combine the results into a single object
      const responseData = {
        data1,
        data2,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.submit_pre_payment = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const user_customer_mobile_no = req.body.customer_mobile_no;
      const customer_name_user = req.body.customer_name_user;
      const customer_id_dd = req.body.customer_id;
      const package_id_dd = req.body.package_id;
      const complete_calling_dd = req.body.complete_calling;
      const payment_amount_dd = req.body.payment_amount;
      const order_id_dd = req.body.order_id;
      const customer_image_dd = req.body.customer_image;
      const firebase_token_id = req.body.firebase_token;
      const complete_days = parseInt(req.body.complete_days, 10);
      const currentDate = new Date();

      // Format the date as YYYY-MM-dd
      let year = currentDate.getFullYear();
      let month = String(currentDate.getMonth() + 1).padStart(2, "0");
      let day = String(currentDate.getDate()).padStart(2, "0");

      const package_start_date_dd = `${year}-${month}-${day}`;

      currentDate.setDate(currentDate.getDate() + complete_days);

      // Format the date as YYYY-MM-dd
      year = currentDate.getFullYear();
      month = String(currentDate.getMonth() + 1).padStart(2, "0");
      day = String(currentDate.getDate()).padStart(2, "0");

      const package_end_date_dd = `${year}-${month}-${day}`;

      const query = {
        $and: [
          {
            customer_id: customer_id_dd,
          },
          {
            package_end_date: {
              $gt: new Date(package_end_date_dd),
            },
          },
          // Add more conditions as needed
        ],
      };

      const customer = await stripe.customers.create();
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2023-08-16" }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: payment_amount_dd * 100,
        currency: "INR",
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const ethi_customers_ss = new ethi_subscription_plan({
        entry_date: currentDatetime(),
        doctor_id: "",
        doctor_name: "",
        doctor_image: "",
        customer_id: customer_id_dd,
        customer_name: customer_name_user,
        customer_mobile_no: user_customer_mobile_no,
        customer_image: customer_image_dd,
        package_id: package_id_dd,
        package_start_date: package_start_date_dd,
        package_end_date: package_end_date_dd,
        no_of_calling: 0,
        complete_calling: complete_calling_dd,
        payment_amount: payment_amount_dd,
        payment_mode: "Online",
        order_id: customer.id,
        payment_id: "",
        payment_status: 0,
        renew_status: "d",
        flag: "d",
      });

      ethi_subscription_plan
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: "Package  Already Present. Please Login.",
            });
          } else {
            const newCustomer = new ethi_subscription_plan(ethi_customers_ss);
            newCustomer
              .save()
              .then((savedCustomer) => {
                const paymentIntent_data = paymentIntent.client_secret;
                const data = savedCustomer;
                const customer_order_id = customer.id;
                const ephemeralKey_data = ephemeralKey.secret;
                const responseData = {
                  data,
                  paymentIntent_data,
                  customer_order_id,
                  ephemeralKey_data,
                };
                res.send(responseData);
              })
              .catch((err) => {
                console.log(err);
                res.send({
                  message: error_msg,
                });
              });
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.submit_final_payment = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const package_id_dd = req.body.package_id;
      const subscription_plans_id = req.body.subscription_plans_id;
      const payment_id_dd = req.body.payment_id;
      const firebase_token_id = req.body.firebase_token;
      let doctor_id_dd = "0";
      const filter = {
        _id: subscription_plans_id,
        package_id: package_id_dd,
        customer_id: customer_id_id,
      };

      /* dynamic doctor logic */
      const customerGoals = await ethi_customers_goals.find({
        customer_id: customer_id_id,
      });

      // Extract goal ids
      const customerGoalIds = customerGoals.map((goal) => goal.goal_id);

      // Find doctor goals with common goal ids
      const doctorGoals = await ethi_doctors_goals.find({
        goal_id: { $in: customerGoalIds },
      });
      // Extract doctor ids
      const doctorIds = [...new Set(doctorGoals.map((goal) => goal.doctor_id))];
      console.log(doctorIds);
      if (doctorIds[0]) {
        //  send only the _id of the doctor

        doctor_id_dd = doctorIds[0];
      } else {
        // No matching doctor found
        var condition1 = {
          flag: "c",
          allow_access: "1",
        };
        const data_doctor_data_only = await ethi_doctor_master
          .find(condition1)
          .limit(1)
          .exec();
        doctor_id_dd = data_doctor_data_only[0]._id;
      }

      /* dynamic doctor logic */

      var condition_customer = {
        flag: "c",
        _id: customer_id_id,
      };
      var condition_package_detsila = {
        flag: "c",
        _id: package_id_dd,
      };

      const ethi_subscription_plan_data = await ethi_subscription_plan
        .find(filter)
        .exec();
      const cusromer_details = await ethi_customers
        .find(condition_customer)
        .exec();
      const package_details = await ethi_package_master
        .find(condition_package_detsila)
        .exec();
      const inputData = {
        inputInvoice: subscription_plans_id || "Default Data",
        inputOrderId: "",
        package_name: package_details[0].package_name || "Default Data",
        inputAmount:
          ethi_subscription_plan_data[0].payment_amount || "Default Data",
        inputpersionname: cusromer_details[0].customer_name || "Default Data",
        inputDate:
          ethi_subscription_plan_data[0].package_start_date || "Default Data",
        inputSubscription:
          ethi_subscription_plan_data[0].package_end_date || "Default Data",
      };

      let invoice_pdf_ss = await generatePDF(inputData);
      var condition = {
        flag: "c",
        _id: doctor_id_dd,
      };
      const data_doctor_data = await ethi_doctor_master.find(condition).exec();
      if (data_doctor_data[0]) {
        const filter1 = {
          _id: customer_id_id,
        };
        const filter_renew = {
          customer_id: customer_id_id,
          payment_status: "0",
          renew_status: "d",
          flag: "d",
        };

        const update_renew = {
          $set: {
            payment_status: "done",
            payment_id: payment_id_dd,
            doctor_id: doctor_id_dd,
            doctor_name: data_doctor_data[0].doctor_name,
            doctor_image: data_doctor_data[0].doctor_image,
            invoice_pdf: invoice_pdf_ss,
            flag: "c",
            renew_status: "c",
          },
        };
        const update1 = {
          $set: {
            last_subscription_id: subscription_plans_id,
            last_doctor_id: doctor_id_dd,
            package_id: package_id_dd,
            package_select_status: "1",
            package_start_date:
              ethi_subscription_plan_data[0].package_start_date,
            package_end_date: ethi_subscription_plan_data[0].package_end_date,
            login_step: "2",
          },
        };
        const filter_remove = {
          package_id: package_id_dd,
          customer_id: customer_id_id,
          flag: "c",
          renew_status: "c",
        };
        const update_remove = {
          $set: {
            payment_status: "repayment",
            flag: "d",
            renew_status: "c",
          },
        };
        ethi_subscription_plan
          .updateMany(filter_remove, update_remove, {
            useFindAndModify: false,
          })
          .then((data) => {
            ethi_subscription_plan
              .updateOne(filter, update_renew, {
                useFindAndModify: false,
              })
              .then((data) => {
                if (data.modifiedCount > 0) {
                  ethi_subscription_plan
                    .deleteMany(filter_renew)
                    .then((result) => {
                      ethi_customers
                        .updateOne(filter1, update1, {
                          useFindAndModify: false,
                        })
                        .then((data2) => {
                          res.send(data2);
                        })
                        .catch((err) => {
                          res.send({
                            message: error_msg,
                          });
                        });
                    })
                    .catch((err) => {
                      res.send({
                        message: error_msg,
                      });
                    });
                } else {
                  res.send({
                    message: error_msg,
                  });
                }
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                });
              });
          })
          .catch((err) => {
            res.send({
              message: error_msg,
            });
          });
      } else {
        res.send({
          message: no_doctor_found + " " + doctor_id_dd,
        });
      }
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.get_meeting_datetime = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition = {
        flag: "c",
        _id: customer_id_id,
      };
      const data_customers_data = await ethi_customers.find(condition).exec();
      let last_subscription_id = 0;
      let last_doctor_id = 0;
      if (data_customers_data[0]) {
        last_subscription_id = data_customers_data[0].last_subscription_id;
        last_doctor_id = data_customers_data[0].last_doctor_id;
      }
      var condition2 = {
        flag: "c",
        _id: last_subscription_id,
      };
      var condition3 = {
        flag: "c",
        _id: last_doctor_id,
      };

      const ethi_subscription_plan_data = await ethi_subscription_plan
        .find(condition2)
        .exec();

      const ethi_doctor_master_data = await ethi_doctor_master
        .find(condition3)
        .exec();
      const data_data_doctor_image = data_doctor_image;

      const responseData = {
        data_customers_data,
        ethi_subscription_plan_data,
        ethi_doctor_master_data,
        data_data_doctor_image,
      };

      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.get_feed_doctor_admin = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition = {
        flag: "c",
        _id: customer_id_id,
      };
      var condition2 = {
        flag: "c",
        customer_id: customer_id_id,
      };
      const data_customers_data = await ethi_customers.find(condition).exec();
      //data_customers_data[0].last_doctor_id

      const ethi_feeds_like_data = await ethi_feeds_like
        .find(condition2)
        .exec();
      const ethi_feeds_bookmark_data = await ethi_feeds_bookmark
        .find(condition2)
        .exec();

      let doctor_id_for = 0;
      if (data_customers_data[0]) {
        doctor_id_for = data_customers_data[0].last_doctor_id;
      }

      const data_ethi_feeds_master = await ethi_feeds_master
        .aggregate([
          {
            $lookup: {
              from: "ethi_doctor_masters",
              let: { customerId: "$doctor_id" },
              pipeline: [
                {
                  $match: {
                    _id: { $eq: "$$customerId" },
                    $or: [
                      { customerId: "000000000000000000000000" },
                      { customerId: doctor_id_for },
                    ],
                    flag: "c",
                  },
                },
              ],
              as: "customer_data",
            },
          },
          {
            $sort: {
              "customer_data.createdAt": -1, // Replace with the actual field to sort by
            },
          },
        ])
        .exec();

      const data_ethi_feeds_image = data_feed_image;
      const data_data_doctor_image = data_doctor_image;

      // Combine the results into a single object
      const responseData = {
        data_ethi_feeds_master,
        data_ethi_feeds_image,
        data_data_doctor_image,
        ethi_feeds_like_data,
        ethi_feeds_bookmark_data,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

// Retrieve login data for user
exports.get_feed_native = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition = {
        flag: "c",
        _id: customer_id_id,
      };
      var condition2 = {
        flag: "c",
        customer_id: customer_id_id,
      };
      const data_customers_data = await ethi_customers.find(condition).exec();
      //data_customers_data[0].last_doctor_id

      const ethi_feeds_like_data = await ethi_feeds_like
        .find(condition2)
        .exec();
      const ethi_feeds_bookmark_data = await ethi_feeds_bookmark
        .find(condition2)
        .exec();

      let doctor_id_for = "000000000000000000000000";
      if (data_customers_data[0]) {
        doctor_id_for = data_customers_data[0].last_doctor_id;
      }
      var condition3 = {
        flag: "c",
        approve_status: "c",
        $or: [
          { doctor_id: doctor_id_for },
          { doctor_id: "000000000000000000000000" },
        ],
      };

      const data_ethi_feeds_master = await ethi_feeds_master
        .find(condition3)
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .exec();

      const data_ethi_feeds_image = data_feed_image;
      const data_data_doctor_image = data_doctor_image;

      // Combine the results into a single object
      const responseData = {
        data_ethi_feeds_master,
        data_ethi_feeds_image,
        data_data_doctor_image,
        ethi_feeds_like_data,
        ethi_feeds_bookmark_data,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.update_ethi_feeds_like = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const feed_id_id = req.body.feed_id;
      var condition2 = {
        customer_id: customer_id_id,
        feed_id: feed_id_id,
      };
      var condition3 = {
        _id: feed_id_id,
      };

      const ethi_feeds_like_data = await ethi_feeds_like
        .find(condition2)
        .exec();
      const ethi_feeds_master_data = await ethi_feeds_master
        .find(condition3)
        .exec();
      let like_count = ethi_feeds_master_data[0].total_likes + 1;
      let update2 = {
        $set: {
          total_likes: like_count,
        },
      };
      if (ethi_feeds_like_data[0]) {
        let update = {
          $set: {
            flag: "c",
          },
        };
        if (ethi_feeds_like_data[0].flag == "c") {
          update = {
            $set: {
              flag: "d",
            },
          };
          like_count = ethi_feeds_master_data[0].total_likes - 1;
        }

        update2 = {
          $set: {
            total_likes: like_count,
          },
        };

        ethi_feeds_like
          .updateOne(condition2, update, {
            useFindAndModify: false,
          })
          .then((data) => {
            //  res.send(data);
          })
          .catch((err) => {
            res.send({
              message: error_msg,
            });
          });
      } else {
        const ethi_feeds_like_data = new ethi_feeds_like({
          entry_date: currentDatetime(),
          customer_id: customer_id_id,
          feed_id: feed_id_id,
          flag: "c",
        });

        ethi_feeds_like_data
          .save()
          .then((savedCustomer) => {
            // res.send(savedCustomer);
          })
          .catch((err) => {});
      }

      ethi_feeds_master
        .updateOne(condition3, update2, {
          useFindAndModify: false,
        })
        .then((data) => {
          //data
          res.send(data);
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.update_ethi_feeds_bookmark = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const feed_id_id = req.body.feed_id;
      var condition2 = {
        customer_id: customer_id_id,
        feed_id: feed_id_id,
      };
      const ethi_feeds_bookmark_data = await ethi_feeds_bookmark
        .find(condition2)
        .exec();

      if (ethi_feeds_bookmark_data[0]) {
        let update = {
          $set: {
            flag: "c",
          },
        };
        if (ethi_feeds_bookmark_data[0].flag == "c") {
          update = {
            $set: {
              flag: "d",
            },
          };
        }

        ethi_feeds_bookmark
          .updateOne(condition2, update, {
            useFindAndModify: false,
          })
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            res.send({
              message: error_msg,
            });
          });
      } else {
        const ethi_feeds_bookmark_data = new ethi_feeds_bookmark({
          entry_date: currentDatetime(),
          customer_id: customer_id_id,
          feed_id: feed_id_id,
          flag: "c",
        });

        ethi_feeds_bookmark_data
          .save()
          .then((savedCustomer) => {
            res.send(savedCustomer);
          })
          .catch((err) => {});
      }
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.get_my_doctor_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        _id: customer_id_id,
      };

      const ethi_customers_data = await ethi_customers.find(condition2).exec();
      if (ethi_customers_data[0]) {
        var condition3 = {
          _id: ethi_customers_data[0].last_doctor_id,
        };

        const data_doctor = await ethi_doctor_master.find(condition3).exec();

        const responseData = {
          data_doctor,
          data_doctor_image,
        };
        res.send(responseData);
      } else {
        res.send({
          message: "No Data found",
        });
      }
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.get_my_profile_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        _id: customer_id_id,
      };
      var condition3 = {
        customer_id: customer_id_id,
        flag: "c",
      };
      const ethi_customers_data = await ethi_customers.find(condition2).exec();

      const ethi_goal_data = await ethi_customers_goals.find(condition3).exec();
      const responseData = {
        ethi_customers_data,
        ethi_goal_data,
        data_goal_image,
        data_user_image,
      };
      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.get_home_profile_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        _id: customer_id_id,
      };
      var condition = {
        flag: "c",
      };

      const ethi_customers_data = await ethi_customers.find(condition2).exec();
      let highestSequenceDoc = 0;
      let last_doctor_id = 0;
      let last_subscription_id = 0;
      if (ethi_customers_data[0]) {
        last_doctor_id = ethi_customers_data[0].last_doctor_id;
        last_subscription_id = ethi_customers_data[0].last_subscription_id;
        highestSequenceDoc = await ethi_doctor_diet_plan
          .findOne({
            customer_id: customer_id_id,
            doctor_id: last_doctor_id,
            subscription_id: last_subscription_id,
          })
          .sort("-sequence_id"); // Find the document with the highest sequence
        try {
          highestSequenceDoc = highestSequenceDoc.sequence_id;
        } catch (err) {
          //erro
        }
      }

      var condition3 = {
        customer_id: customer_id_id,
        doctor_id: last_doctor_id,
        subscription_id: last_subscription_id,
        sequence_id: highestSequenceDoc,
        flag: "c",
      };

      var condition4 = {
        subscription_id: last_subscription_id,
        status_for_complete: "0",
        flag: "c",
      };

      var condition6 = {
        _id: last_subscription_id,
        flag: "c",
      };
      var condition7 = {
        _id: last_doctor_id,
        flag: "c",
      };
      const ethi_doctor_diet_plan_master = await ethi_doctor_diet_plan
        .find(condition3)
        .limit(2)
        .exec();

      const ethi_appointment_with_doctor_data =
        await ethi_appointment_with_doctor.find(condition4).exec();

      const get_subscription_data = await ethi_subscription_plan
        .find(condition6)
        .exec();
      const get_doctor_data = await ethi_doctor_master.find(condition7).exec();

      const count = await ethi_quote_master.countDocuments(condition);
      const randomIndex = Math.floor(Math.random() * count);

      const ethi_quote_master_data = await ethi_quote_master
        .findOne(condition)
        .skip(randomIndex);

      const ethi_video_master_data = await ethi_video_master
        .find(condition)
        .exec();
      const data_video_image = data_ethi_video_master_image;
      const responseData = {
        ethi_customers_data,
        data_user_image,
        ethi_quote_master_data,
        ethi_doctor_diet_plan_master,
        ethi_appointment_with_doctor_data,
        get_subscription_data,
        ethi_video_master_data,
        data_video_image,
        data_doctor_image,
        get_doctor_data,
      };

      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.update_feeling_type = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const feeling_type_id = req.body.feeling_type;

      const update = {
        $set: {
          feeling_type: feeling_type_id,
        },
      };
      const filter = {
        _id: customer_id_id,
      };
      ethi_customers
        .updateOne(filter, update, {
          useFindAndModify: false,
        })
        .then((savedCustomer) => {
          res.send({
            message: "done",
          });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.get_my_dietplan_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        _id: customer_id_id,
      };

      const ethi_customers_data = await ethi_customers.find(condition2).exec();

      let highestSequenceDoc = 0;
      let last_doctor_id = 0;
      let last_subscription_id = 0;
      if (ethi_customers_data[0]) {
        last_doctor_id = ethi_customers_data[0].last_doctor_id;
        last_subscription_id = ethi_customers_data[0].last_subscription_id;
        highestSequenceDoc = await ethi_doctor_diet_plan
          .findOne({
            customer_id: customer_id_id,
            doctor_id: last_doctor_id,
            subscription_id: last_subscription_id,
          })
          .sort("-sequence_id"); // Find the document with the highest sequence

        if (highestSequenceDoc !== null) {
          highestSequenceDoc = highestSequenceDoc.sequence_id;
        }
      }
      var condition3 = {
        customer_id: customer_id_id,
        doctor_id: last_doctor_id,
        subscription_id: last_subscription_id,
        sequence_id: highestSequenceDoc,
        flag: "c",
      };

      var condition4 = {
        subscription_id: last_subscription_id,
        status_for_complete: "0",
        flag: "c",
      };

      var condition5 = {
        customer_id: customer_id_id,
        flag: "c",
      };

      var condition6 = {
        _id: last_doctor_id,
        flag: "c",
      };

      const ethi_doctor_diet_plan_master = await ethi_doctor_diet_plan
        .find(condition3)
        .exec();
      const ethi_appointment_with_doctor_data =
        await ethi_appointment_with_doctor.find(condition4).exec();

      const ethi_appointment_with_doctor_dat_main = await ethi_doctor_master
        .find(condition6)
        .exec();

      const ethi_progress_diet_plan_data = await ethi_progress_diet_plan
        .find(condition5)
        .exec();

      const responseData = {
        ethi_appointment_with_doctor_data,
        ethi_appointment_with_doctor_dat_main,
        ethi_progress_diet_plan_data,
        ethi_doctor_diet_plan_master,
        data_user_document_image,
      };
      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.update_dietplan_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const diet_id_id = req.body.diet_id;
      var condition2 = {
        customer_id: customer_id_id,
        diet_plan_id: diet_id_id,
      };
      const ethi_progress_diet_plan_data = await ethi_progress_diet_plan
        .find(condition2)
        .exec();

      if (ethi_progress_diet_plan_data[0]) {
        res.send(ethi_progress_diet_plan_data);
      } else {
        const ethi_progress_diet_plan_data = new ethi_progress_diet_plan({
          entry_date: currentDatetime(),
          click_date: currentDatetimeonly_date(),
          customer_id: customer_id_id,
          diet_plan_id: diet_id_id,
          flag: "c",
        });

        ethi_progress_diet_plan_data
          .save()
          .then((savedCustomer) => {
            res.send(savedCustomer);
          })
          .catch((err) => {});
      }
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.get_package_details = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        _id: customer_id_id,
      };

      const ethi_customers_data = await ethi_customers.find(condition2).exec();

      let highestSequenceDoc = 0;
      let last_doctor_id = 0;
      let last_subscription_id = 0;
      if (ethi_customers_data[0]) {
        last_doctor_id = ethi_customers_data[0].last_doctor_id;
        last_subscription_id = ethi_customers_data[0].last_subscription_id;
        highestSequenceDoc = await ethi_doctor_diet_plan
          .findOne({
            customer_id: customer_id_id,
            doctor_id: last_doctor_id,
            subscription_id: last_subscription_id,
          })
          .sort("-sequence_id"); // Find the document with the highest sequence
        highestSequenceDoc = highestSequenceDoc.sequence_id;
      }
      var condition3 = {
        customer_id: customer_id_id,
        doctor_id: last_doctor_id,
        subscription_id: last_subscription_id,
        sequence_id: highestSequenceDoc,
        flag: "c",
      };

      var condition4 = {
        subscription_id: last_subscription_id,
        status_for_complete: "0",
        flag: "c",
      };

      var condition5 = {
        customer_id: customer_id_id,
        flag: "c",
      };

      const ethi_doctor_diet_plan_master = await ethi_doctor_diet_plan
        .find(condition3)
        .exec();
      const ethi_appointment_with_doctor_data =
        await ethi_appointment_with_doctor.find(condition4).exec();

      const ethi_progress_diet_plan_data = await ethi_progress_diet_plan
        .find(condition5)
        .exec();

      const responseData = {
        ethi_appointment_with_doctor_data,
        ethi_progress_diet_plan_data,
        ethi_doctor_diet_plan_master,
      };

      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.book_appointment = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const selected_time_id = convert12HourTo24Hour(req.body.selected_time);
      const selected_date_id = req.body.selected_date;
      const doctor_id_id = req.body.doctor_id;
      const subscription_id_dd = req.body.subscription_id;

      const query = {
        $and: [
          {
            doctor_id: doctor_id_id,
          },
          {
            booking_date: selected_date_id,
          },
          {
            booking_start_time: selected_time_id,
          },
          {
            status_for_complete: "0",
          },
        ],
      };

      var condition6 = {
        flag: "c",
        customer_id: customer_id_id,
        subscription_id: subscription_id_dd,
        doctor_id: doctor_id_id,
        status_for_complete: "0",
      };

      const data_count_apponiment_data = await ethi_appointment_with_doctor
        .find(condition6)
        .limit(2)
        .sort({ createdAt: -1 })
        .exec();

      if (data_count_apponiment_data[0]) {
        res.send({
          message:
            "Already Appointment on " +
            data_count_apponiment_data[0].booking_date +
            " Time " +
            data_count_apponiment_data[0].booking_start_time,
          error: true,
        });
      } else {
        var condition4 = {
          flag: "c",
          customer_id: customer_id_id,
          subscription_id: subscription_id_dd,
          doctor_id: doctor_id_id,
          status_for_complete: "1",
        };
        const count_apponiment = await ethi_appointment_with_doctor
          .countDocuments(condition4)
          .exec();
        let time_add = 30;
        if (count_apponiment > 1) {
          time_add = 15;
        }
        var condition = {
          flag: "c",
          _id: customer_id_id,
        };
        var condition3 = {
          flag: "c",
          _id: doctor_id_id,
        };
        const data_customers_data = await ethi_customers.find(condition).exec();
        const ethi_doctor_master_data = await ethi_doctor_master
          .find(condition3)
          .exec();

        let customer_name_dd = "User";
        let customer_mobile_no_dd = "";
        let customer_image_dd = "";
        if (data_customers_data[0]) {
          customer_name_dd = data_customers_data[0].customer_name;
          customer_mobile_no_dd = data_customers_data[0].customer_mobile_no;
          customer_image_dd = data_customers_data[0].customer_image;
        }

        let doctor_name_dd = "";
        let doctor_tag_dd = "";
        let doctor_image_dd = "";
        if (ethi_doctor_master_data[0]) {
          doctor_name_dd = ethi_doctor_master_data[0].doctor_name;
          doctor_tag_dd = ethi_doctor_master_data[0].doctor_tag;
          doctor_image_dd = ethi_doctor_master_data[0].doctor_image;
        }

        ethi_appointment_with_doctor
          .findOne(query)
          .then((existingCustomer) => {
            if (existingCustomer) {
              res.send({
                message: "Doctor Is Busy That Time Please Choose Another Time.",
              });
            } else {
              const booking_end_time_dd = add_time(selected_time_id, time_add);
              let make_sec = convertinsec(
                selected_date_id,
                booking_end_time_dd
              );
              let token_agora_dd = generateAgoraToken(customer_id_id, make_sec);

              const ethi_appointment_with_doctor_ss =
                new ethi_appointment_with_doctor({
                  entry_date: currentDatetime(),
                  doctor_id: doctor_id_id,
                  subscription_id: subscription_id_dd,
                  doctor_name: doctor_name_dd,
                  doctor_tag: doctor_tag_dd,
                  doctor_image: doctor_image_dd,
                  customer_id: customer_id_id,
                  customer_name: customer_name_dd,
                  customer_mobile_no: customer_mobile_no_dd,
                  customer_image: customer_image_dd,
                  booking_date: selected_date_id,
                  booking_start_time: selected_time_id,
                  booking_end_time: booking_end_time_dd,
                  which_no_booking: count_apponiment,
                  diet_plan_status: "0",
                  assesment_form_status: "0",
                  token_agora: token_agora_dd,
                  book_by: "user",
                  status_for_complete: "0",
                  flag: "c",
                });

              const newCustomer = new ethi_appointment_with_doctor(
                ethi_appointment_with_doctor_ss
              );
              newCustomer
                .save()
                .then((savedCustomer) => {
                  const filter = {
                    _id: customer_id_id,
                  };

                  const update = {
                    $set: {
                      login_step: "2",
                    },
                  };

                  ethi_customers
                    .updateOne(filter, update, {
                      useFindAndModify: false,
                    })
                    .then((data) => {
                      res.send(data);
                    })
                    .catch((err) => {
                      res.send({
                        message: error_msg,
                      });
                    });
                })
                .catch((err) => {
                  res.send({
                    message: error_msg,
                  });
                });
            }
          })
          .catch((err) => {
            res.send({
              message: error_msg,
            });
          });
      }
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.get_last_booking_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition = {
        flag: "c",
        customer_id: customer_id_id,
        status_for_complete: "0",
      };
      const data_customers_data = await ethi_appointment_with_doctor
        .find(condition)
        .exec();
      const responseData = {
        data_customers_data,
        appId,
        channelName,
      };

      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.check_doctor_id = async (req, res) => {
  try {
    const customer_id_id = "659ffeeb34095535b03560da";
    /* dynamic doctor logic */
    // Find customer goals
    // Find customer goals
    const customerGoals = await ethi_customers_goals.find({
      customer_id: customer_id_id,
    });

    // Extract goal ids
    const customerGoalIds = customerGoals.map((goal) => goal.goal_id);

    // Find doctor goals with common goal ids
    const doctorGoals = await ethi_doctors_goals.find({
      goal_id: { $in: customerGoalIds },
    });
    // Extract doctor ids
    const doctorIds = [...new Set(doctorGoals.map((goal) => goal.doctor_id))];
    console.log(customerGoalIds);

    if (doctorIds) {
      // Successful login, send only the _id of the doctor
      res.json({ success: true, doctorId: doctorIds[0] });
    } else {
      // No matching doctor found
      res.json({
        success: false,
        message: "No matching doctor found for the customer",
      });
    }

    /* dynamic doctor logic */
  } catch (err) {
    console.log(err);
    res.send({
      message: error_msg,
    });
  }
};

exports.upload_document = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const total_document_id = req.body.total_document;

      var condition = {
        flag: "c",
        _id: customer_id_id,
      };

      const data_customers_data = await ethi_customers.find(condition).exec();

      let last_doctor_id = "0";
      let package_id_dd = "";

      if (data_customers_data[0]) {
        last_doctor_id = data_customers_data[0].last_doctor_id;
        package_id_dd = data_customers_data[0].package_id;
      }

      for (let i = 0; i < total_document_id; i++) {
        let document_data_ss = "";
        const fileField = `file_attachment${i}`; // Create the field name for the current file
        const doctor_image_ssss = req.files[fileField]; // Access the file from req.files using the field name
        if (doctor_image_ssss) {
          document_data_ss = upload_image(
            "_ethi_document",
            data_user_document_image,
            doctor_image_ssss
          );
        }

        const ethi_customers_document_data = new ethi_customers_document({
          entry_date: currentDatetime(),
          customer_id: customer_id_id,
          package_id: package_id_dd,
          doctor_id: last_doctor_id,
          document_data: document_data_ss,
          flag: "c",
        });

        ethi_customers_document_data.save();
      }
      const responseData = {
        data_customers_data,
      };

      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.get_my_plan = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition = {
        flag: "c",
        _id: customer_id_id,
      };
      const data_customers_data = await ethi_customers.find(condition).exec();

      let package_id = "000000000000000000000000";
      let doctor_id = "000000000000000000000000";
      let last_subscription_id = "000000000000000000000000";
      if (data_customers_data[0].package_id !== "0") {
        package_id = data_customers_data[0].package_id;
        doctor_id = data_customers_data[0].last_doctor_id;
        last_subscription_id = data_customers_data[0].last_subscription_id;
      }

      var condition2 = {
        flag: "c",
        _id: package_id,
      };
      const data_package_data = await ethi_package_master
        .find(condition2)
        .exec();

      var condition3 = {
        flag: "c",
        _id: doctor_id,
      };
      const data_ethi_doctor_master_data = await ethi_doctor_master
        .find(condition3)
        .exec();

      var condition2 = {
        flag: "c",
        _id: last_subscription_id,
      };

      const ethi_subscription_plan_data = await ethi_subscription_plan
        .find(condition2)
        .exec();

      const data_data_doctor_image = data_doctor_image;
      const responseData = {
        data_customers_data,
        data_package_data,
        data_ethi_doctor_master_data,
        data_data_doctor_image,
        data_user_document_image,
        ethi_subscription_plan_data,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.get_all_notification = async (req, res) => {
  try {
    var condition = {
      flag: "c",
    };

    // Fetch data from Collection1 with condition
    const data_notification = await ethi_notification_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();

    // Combine the results into a single object
    const responseData = {
      data_notification,
      data_notification_image,
    };
    res.send(responseData);
  } catch (error) {
    console.log(error);
    res.send({
      message: error_msg,
    });
  }
};
exports.delete_documents = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const document_id_id = req.body.document_id;
      const filter = {
        _id: document_id_id,
        customer_id: customer_id_id,
      };
      const update = {
        $set: {
          flag: "d",
        },
      };

      ethi_customers_document
        .updateOne(filter, update, {
          useFindAndModify: false,
        })
        .then((data) => {
          //data
          return res.send(data);
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.get_all_documents = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      var condition2 = {
        flag: "c",
        customer_id: customer_id_id,
      };
      const ethi_documents_data = await ethi_customers_document
        .find(condition2)
        .exec();

      const responseData = {
        ethi_documents_data,
      };
      res.send(responseData);
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.my_bookmark = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;

      var condition2 = {
        flag: "c",
        customer_id: customer_id_id,
      };

      const ethi_feeds_like_data = await ethi_feeds_like
        .find(condition2)
        .exec();
      const ethi_feeds_bookmark_data = await ethi_feeds_bookmark
        .find(condition2)
        .exec();

      const fetchFeedDataPromises = ethi_feeds_bookmark_data.map(
        async (bookmark) => {
          const feed_data = await ethi_feeds_master
            .find({ _id: bookmark.feed_id })
            .exec();

          return feed_data[0];
        }
      );

      const data_ethi_feeds_master = await Promise.all(fetchFeedDataPromises);

      const responseData = {
        data_ethi_feeds_master,
        ethi_feeds_like_data,
        ethi_feeds_bookmark_data,
        data_ethi_feeds_image: data_feed_image,
        data_data_doctor_image: data_doctor_image,
      };

      res.send(responseData);
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};
exports.help_center_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;

      var condition1 = {
        flag: "c",
        popular_type: "0",
      };

      const ethi_help_center = await ethi_help_center_master
        .find(condition1)
        .exec();

      var condition2 = {
        flag: "c",
        popular_type: "1",
      };

      const ethi_help_center_popular = await ethi_help_center_master
        .find(condition2)
        .exec();

      // Combine the results into a single object
      const responseData = {
        ethi_help_center,
        ethi_help_center_popular,
      };
      res.send(responseData);
    } catch (error) {
      res.send({
        message: error.message,
      });
    }
  }
};
exports.submit_contact_us = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const issue_name = req.body.issue_name;
      const issue_comment = req.body.issue_comment;
      const customer_name_id = req.body.customer_name;
      const customer_email_id = req.body.customer_email;

      const ethi_query_master_data = new ethi_query_master({
        entry_date: currentDatetime(),
        customer_id: customer_id_id,
        customer_name: customer_name_id,
        customer_email: customer_email_id,
        issue_name: issue_name,
        issue_detail: issue_comment,
        flag: "c",
      });

      ethi_query_master_data
        .save()
        .then((savedCustomer) => {
          res.send(savedCustomer);
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (error) {
      res.send({
        message: error.message,
      });
    }
  }
};

exports.submit_profile_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const customer_name_id = req.body.customer_name;
      const height_id = req.body.height;
      const weight_id = req.body.weight;
      const mobile_number_id = req.body.mobile_number_with_zip;
      const mobile_no_without_zip_id = req.body.mobile_number;
      const email_full_id = req.body.email_full;
      const country_id = req.body.country;
      const state_id = req.body.state;
      const city_id_id = req.body.city;
      const pincode_id_id = req.body.pincode;
      const address_id = req.body.address;
      const dob_id = req.body.dob;
      const firebase_token_id = req.body.firebase_token;
      const gender_id = req.body.gender;
      const login_type_id = req.body.login_type;
      const blood_group_ddd = req.body.blood_group;
      const weight_id_lbs = weight_id * 2.2;
      const height_id_fit = height_id * 0.0328;
      let document_data_ss = req.body.old_image;

      if (req.files) {
        document_data_ss = upload_image(
          "_ethi_user",
          data_user_image,
          req.files.file_attachment
        );
      }

      const filter = {
        _id: customer_id_id,
      };
      const update = {
        $set: {
          customer_name: customer_name_id,
          customer_mobile_no: mobile_number_id,
          mobile_no_without_zip: mobile_no_without_zip_id,
          customer_email: email_full_id,
          customer_image: document_data_ss,
          date_of_birth: dob_id,
          gender: gender_id,
          height_fit: height_id_fit,
          height_cm: height_id,
          weight_kg: weight_id,
          weight_lbs: weight_id_lbs,
          address: address_id,
          pincode: pincode_id_id,
          city: city_id_id,
          state: state_id,
          contry: country_id,
          firebase_token: firebase_token_id,
          blood_group: blood_group_ddd,
        },
      };

      await ethi_customers
        .updateOne(filter, update, {
          useFindAndModify: false,
        })
        .then(async (savedCustomer) => {
          const data1 = await ethi_customers.find(filter).exec();
          const ethi_customers_data = data1[0];
          const responseData = {
            ethi_customers_data,
            data_user_image,
          };

          res.send(responseData);
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (err) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.update_msg_customer = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const last_msg_send_id = req.body.last_msg_send;

      const filter = {
        _id: customer_id_id,
      };
      const update = {
        $set: {
          send_msg_flag: 1,
          receive_msg_flag: 0,
          last_msg_send: last_msg_send_id,
          last_msg_time: currentimeonly_date(),
        },
      };

      await ethi_customers
        .updateOne(filter, update, {
          useFindAndModify: false,
        })
        .then(async (savedCustomer) => {
          res.send({
            message: save_success,
          });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (error) {
      res.send({
        message: error.message,
      });
    }
  }
};
exports.update_login_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const customer_id_id = req.body.customer_id;
      const login_id_dd = req.body.login_id;
      const login_token_dd = req.body.login_token;
      const customer_email_dd = req.body.user_email;
      const filter = {
        _id: customer_id_id,
      };
      const update = {
        $set: {
          login_id: login_id_dd,
          customer_email: customer_email_dd,
          login_token: login_token_dd,
        },
      };

      await ethi_customers
        .updateOne(filter, update, {
          useFindAndModify: false,
        })
        .then(async (savedCustomer) => {
          res.send({
            message11: "done",
          });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
          });
        });
    } catch (error) {
      res.send({
        message: error_msg,
      });
    }
  }
};

exports.delete_account = async (req, res) => {
  res.send({ message: "Your account deleted in 7 days" });
};

function convert12HourTo24Hour(time12) {
  // Split the input time into hours, minutes, and AM/PM

  const [time, period] = time12.split(" ");
  const [hours, minutes] = time.split(":");

  // Convert hours and minutes to integers
  const hoursInt = parseInt(hours, 10);
  const minutesInt = parseInt(minutes, 10);
  // Calculate the 24-hour equivalent hours
  let hours24 = hoursInt;
  if (period === "PM" && hoursInt !== 12) {
    hours24 += 12;
  } else if (period === "AM" && hoursInt === 12) {
    hours24 = 0;
  }

  // Convert to string format with leading zeros
  const hours24Str = hours24.toString().padStart(2, "0");
  const minutesStr = minutesInt.toString().padStart(2, "0");

  return `${hours24Str}:${minutesStr}`;
}
function add_time(initialTime, minutesToAdd) {
  // Parse the initial time string
  const [hours, minutes] = initialTime.split(":").map(Number);

  // Create a new Date object with the initial time
  const currentTime = new Date();
  currentTime.setHours(hours);
  currentTime.setMinutes(minutes);

  // Add minutes to the current time
  currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);

  // Format the new time as "hh:mm"
  const newHours = currentTime.getHours();
  const newMinutes = currentTime.getMinutes();
  const newTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
    .toString()
    .padStart(2, "0")}`;
  return newTime;
}

function generateAgoraToken(userId, expirationTimeInSeconds) {
  // Example usage

  const role = RtcRole.PUBLISHER;

  // Set the token expiration time
  const expirationTime =
    Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

  // Generate the token
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    0,
    role,
    expirationTime
  );

  return token;
}

function convertinsec(date_show, time_shoe) {
  let make_time = add_time(time_shoe, 15);

  let make_date = date_show + " " + make_time + ":00";
  const date1 = new Date();
  const date2 = new Date(make_date);

  const differenceInSeconds = (date2 - date1) / 1000;

  return differenceInSeconds;
}

function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  //return 1234;
  return OTP;
}
function upload_image(only_side_name, path_name_only, image_file) {
  let image_name = "";
  try {
    const md5HashValue = generateMD5Hash();
    const targetDir = `${__dirname.split("controllers")[0]}`;
    const image_type = "." + image_file.name.split(".")[1];
    image_name = md5HashValue + only_side_name + image_type;

    //const path_name = `${targetDir}assets\\goal_master_image\\${image_name}`;

    const path_name = targetDir + "assets" + path_name_only + image_name;

    image_file.mv(path_name, (err) => {
      //err
    });
  } catch (err) {
    //err
  }

  return image_name;
}

async function generatePDF(inputData) {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      body {
        font-family: "Open Sans", sans-serif;
      }
  
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
  
      .header {
        color: white;
        background-image: linear-gradient(#098F59, #177B7D);
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
  
      .header div>h1 {
        font-size: 3rem;
      }
  
      .header div {
        padding: 2rem;
      }
  
      .main {
        display: flex;
        justify-content: space-around;
        gap: 5rem;
        align-items: center;
        padding: 2rem;
      }
  
      .main ul li {
        list-style: none;
      }
  
      li {
        font-size: 1.3rem;
      }
  
      .chargeDetailsContainer {
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr;
        font-weight: 700;
      }
  
      .chargeDetailsContainer div {
        border: 1px solid black;
        padding: 1rem;
      }
  
      .chargeDetailsContainer {
        margin: 4rem;
      }
  
      .main ul:nth-child(2) {
        margin-right: 10rem;
      }
  
      .un-1 {
        text-decoration-line: underline;
      }
  
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
  
      .flex-container {
        display: flex;
      }
  
      td {
        width: 70px;
        height: 60px;
      }
  
      .grid-container {
        display: flex;
        flex-wrap: wrap;
  
      }
  
      .grid-container>p {
        flex-basis: 25%;
        flex-shrink: 0;
      }
    </style>
  </head>
  
  <body>
    <header class="header">
      <div>
        <h1 style="font-size: 60px">Tax Invoice</h1>
        <p>Original for Recipient and Duplicate for Supplier</p>
      </div>
      <div>
        <h1>ETHI</h1>
        <p class="un-1">Gurmi Foods Pvt Ltd.</p>
        <p>740, Phase-5 Udyog Vihar,</p>
        <p>Gurugram, Haryana-1222019</p>
      </div>
    </header>
    <div style="margin-top: 20px">
  
      <div class="grid-container"
        style="    font-weight: 700; display: flex;justify-content: space-between;margin: 10px 20px 0px 20px;">
        <div>
          <p>Invoice Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${inputData.inputDate}</p>
          <p>Invoice #:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${inputData.inputInvoice}
          </p>
          <p>Payments Terms: &nbsp; Online</p>
          <p>Customer GSTIN: </p>
          <p>Customer PAN: </p>
          <p>Account: </p>
          <p>Information: </p>
        </div>
        <div>
          <p>GSTIN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;06AAFCG6417M2ZC</p>
          <p>PAN: &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AAFCG6417M</p>
          <p>P.O. Number: &nbsp;${inputData.inputOrderId}</p>
          <p>Currency: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;INR</p>
        </div>
      </div>
  
      <div style="margin-top:20px;text-align: center;">
        <p style="font-weight: 700">
          whether tax is payable on reverse change basis-No.
        </p>
      </div>
      <div style="margin-top:20px;">
        <p style="margin-left: 30px;margin-top:40px; font-weight: 700">
          Consignee (Place of Supply): Ethi
        </p>
        <p style="margin-left: 30px;  font-weight: 700;margin-top:20px;">
          Name of Recipient (Billed to): ${inputData.inputpersionname}
        </p>
      </div>
    </div>
    <div style="margin-top: 40px">
      <h1 style="margin-left: 30px;">Charge Details:</h1>
      <div style=" margin: 1% 1rem">
        <table border="1">
          <tr>
            <td style="text-align: center">Charge Description</td>
            <td style="text-align: center">Subscription Period</td>
            <td style="text-align: center">Subtotal</td>
            <td style="text-align: center">Taxes,Fees &Surcharges</td>
            <td style="text-align: center">Total</td>
          </tr>
          <tr style="height:100px">
            <td style="text-align: center"> ${inputData.package_name}</td>
            <td style="text-align: center">${inputData.inputSubscription}</td>
            <td style="text-align: center">${inputData.inputAmount}</td>
            <td style="text-align: center">0</td>
            <td style="text-align: center">0</td>
          </tr>
          <tr>
            <td colspan="2" rowspan="3"></td>
            <td colspan="2" style="text-align: end">Taxable Value&nbsp;</td>
            <td style="text-align: center">0</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: end">Total (includeing Taxes,Fees & Surcharger) &nbsp;</td>
            <td style="text-align: center">0</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: end;background-color: lightblue">Invoice Balance&nbsp;</td>
            <td style="background-color: lightblue;text-align: center">${inputData.inputAmount}</td>
          </tr>
        </table>
      </div>
  </body>
  
  </html>`;
  let image_name = "sample.pdf";
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlContent);

    const data_user_image = data_user_document_image;

    const only_side_name = "_user_invoice";
    const md5HashValue = generateMD5Hash();
    const targetDir = `${__dirname.split("controllers")[0]}`;
    const image_type = ".pdf";
    image_name = md5HashValue + only_side_name + image_type;

    const path_name = targetDir + "assets" + data_user_image;

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
    });
    const pdfFilePath = path.join(path_name, image_name);
    fs.writeFile(pdfFilePath, pdfBuffer, (err) => {
      if (err) {
        console.error("Error saving PDF:", err);
      } else {
        console.log("PDF saved successfully");
      }
    });
    await browser.close();
  } catch (err) {
    console.log(err);
  }
  return image_name;
}

async function sendotp(otp_user, contacts) {
  let response = "";
  try {
    const fields = {
      route: "dlt",
      sender_id: "SWATAY",
      message: 153780,
      variables_values: otp_user,
      flash: 0,
      numbers: contacts,
      language: "english",
    };

    const url = "https://www.fast2sms.com/dev/bulkV2";
    const headers = {
      authorization:
        "Qml3Ars6pFLhqR298jVUStXCknODNvEIc4ugM5YeaWBzw01iHPR4VCsxQ19qHtTIrBfGeJkbDlF38L6o",
      accept: "*/*",
      "cache-control": "no-cache",
      "content-type": "application/json",
    };
    response = await axios.post(url, JSON.stringify(fields), {
      headers,
    });
  } catch (err) {
    //err
  }
  return response;
}
