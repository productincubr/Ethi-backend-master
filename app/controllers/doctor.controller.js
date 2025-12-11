const db = require("../models");
const path = require("path");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios");
const { RtcTokenBuilder, RtcRole } = require("agora-token");
const crypto = require("crypto");

// ✅ Import JWT and Password helpers
const { generateToken } = require("../middleware/auth.middleware");
const { hashPassword, comparePassword } = require("../helpers/password.helper");

const ethi_doctor_master = db.ethi_doctor_master;
const ethi_appointment_with_doctor = db.ethi_appointment_with_doctor;
const ethi_subscription_plan = db.ethi_subscription_plan;
const ethi_customers = db.ethi_customers;
const ethi_feeds_master = db.ethi_feeds_master;
const ethi_doctor_diet_plan = db.ethi_doctor_diet_plan;
const ethi_supplements = db.ethi_supplements;
const ethi_points_to_remember = db.ethi_points_to_remember;
const ethi_customers_assesment = db.ethi_customers_assesment;
const ethi_doctor_leave = db.ethi_doctor_leave;
const ethi_package_master = db.ethi_package_master;
const ethi_customers_goals = db.ethi_customers_goals;
const ethi_customers_document = db.ethi_customers_document;
const ethi_supplement_master = db.ethi_supplement_master;
const ethi_food_master = db.ethi_food_master;
const ethi_remember_master = db.ethi_remember_master;
const ethi_doctor_feedback = db.ethi_doctor_feedback;
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
/**wati key */
const apiKey_wati = process.env.WATI_API_KEY;
const apiUrl_wati = process.env.WATI_API_URL;
let website_link = process.env.WEBSITE_LINK;
const agrora_link = website_link + "customervideocall/";
/**wati key */

const data_user_document_image = "/ethi_user_document/";

// Generate an MD5 hash for a value (e.g., microtime)
function generateMD5Hash() {
  const microtime = new Date().getTime().toString();
  const md5Hash = crypto.createHash("md5").update(microtime).digest("hex");
  return md5Hash;
}
function make_password(new_value) {
  const md5Hash = crypto.createHash("md5").update(new_value).digest("hex");
  return md5Hash;
}

function currentDatetime() {
  const currentDate = new Date();
  const currentDateTime = currentDate
    .toLocaleString("en-IN", options)
    .replace(",", "");
  return currentDateTime;
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

const error_msg = "Something Went Wrong, Please Try Again.";
const user_msg = "User is Invalid. Please try again.";
const post_empty = "Content can not be empty!.";
const done_empty = "done";
const error_empty = "error";
const updated_success = "Successfully Updated";
const save_success = "Successfully Saved";
const already_exists = "Data Already Exists.";
const password_worng = "Password Wrong please Try Again";
const data_doctor_image = "/ethi_doctor_image/";
const data_user_image = "/ethi_user_image/";
const data_ethi_feeds_image = "/ethi_feeds_image/";
const data_document_image = "/ethi_user_document/";
const appointment_error_singup = "Please Signup Mobile No Not Present.";
const appointment_error_date =
  "Selected Date Is Not present Between Start And End date";
const doctor_not_found = "Doctor Not Found";
const appointment_error_package =
  "Package Is Not Subscribed Please Re subscribed";
const appointment_error_subscribe =
  "Please Subscribe Package For Appointment In App";
const appointment_exists = "Appointment Already Present.";
const appointment_success = "Appointment Create Successfully";
const mobile_already_present = "Mobile No Already Present.";

/**
 * Doctor Login Controller
 * 
 * Authenticates doctor users with email and password
 * Validates credentials against ethi_doctor_master collection
 * Returns doctor data and profile image path on successful authentication
 */
exports.login_to_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const user_email = req.body.useremail;
      const user_password = req.body.userpassword;

      // Find doctor by email only
      const query = {
        doctor_email: user_email,
      };

      const data = await ethi_doctor_master.find(query);
      
      console.log("Doctor Login - Query Result:", data ? data.length : 0, "records found");
      
      if (data && data.length > 0) {
        const data_doctor = data[0];
        const stored_password = data_doctor.doctor_passowrd_enq;

        // 🔐 Check password (supports both MD5 and Bcrypt)
        let isPasswordValid = false;

        // Try Bcrypt first (new format)
        if (stored_password && stored_password.startsWith('$2b$')) {
          console.log("🔐 Verifying Bcrypt password...");
          isPasswordValid = await comparePassword(user_password, stored_password);
        } else {
          // Fall back to MD5 (old format)
          console.log("🔐 Verifying MD5 password (legacy)...");
          const md5_hash = make_password(user_password);
          isPasswordValid = (stored_password === md5_hash);

          // 🔄 Auto-migrate to Bcrypt on successful login
          if (isPasswordValid) {
            console.log("✅ MD5 password correct. Auto-migrating to Bcrypt...");
            const bcrypt_hash = await hashPassword(user_password);
            await ethi_doctor_master.updateOne(
              { _id: data_doctor._id },
              { $set: { doctor_passowrd_enq: bcrypt_hash } }
            );
            console.log("✅ Password migrated to Bcrypt successfully");
          }
        }

        if (!isPasswordValid) {
          console.log("❌ Invalid password for:", user_email);
          return res.send({
            message: "Invalid email or password",
            error: true,
          });
        }

        console.log("✅ Doctor found:", data_doctor.doctor_email);

        // 🎫 Generate JWT Token
        const jwtToken = generateToken({
          _id: data_doctor._id,
          email: data_doctor.doctor_email,
          role: 'DOCTOR',
          type: 'doctor',
        });

        console.log("✅ JWT token generated for doctor:", data_doctor.doctor_email);

        const responseData = {
          data_doctor,
          data_doctor_image,
          token: jwtToken, // ✅ JWT token
        };

        res.send({
          message: responseData,
          error: false,
        });
      } else {
        console.log("No doctor found with email:", req.body.useremail);
        res.send({
          message: user_msg,
          error: true,
        });
      }
    } catch (err) {
      console.log("❌ Doctor login error:", err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.create_patient_by_doctor = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      console.log(req.body);
      const user_customer_mobile_no = req.body.user_number.replace(/\+/g, "");

      const countryCode = user_customer_mobile_no.substring(0, 2);
      let user_customer_mobile_no_without_zip =
        user_customer_mobile_no.substring(2);
      if (countryCode != "91") {
        user_customer_mobile_no_without_zip =
          user_customer_mobile_no.substring(3);
      }

      const customer_name_user = req.body.customer_name;
      const customer_email_user = "";
      const firebase_token_id = "";
      const login_type_id = "normal";
      const last_subscription_id_data =
        req.body.last_subscription_id.split("~@~");
      const last_subscription_id = last_subscription_id_data[0];
      const referred_by = req.body.referred_by;
      const description = req.body.description;
      const customer_image_dd = "user_image.png";
      let customer_id_dd = "0";
      const complete_days = parseInt(last_subscription_id_data[1], 10);
      const currentDate = new Date();

      // Format the date as YYYY-MM-dd
      let year = currentDate.getFullYear();
      let month = String(currentDate.getMonth() + 1).padStart(2, "0");
      let day = String(currentDate.getDate()).padStart(2, "0");

      const package_start_date_dd = `${year}-${month}-${day}`;
      currentDate.setDate(currentDate.getDate() + complete_days);

      year = currentDate.getFullYear();
      month = String(currentDate.getMonth() + 1).padStart(2, "0");
      day = String(currentDate.getDate()).padStart(2, "0");

      const package_end_date_dd = `${year}-${month}-${day}`;

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

      var condition1 = {
        flag: "c",
        allow_access: "1",
      };
      const data_doctor_data_only = await ethi_doctor_master
        .find(condition1)
        .limit(1)
        .exec();
      let doctor_id_dd = data_doctor_data_only[0]._id;
      let doctor_name_dd = data_doctor_data_only[0].doctor_name;
      let doctor_image_dd = data_doctor_data_only[0].doctor_image;

      var condition1 = {
        _id: last_subscription_id,
      };
      const package_data = await ethi_package_master
        .find(condition1)
        .limit(1)
        .exec();

      const complete_calling_dd = package_data[0]["no_of_calling"];
      const payment_amount_dd = package_data[0]["payment_amount"];

      const ethi_customers_ss = new ethi_customers({
        entry_date: currentDatetime(),
        customer_name: customer_name_user,
        customer_mobile_no: user_customer_mobile_no,
        mobile_no_without_zip: user_customer_mobile_no_without_zip,
        customer_email: customer_email_user,
        customer_image: customer_image_dd,
        date_of_birth: "",
        gender: "",
        customer_disease: "",
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
        otp: "1234",
        last_subscription_id: "0",
        last_doctor_id: doctor_id_dd,
        choose_goal: "0",
        hours_water: "5",
        sleep_hour: "8",
        login_type: login_type_id,
        login_id: "",
        login_token: "",
        package_select_status: "1",
        referred_by: referred_by,
        description: description,
        add_by: "panel",
        call_flag: "0",
        Comment: "",
        package_id: last_subscription_id,
        package_start_date: package_start_date_dd,
        package_end_date: package_end_date_dd,
        login_step: "2",
        flag: "c",
      });

      ethi_customers
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const newCustomer = new ethi_customers(ethi_customers_ss);
            newCustomer
              .save()
              .then((savedCustomer) => {
                customer_id_dd = savedCustomer._id;
                const ethi_customers_ss2 = new ethi_subscription_plan({
                  entry_date: currentDatetime(),
                  doctor_id: "",
                  doctor_name: "",
                  doctor_image: "",
                  customer_id: customer_id_dd,
                  customer_name: customer_name_user,
                  customer_mobile_no: user_customer_mobile_no,
                  customer_image: customer_image_dd,
                  package_id: last_subscription_id,
                  package_start_date: package_start_date_dd,
                  package_end_date: package_end_date_dd,
                  no_of_calling: 0,
                  complete_calling: complete_calling_dd,
                  payment_amount: payment_amount_dd,
                  payment_mode: "Admin Payment",
                  order_id: "",
                  payment_status: "done",
                  payment_id: "",
                  doctor_id: doctor_id_dd,
                  doctor_name: doctor_name_dd,
                  doctor_image: doctor_image_dd,
                  invoice_pdf: "",
                  flag: "c",
                  renew_status: "c",
                });
                const newCustomer22 = new ethi_subscription_plan(
                  ethi_customers_ss2
                );
                newCustomer22
                  .save()
                  .then((savedCustomer_data) => {
                    let subscription_plans_id = savedCustomer_data._id;
                    const filter = {
                      _id: customer_id_dd,
                    };
                    const update1 = {
                      $set: {
                        last_subscription_id: subscription_plans_id,
                      },
                    };

                    ethi_customers
                      .updateOne(filter, update1, {
                        useFindAndModify: false,
                      })
                      .then((data) => {
                        res.send({
                          message: save_success,
                          error: false,
                        });
                      })
                      .catch((err) => {
                        console.log(err);
                        res.send({
                          message: error_msg,
                          error: true,
                        });
                      });
                  })
                  .catch((err) => {
                    console.log(err);
                    res.send({
                      message: error_msg,
                      error: true,
                    });
                  });
              })
              .catch((err) => {
                console.log(err);
                res.send({
                  message: error_msg,
                  error: true,
                });
              });
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.create_appointments_by_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      let doctor_id = req.body.doctor_id;
      console.log(doctor_id);
      if (!doctor_id) {
        doctor_id = "000000000000000000000000";
      }
      const user_customer_mobile_no = req.body.user_number.replace(/\+/g, "");

      const countryCode = user_customer_mobile_no.substring(0, 2);
      let user_customer_mobile_no_without_zip =
        user_customer_mobile_no.substring(2);
      if (countryCode != "91") {
        user_customer_mobile_no_without_zip =
          user_customer_mobile_no.substring(3);
      }

      const selected_date_id = req.body.entry_date;
      const booking_start_time = req.body.booking_start_time;
      const booking_end_time = req.body.booking_end_time;
      const occurrence = req.body.occurrence;
      const description = req.body.description;
      const category = req.body.category;
      const query = {
        $and: [
          {
            customer_mobile_no: user_customer_mobile_no,
          },
        ],
      };
      ethi_customers
        .find(query)
        .then(async (data) => {
          if (data[0]) {
            if (data[0].last_subscription_id !== "") {
              const package_start_date = new Date(data[0].package_start_date);
              const package_end_date = new Date(data[0].package_end_date);
              const doctor_id_id = data[0].last_doctor_id;
              const current_date = new Date();
              const current_date_entry = new Date(selected_date_id);

              if (
                current_date >= package_start_date &&
                current_date <= package_end_date
              ) {
                if (
                  current_date_entry >= package_start_date &&
                  current_date_entry <= package_end_date
                ) {
                  const customer_id_id = data[0]._id;
                  const subscription_id_dd = data[0].last_subscription_id;

                  if (
                    doctor_id == doctor_id_id ||
                    doctor_id == "000000000000000000000000"
                  ) {
                    const query = {
                      $and: [
                        {
                          doctor_id: doctor_id_id,
                        },
                        {
                          booking_date: selected_date_id,
                        },
                        {
                          booking_start_time: booking_start_time,
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

                    const data_count_apponiment_data =
                      await ethi_appointment_with_doctor
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
                      const count_apponiment =
                        await ethi_appointment_with_doctor
                          .countDocuments(condition4)
                          .exec();

                      var condition3 = {
                        flag: "c",
                        _id: doctor_id_id,
                      };
                      const data_customers_data = data;
                      const ethi_doctor_master_data = await ethi_doctor_master
                        .find(condition3)
                        .exec();

                      let customer_name_dd = "User";
                      let customer_mobile_no_dd = "";
                      let customer_image_dd = "";
                      if (data_customers_data[0]) {
                        customer_name_dd = data_customers_data[0].customer_name;
                        customer_mobile_no_dd =
                          data_customers_data[0].customer_mobile_no;
                        customer_image_dd =
                          data_customers_data[0].customer_image;
                      }

                      let doctor_name_dd = "";
                      let doctor_tag_dd = "";
                      let doctor_image_dd = "";
                      if (ethi_doctor_master_data[0]) {
                        doctor_name_dd = ethi_doctor_master_data[0].doctor_name;
                        doctor_tag_dd = ethi_doctor_master_data[0].doctor_tag;
                        doctor_image_dd =
                          ethi_doctor_master_data[0].doctor_image;
                      }

                      ethi_appointment_with_doctor
                        .findOne(query)
                        .then((existingCustomer) => {
                          if (existingCustomer) {
                            res.send({
                              message: appointment_exists,
                              error: true,
                            });
                          } else {
                            let make_sec = differenceInSecondsfunction(
                              booking_start_time,
                              booking_end_time
                            );
                            let token_agora_dd = generateAgoraToken(
                              customer_id_id,
                              make_sec
                            );
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
                                booking_start_time: booking_start_time,
                                booking_end_time: booking_end_time,
                                which_no_booking: count_apponiment,
                                occurrence: occurrence,
                                category: category,
                                description: description,
                                diet_plan_status: "0",
                                assesment_form_status: "0",
                                token_agora: token_agora_dd,
                                status_for_complete: "0",
                                book_by: "admin",
                                flag: "c",
                              });

                            const newCustomer =
                              new ethi_appointment_with_doctor(
                                ethi_appointment_with_doctor_ss
                              );

                            newCustomer
                              .save()
                              .then((savedCustomer) => {
                                let id_booking = savedCustomer._id;
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
                                    // wati add code

                                    const requestBody = {
                                      template_name: "agora_link",
                                      broadcast_name: "agora_link",
                                      receivers: [
                                        {
                                          whatsappNumber: customer_mobile_no_dd,
                                          customParams: [
                                            {
                                              name: "link",
                                              value: agrora_link + id_booking,
                                            },
                                            {
                                              name: "ordernumber",
                                              value: selected_date_id,
                                            },
                                            {
                                              name: "tracking_company",
                                              value: booking_start_time,
                                            },
                                          ],
                                        },
                                      ],
                                    };

                                    //wati hit data
                                    sendwatitemplete(requestBody);
                                    res.send({
                                      message: appointment_success,
                                      error: false,
                                    });
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                    res.send({
                                      message: error_msg,
                                      error: true,
                                    });
                                  });
                              })
                              .catch((err) => {
                                console.log(err);
                                res.send({
                                  message: error_msg,
                                  error: true,
                                });
                              });
                          }
                        })
                        .catch((err) => {
                          console.log(err);
                          res.send({
                            message: error_msg,
                            error: true,
                          });
                        });
                    }
                  } else {
                    res.send({
                      message: doctor_not_found,
                      error: true,
                    });
                  }
                } else {
                  res.send({
                    message: appointment_error_date,
                    error: true,
                  });
                }
              } else {
                res.send({
                  message: appointment_error_package,
                  error: true,
                });
              }
            } else {
              res.send({
                message: appointment_error_subscribe,
                error: true,
              });
            }
          } else {
            res.send({
              message: appointment_error_singup,
              error: true,
            });
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.welcome_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      var condition = {
        flag: "c",
        doctor_id: doctor_id_for,
      };

      var condition1 = {
        flag: "c",
        doctor_id: doctor_id_for,
        status_for_complete: "0",
      };
      var condition2 = {
        flag: "c",
        last_doctor_id: doctor_id_for,
        send_msg_flag: "1",
      };

      const currentDate = new Date();

      // Fetch data from Collection1 with condition
      const data_appointment = await ethi_appointment_with_doctor
        .find(condition1)
        .exec();
      const data_subscription = await ethi_subscription_plan
        .find(condition)
        .exec();

      const data_chart = await ethi_customers.find(condition2).exec();
      const data_customer_data = await ethi_subscription_plan
        .aggregate([
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$doctor_id", doctor_id_for] },
                  { $eq: ["$payment_status", "done"] },
                  { $eq: ["$flag", "c"] },
                  { $eq: ["$renew_status", "c"] },
                  {
                    $gt: [{ $toDate: "$package_end_date" }, currentDate],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              package_end_date: -1,
            },
          },
        ])
        .exec();

      // Combine the results into a single object
      const responseData = {
        data_appointment,
        data_subscription,
        data_customer_data,
        data_user_image,
        data_chart,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.my_patients_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;

      var condition2 = {
        flag: "c",
        last_doctor_id: doctor_id_for,
      };

      const data_customers = await ethi_customers.find(condition2).exec();

      // Combine the results into a single object
      const responseData = {
        data_customers,
        data_user_image,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.post_doctor_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const doctor_name_for = req.body.doctor_name;
      const post_text_content = req.body.post_text_content;
      const doctor_tag_for = req.body.post_tag;
      const doctor_type = req.body.doctor_type;
      const admin_id = req.body.admin_id;
      const doctor_admin_image = req.body.doctor_admin_image;
      let image_file = "";
      if (doctor_type == "image") {
        image_file = req.files.post_image;
      } else if (doctor_type == "video") {
        image_file = req.files.post_video;
      } else if (doctor_type == "pdf") {
        image_file = req.files.post_pdf;
      } else if (doctor_type == "audio") {
        image_file = req.files.post_audio;
      }
      let image_name = "";
      if (image_file != "") {
        image_name = upload_image("_feed", data_ethi_feeds_image, image_file);
      }

      const ethi_feeds_master_data = new ethi_feeds_master({
        entry_date: currentDatetime(),
        doctor_id: doctor_id_for,
        doctor_name: doctor_name_for,
        doctor_tag: doctor_tag_for,
        feed_detail: post_text_content,
        feed_type: doctor_type,
        admin_id: admin_id,
        doctor_admin_image: doctor_admin_image,
        feed_document: image_name,
        total_likes: 0,
        approve_status: "e",
        flag: "c",
      });

      ethi_feeds_master_data
        .save()
        .then((savedCustomer) => {
          res.send({
            message: save_success,
            error: false,
          });
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

exports.post_doctor_get = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      let condition2 = {
        flag: "c",
        doctor_id: doctor_id_for,
      };
      if (doctor_id_for === "000000000000000000000000") {
        condition2 = {
          flag: "c",
        };
      }

      // Fetch data from Collection1 with condition
      const data_ethi_feeds_master = await ethi_feeds_master
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();

      const data_data_doctor_image = data_doctor_image;

      // Combine the results into a single object
      const responseData = {
        data_ethi_feeds_master,
        data_ethi_feeds_image,
        data_data_doctor_image,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.my_patients_full_details_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const currentDate = new Date();
      let data_customers;
      let data_customer_data_whatapp;

      var condition = {
        allow_access: "1",
        flag: "c",
      };
      let data_doctor_data = "";
      if (String(doctor_id_for) === "000000000000000000000000") {
        data_doctor_data = await ethi_doctor_master.find(condition).exec();
      }

      let data_customer_data;
      let data_customer_data_past;
      if (String(doctor_id_for) === "000000000000000000000000") {
        data_customer_data = await ethi_customers
          .aggregate([
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$flag", "c"] },
                    { $ne: ["$package_end_date", ""] }, // Add this line to check for non-empty strings
                    {
                      $gt: [{ $toDate: "$package_end_date" }, currentDate],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                package_end_date: -1,
              },
            },
          ])
          .exec();

        data_customer_data_whatapp = await ethi_customers
          .aggregate([
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$flag", "c"] }, { $eq: ["$call_flag", "1"] }],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
          ])
          .exec();

        data_customer_data_past = await ethi_customers
          .aggregate([
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$flag", "c"] },
                    { $ne: ["$package_end_date", ""] }, // Add this line to check for non-empty strings
                    {
                      $lt: [{ $toDate: "$package_end_date" }, currentDate],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                package_end_date: -1,
              },
            },
          ])
          .exec();
      } else {
        data_customer_data = await ethi_customers
          .aggregate([
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$last_doctor_id", doctor_id_for] },
                    { $eq: ["$flag", "c"] },
                    {
                      $gt: [{ $toDate: "$package_end_date" }, currentDate],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                package_end_date: -1,
              },
            },
          ])
          .exec();
        data_customer_data_past = await ethi_customers
          .aggregate([
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$last_doctor_id", doctor_id_for] },
                    { $eq: ["$flag", "c"] },
                    {
                      $lt: [{ $toDate: "$package_end_date" }, currentDate],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                package_end_date: -1,
              },
            },
          ])
          .exec();
      }

      var condition4 = {
        flag: "c",
        status_for: "0",
      };

      const ethi_package_data = await ethi_package_master
        .find(condition4)
        .sort({ createdAt: -1 })
        .exec();

      var condition5 = {
        flag: "c",
        status_for_complete: "0",
      };

      const customers_ethi_appointment_with_doctors =
        await ethi_appointment_with_doctor
          .find(condition5)
          .sort({ createdAt: -1 })
          .exec();

      // Combine the results into a single object
      const responseData = {
        data_customers,
        customers_ethi_appointment_with_doctors,
        data_user_image,
        data_document_image,
        data_customer_data,
        data_customer_data_past,
        data_customer_data_whatapp,
        data_doctor_data,
        ethi_package_data,
      };

      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.my_patients_data_single = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      let doctor_id_for = req.body.doctor_id;
      const customer_id_for = req.body.customer_id;
      const extra_flag = req.body.extra_flag;

      var condition = {
        customer_id: customer_id_for,
        flag: "c",
      };
      var condition2 = {
        _id: customer_id_for,
        flag: "c",
      };

      const ethi_customers_assesment_master = await ethi_customers_assesment
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();

      const ethi_customers_data = await ethi_customers.find(condition2).exec();

      let packeage_id = "000000000000000000000000";

      if (ethi_customers_data[0]) {
        packeage_id = ethi_customers_data[0].packeage_id;
        doctor_id_for = ethi_customers_data[0].last_doctor_id;
      }

      var condition3 = {
        customer_id: customer_id_for,
        doctor_id: doctor_id_for,
        flag: "c",
      };

      var condition5 = {
        customer_id: customer_id_for,
        doctor_id: doctor_id_for,
        flag: "c",
      };

      var condition4 = {
        _id: packeage_id,
        flag: "c",
      };

      const ethi_package_data = await ethi_package_master
        .find(condition4)
        .sort({ createdAt: -1 })
        .exec();

      const ethi_doctor_diet_data = await ethi_doctor_diet_plan
        .find(condition3)
        .exec();

      const ethi_points_to_remember_data = await ethi_points_to_remember
        .find(condition3)
        .exec();
      const ethi_supplements_data = await ethi_supplements
        .find(condition3)
        .exec();

      const customers_goals = await ethi_customers_goals.find(condition).exec();

      const customers_ethi_customers_documents = await ethi_customers_document
        .find(condition)
        .exec();

      const customers_ethi_subscription_plan = await ethi_subscription_plan
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();

      const customers_ethi_appointment_with_doctors =
        await ethi_appointment_with_doctor
          .find(condition5)
          .sort({ createdAt: -1 })
          .exec();

      let ethi_supplement_master_data = "";
      let ethi_food_master_data = "";
      let ethi_remember_master_data = "";
      if (extra_flag == "2") {
        var condition4 = {
          flag: "c",
        };

        ethi_supplement_master_data = await ethi_supplement_master
          .find(condition4)
          .sort({ supplement_name: 1 })
          .exec();
        ethi_food_master_data = await ethi_food_master
          .find(condition4)
          .sort({ food_name: 1 })
          .exec();
        ethi_remember_master_data = await ethi_remember_master
          .find(condition4)
          .sort({ remember_name: 1 })
          .exec();
      }

      const responseData = {
        ethi_customers_assesment_master,
        ethi_customers_data,
        ethi_doctor_diet_data,
        data_user_image,
        data_document_image,
        ethi_package_data,
        customers_goals,
        customers_ethi_customers_documents,
        customers_ethi_subscription_plan,
        customers_ethi_appointment_with_doctors,
        ethi_supplement_master_data,
        ethi_food_master_data,
        ethi_remember_master_data,
        ethi_points_to_remember_data,
        ethi_supplements_data,
      };

      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.assesment_form_patients_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const customer_id_for = req.body.customer_id;
      const subscription_id = req.body.subscription_id;
      const ageNum = req.body.ageNum;
      const medicines = req.body.medicines;
      const supplements = req.body.supplements;
      const allergy = req.body.allergy;
      const bloodGroup = req.body.bloodGroup;
      const foodPre = req.body.foodPre;
      const foodTimes0 = req.body.foodTimes0;
      const foodTimes1 = req.body.foodTimes1;
      const foodTimes2 = req.body.foodTimes2;
      const foodTimes3 = req.body.foodTimes3;
      const foodTimes4 = req.body.foodTimes4;
      const signs_name_other = req.body.signs_name_other;

      const eatHabits = req.body.eatHabits;
      const sleepTime = req.body.sleepTime;
      const wakeTime = req.body.wakeTime;

      const hungry = req.body["hungry[]"]; // Access the array of meal times
      let hungry_main = hungry;
      if (Array.isArray(hungry)) {
        hungry_main = hungry[0]; // Initialize with the first meal time
        for (let i = 1; i < hungry.length; i++) {
          hungry_main += ", " + hungry[i]; // Concatenate subsequent meal times
        }
      }

      const triggers = req.body["triggers[]"]; // Access the array of meal times
      let triggers_main = triggers;
      if (Array.isArray(triggers)) {
        triggers_main = triggers[0]; // Initialize with the first meal time
        for (let i = 1; i < triggers.length; i++) {
          triggers_main += ", " + triggers[i]; // Concatenate subsequent meal times
        }
      }
      const cravings = req.body["cravings[]"]; // Access the array of meal times
      let cravings_main = cravings;
      if (Array.isArray(cravings)) {
        cravings_main = cravings[0]; // Initialize with the first meal time
        for (let i = 1; i < cravings.length; i++) {
          cravings_main += ", " + cravings[i]; // Concatenate subsequent meal times
        }
      }
      const cuisines = req.body["cuisines[]"]; // Access the array of meal times
      let cuisines_main = cuisines;
      if (Array.isArray(cuisines)) {
        cuisines_main = cuisines[0]; // Initialize with the first meal time
        for (let i = 1; i < cuisines.length; i++) {
          cuisines_main += ", " + cuisines[i]; // Concatenate subsequent meal times
        }
      }
      const diseases = req.body["diseases[]"]; // Access the array of meal times
      let diseasess_main = diseases;
      if (Array.isArray(diseases)) {
        diseasess_main = diseases[0]; // Initialize with the first meal time
        for (let i = 1; i < diseases.length; i++) {
          diseasess_main += ", " + diseases[i]; // Concatenate subsequent meal times
        }
      }

      const medCondition = req.body["medCondition[]"]; // Access the array of meal times
      let medCondition_main = medCondition;
      if (Array.isArray(medCondition)) {
        medCondition_main = medCondition[0]; // Initialize with the first meal time
        for (let i = 1; i < medCondition.length; i++) {
          medCondition_main += ", " + medCondition[i]; // Concatenate subsequent meal times
        }
      }

      const signs = req.body["signs[]"]; // Access the array of meal times
      let signs_main = signs;
      if (Array.isArray(signs)) {
        signs_main = signs[0]; // Initialize with the first meal time
        for (let i = 1; i < signs.length; i++) {
          signs_main += ", " + signs[i]; // Concatenate subsequent meal times
        }
      }

      const waterOp = req.body.waterOp;
      const smokeOp = req.body.smokeOp;
      const menstrual = req.body.menstrual;
      const activity0 = req.body.activity0;
      const activity1 = req.body.activity1;
      const activity2 = req.body.activity2;
      const activity3 = req.body.activity3;
      const otherSup = req.body.otherSup;
      const otherOp = req.body.otherOp;
      const fitnessOp = req.body.fitnessOp;
      const hignt_number = req.body.hignt_number;
      const weight_number = req.body.weight_number;

      const stress_level = req.body.stress_level;

      const query = {
        $and: [
          {
            customer_id: customer_id_for,
          },
          {
            doctor_id: doctor_id_for,
          },
          {
            subscription_id: subscription_id,
          },
          {
            flag: "c",
          },
        ],
      };

      const ethi_customers_ss = new ethi_customers_assesment({
        entry_date: currentDatetime(),
        customer_id: customer_id_for,
        doctor_id: doctor_id_for,
        subscription_id: subscription_id,
        med_condition_name: medCondition_main,
        signs_name: signs_main,
        signs_name_other: signs_name_other,
        age_no_name: ageNum,
        medicines_name: medicines,
        supplements_name: supplements,
        allergy_name: allergy,
        diseases_name: diseasess_main,
        bloodgroup_name: bloodGroup,
        height_name: hignt_number,
        weight_number: weight_number,
        foodpre_name: foodPre,
        cuisines_name: cuisines_main,
        cravings_name: cravings_main,
        food_alcohol_name: foodTimes0,
        food_biscuit_name: foodTimes1,
        food_diet_soda_name: foodTimes2,
        food_coffee_name: foodTimes3,
        food_tea_name: foodTimes4,
        triggers_name: triggers_main,
        eathabits_name: eatHabits,
        sleeptime_name: sleepTime,
        waketime_name: wakeTime,
        hungry_name: hungry_main,
        stress_level_name: stress_level,
        water_name: waterOp,
        smoke_name: smokeOp,
        menstrual_name: menstrual,
        endurance_name: activity0,
        strength_training_name: activity1,
        yoga_name: activity2,
        flexibility_balance_name: activity3,
        other_details_name: otherSup,
        other_option_name: otherOp,
        motivation_name: fitnessOp,
        flag: "c",
      });

      // Convert time strings to Date objects
      const startDate = new Date(`1970-01-01T${sleepTime}:00`);
      const endDate = new Date(`1970-01-01T${wakeTime}:00`);

      // Calculate difference in hours
      let differenceInMillis = endDate - startDate;
      let sleep_hours = differenceInMillis / (1000 * 60 * 60);

      // If sleep time is in the AM of the next day, adjust the difference
      if (sleep_hours < 0) {
        differenceInMillis += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
        sleep_hours = differenceInMillis / (1000 * 60 * 60);
      }

      // Calculate sleep time
      const sleepDate = new Date(endDate.getTime() - differenceInMillis);
      const sleepTimeString = sleepDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const filter = {
        _id: customer_id_for,
      };
      const update = {
        $set: {
          blood_group: bloodGroup,
          height_cm: hignt_number,
          weight_kg: weight_number,
          sleep_hour: sleep_hours,
        },
      };

      await ethi_customers.updateOne(filter, update, {
        useFindAndModify: false,
      });

      const newCustomer = new ethi_customers_assesment(ethi_customers_ss);
      ethi_customers_assesment
        .findOne(query)
        .then((existingCustomer) => {
          if (existingCustomer) {
            const update1 = {
              $set: {
                flag: "d",
              },
            };

            const filter1 = {
              customer_id: customer_id_for,
              doctor_id: doctor_id_for,
              subscription_id: subscription_id,
              flag: "c",
            };

            ethi_customers_assesment
              .updateMany(filter1, update1, {
                useFindAndModify: false,
              })
              .then(() => {
                // After updating existing documents, proceed to insert new documents

                newCustomer
                  .save()
                  .then((savedCustomer) => {
                    res.send({
                      message: save_success,
                      error: false,
                    });
                  })
                  .catch((err) => {
                    res.send({
                      message: error_msg,
                      error: true,
                    });
                  });
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                  error: true,
                });
              });
          } else {
            newCustomer
              .save()
              .then((savedCustomer) => {
                res.send({
                  message: save_success,
                  error: false,
                });
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                  error: true,
                });
              });
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

exports.diet_form_patients_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      let doctor_id_for = req.body.doctor_id;
      const customer_id_for = req.body.customer_id;
      const customer_id = req.body.customer_id;
      const subscription_id = req.body.subscription_id;
      const package_id = req.body.package_id;
      const total_count = req.body.total_count;
      const points_to_remember = req.body.points_to_remember;
      const supplements_remember = req.body.supplements_remember;
      let pdf_image_name = "diel_plan_simple.pdf";

      let customerData = await ethi_customers.findOne({
        _id: new ObjectId(customer_id_for).toString(),
      });

      doctor_id_for = customerData.last_doctor_id;

      const highestSequenceDoc = await ethi_doctor_diet_plan
        .findOne({
          customer_id: customer_id_for,
          doctor_id: doctor_id_for,
          subscription_id: subscription_id,
        })
        .sort("-sequence_id"); // Find the document with the highest sequence

      const highestSequence = highestSequenceDoc
        ? highestSequenceDoc.sequence_id
        : 0;
      const newSequence = highestSequence + 1;
      if (total_count > 0) {
        const supplementsArray = Array.isArray(supplements_remember)
          ? supplements_remember
          : [supplements_remember];
        const supplementsString = supplementsArray.join(" , ");
        const pointsArray = Array.isArray(points_to_remember)
          ? points_to_remember
          : [points_to_remember];
        const pointsString = pointsArray.join(" , ");
        if (supplementsString !== "") {
          const addingdata = new ethi_supplements({
            customer_id: customer_id,
            sequence_id: newSequence,
            doctor_id: doctor_id_for,
            supplements_remember: supplementsString,
            flag: "c",
          });
          addingdata.save();
        }

        if (pointsString !== "") {
          const pointsdata = new ethi_points_to_remember({
            customer_id: customer_id,
            sequence_id: newSequence,
            doctor_id: doctor_id_for,
            points_to_remember: pointsString,
            flag: "c",
          });
          pointsdata.save();
        }

        const date = currentDatetime();
        const dateArray = date.split(" ");
        const dateIndex = dateArray[0];

        const customerName = customerData.customer_name;

        const resultArray = [];

        const supplementsDataCount = parseInt(req.body.supplements_data_count);

        for (let i = 0; i < supplementsDataCount; i++) {
          const mealTimeKey = `meal_time${i}`;
          const supplementsDataKey = `supplements_data${i}`;
          const meal_time_namekey = `meal_time_name${i}`;

          const obj = {
            meal_time:
              req.body[mealTimeKey] + " (" + req.body[meal_time_namekey] + ")",
            supplements_dataz: req.body[supplementsDataKey],
          };

          if (supplementsDataKey !== "") {
            resultArray.push(obj);
          }
        }

        const inputData = {
          inputName: customerName || "Default Data",
          inputDate: dateIndex || "Default Data",
          inputSupplements: supplementsString || "Default Data",
          inputPoints: pointsString || "Default Data",
        };

        const supplementsArray2 = supplementsString
          .split(",")
          .map((item) => item.trim());
        const pointsString2 = pointsString
          .split(",")
          .map((item) => item.trim());

        pdf_image_name = await generateDeitplan(
          inputData,
          resultArray,
          supplementsArray2,
          pointsString2
        );

        for (let i = 0; i < total_count; i++) {
          const supplements_data = req.body["supplements_data" + i]; // Access the array of meal times

          const meal_time = req.body["meal_time" + i]; // Access the array of meal times
          const diet_time_name = req.body["meal_time_name" + i]; // Access the array of meal times
          if (supplements_data !== "") {
            const ethi_customers_ss = new ethi_doctor_diet_plan({
              entry_date: currentDatetime(),
              customer_id: customer_id_for,
              doctor_id: doctor_id_for,
              subscription_id: subscription_id,
              sequence_id: newSequence,
              package_id: package_id,
              diet_time: meal_time,
              diet_time_name: diet_time_name,
              diet_detail: supplements_data,
              pdf_image: pdf_image_name,
              flag: "c",
            });

            const newCustomer = new ethi_doctor_diet_plan(ethi_customers_ss);
            newCustomer.save();
          }
        }
        var condition3 = {
          flag: "c",
          _id: customer_id_for,
        };
        const data_customers_data = await ethi_customers
          .find(condition3)
          .exec();

        let customer_name_dd = "User";
        let customer_mobile_no_dd = "";
        if (data_customers_data[0]) {
          customer_name_dd = data_customers_data[0].customer_name;
          customer_mobile_no_dd = data_customers_data[0].customer_mobile_no;
        }

        res.send({
          message: save_success,
          error: false,
        });
      }
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.get_doctor_by_single = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;

      var condition = {
        flag: "c",
        _id: doctor_id_for,
      };
      var condition1 = {
        flag: "c",
        doctor_id: doctor_id_for,
      };
      // Fetch data from Collection1 with condition
      const data_doctor = await ethi_doctor_master
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();
      const data_leave = await ethi_doctor_leave
        .find(condition1)
        .sort({ createdAt: -1 })
        .exec();
      // Combine the results into a single object

      const responseData = {
        data_doctor,
        data_leave,
        data_doctor_image,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.post_doctor_save_single = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const doctor_name_dd = req.body.doctor_name_single;
      const doctor_profession_dd = req.body.doctor_profession;
      let doctor_image_dd = req.body.doctor_image_old;
      const doctor_mobile_no_dd = req.body.doctor_mobile_no;
      const doctor_city_dd = req.body.doctor_city;
      const doctor_state_dd = req.body.doctor_state;

      const doctor_zipcode_dd = req.body.doctor_zipcode;
      const doctor_country_dd = req.body.doctor_country;
      const doctor_education_dd = req.body.doctor_education;
      const doctor_exp_years_dd = req.body.doctor_exp_years;

      if (req.files) {
        doctor_image_dd = upload_image(
          "_doctor",
          data_doctor_image,
          req.files.image_for_new
        );
      }

      const update2 = {
        $set: {
          doctor_name: doctor_name_dd,
        },
      };
      const update4 = {
        $set: {
          doctor_name: doctor_name_dd,
          doctor_admin_image: doctor_image_dd,
        },
      };
      const update3 = {
        $set: {
          doctor_name: doctor_name_dd,
          doctor_image: doctor_image_dd,
        },
      };
      const filter2 = {
        doctor_id: doctor_id_for,
        flag: "c",
      };

      await ethi_doctor_leave.updateMany(filter2, update2, {
        useFindAndModify: false,
      });

      await ethi_feeds_master.updateMany(filter2, update4, {
        useFindAndModify: false,
      });
      await ethi_subscription_plan.updateMany(filter2, update3, {
        useFindAndModify: false,
      });
      await ethi_appointment_with_doctor.updateMany(filter2, update3, {
        useFindAndModify: false,
      });
      const update1 = {
        $set: {
          doctor_name: doctor_name_dd,
          doctor_profession: doctor_profession_dd,
          doctor_image: doctor_image_dd,
          doctor_mobile_no: doctor_mobile_no_dd,
          doctor_city: doctor_city_dd,
          doctor_state: doctor_state_dd,
          doctor_zipcode: doctor_zipcode_dd,
          doctor_country: doctor_country_dd,
          doctor_education: doctor_education_dd,
          doctor_exp_years: doctor_exp_years_dd,
        },
      };

      const filter1 = {
        _id: doctor_id_for,
        flag: "c",
      };

      await ethi_doctor_master
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then(() => {
          res.send({
            message: updated_success,
            error: false,
          });
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

exports.post_leave_request_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const doctor_name_dd = req.body.doctor_name;
      const leave_type_dd = req.body.leave_type;
      const leave_from_dd = req.body.leave_from;
      const leave_to_dd = req.body.leave_to;
      const reason_dd = req.body.reason;
      const leave_from = new Date(leave_from_dd);
      const leave_to = new Date(leave_to_dd);

      const timeDifference = leave_to - leave_from;

      let leave_duration_dd = timeDifference / (1000 * 60 * 60 * 24);

      const ethi_doctor_leave_ss = new ethi_doctor_leave({
        entry_date: currentDatetime(),
        doctor_id: doctor_id_for,
        doctor_name: doctor_name_dd,
        leave_type: leave_type_dd,
        leave_duration: leave_duration_dd,
        leave_from: leave_from_dd,
        leave_to: leave_to_dd,
        reason: reason_dd,
        remarks: "",
        status_for: 0,
        flag: "c",
      });
      const query = {
        $and: [
          { doctor_id: doctor_id_for },
          { leave_type: leave_type_dd },
          { leave_from: leave_from_dd },
          { leave_to: leave_to_dd },
          { status_for: 0 },
          { status_for: 1 },
          { flag: "c" },
          // Add more conditions as needed
        ],
      };

      ethi_doctor_leave
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            ethi_doctor_leave_ss
              .save()
              .then((savedCustomer) => {
                res.send({
                  message: save_success,
                  error: false,
                });
              })
              .catch((err) => {
                res.send({
                  message: error_msg,
                  error: true,
                });
              });
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

exports.change_password_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const user_passowrd = req.body.newpassword;
      const user_passowrd_enq = make_password(req.body.newpassword);
      const olduserpassword_enq = make_password(req.body.currentpassword);

      const update1 = {
        $set: {
          doctor_password: user_passowrd,
          doctor_passowrd_enq: user_passowrd_enq,
        },
      };

      const filter1 = {
        _id: doctor_id_for,
        flag: "c",
        doctor_passowrd_enq: olduserpassword_enq,
      };

      ethi_doctor_master
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then((result) => {
          if (result.modifiedCount > 0) {
            // At least one document was updated
            res.send({
              message: updated_success,
              error: false,
            });
          } else {
            // No documents were updated
            res.send({
              message: password_worng,
              error: true,
            });
          }
        })
        .catch((err) => {
          res.send({
            message: password_worng,
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

exports.get_appointment_by_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const present_date = req.body.present_date;
      var condition = {
        flag: "c",
        booking_date: present_date,
      };

      if (doctor_id_for != 0) {
        condition.doctor_id = doctor_id_for;
      }

      const data_appointment = await ethi_appointment_with_doctor
        .find(condition)
        .exec();
      const responseData = {
        data_appointment,
        data_user_image,
      };

      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.cancel_appointment_by_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const appointment_id_for = req.body.appointment_id;
      const update1 = {
        $set: {
          status_for_complete: "2",
        },
      };

      const filter1 = {
        _id: appointment_id_for,
        flag: "c",
      };

      ethi_appointment_with_doctor
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then(() => {
          res.send({
            message: updated_success,
            error: false,
          });
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

exports.get_last_appointment = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;

      var condition1 = {
        flag: "c",
        doctor_id: doctor_id_for,
        status_for_complete: "0",
      };
      // Fetch data from Collection1 with condition
      const data_appointment = await ethi_appointment_with_doctor
        .find(condition1)
        .limit(1)
        .sort({ createdAt: -1 })
        .exec();

      const responseData = {
        data_appointment,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.update_water_sleep = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const customer_id_for = req.body.customer_id;
      const subscription_id_for = req.body.subscription_id;
      const weight_kg_for = req.body.weight_kg;
      const sleep_no_for = req.body.sleep_no;
      const glass_no_for = req.body.glass_no;
      const update1 = {
        $set: {
          weight_kg: weight_kg_for,
          sleep_hour: sleep_no_for,
          hours_water: glass_no_for,
        },
      };

      const filter1 = {
        _id: customer_id_for,
        flag: "c",
      };

      ethi_customers
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then(() => {
          res.send({
            message: updated_success,
            error: false,
          });
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

exports.update_period = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const customer_id_for = req.body.customer_id;
      const period_start_date_str = req.body.period_start_date;
      const period_end_date_str = req.body.period_end_date;
      const period_days_str = req.body.period_cycle;
      const update1 = {
        $set: {
          period_start_date: period_start_date_str,
          period_end_date: period_end_date_str,
          period_days: period_days_str,
        },
      };

      const filter1 = {
        _id: customer_id_for,
        flag: "c",
      };
      ethi_customers
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then(() => {
          res.send({
            message: updated_success,
            error: false,
          });
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

exports.post_customer_sms = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const customer_id_for = req.body.customer_id;
      const last_msg_send_id = req.body.last_msg_send;

      const update1 = {
        $set: {
          send_msg_flag: "0",
          receive_msg_flag: "1",
          last_msg_send: last_msg_send_id,
          last_msg_time: currentimeonly_date(),
        },
      };

      const filter1 = {
        _id: customer_id_for,
        flag: "c",
      };

      ethi_customers
        .updateMany(filter1, update1, {
          useFindAndModify: false,
        })
        .then(() => {
          res.send({
            message: updated_success,
            error: false,
          });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.get_booking_data = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const booking_id = req.body.booking_id;
      let condition1 = {
        flag: "c",
        doctor_id: doctor_id_for,
        status_for_complete: "0",
        _id: booking_id,
      };
      if (doctor_id_for == "000000000000000000000000") {
        condition1 = {
          flag: "c",
          status_for_complete: "0",
          _id: booking_id,
        };
      }

      // Fetch data from Collection1 with condition
      const data_appointment = await ethi_appointment_with_doctor
        .find(condition1)
        .limit(1)
        .exec();

      let token_id = "";

      if (data_appointment[0]) {
        var condition2 = {
          flag: "c",
          _id: data_appointment[0].customer_id,
        };

        const data_customer_data = await ethi_customers
          .find(condition2)
          .limit(1)
          .exec();
        token_id = data_customer_data[0].firebase_token;
        send_to_user(
          "Appointment Call",
          "Call From " + data_appointment[0].doctor_name,
          data_doctor_image + data_appointment[0].doctor_image,
          token_id,
          "VideoCallScreen"
        );
      }

      const responseData = {
        data_appointment,
        appId,
        channelName,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.save_ethi_doctor_feedback = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_id_for = req.body.doctor_id;
      const doctor_name_name = req.body.doctor_name;
      const what_went_well_ss = req.body.what_went_well;
      const what_could_we_improve_on_ss = req.body.what_could_we_improve_on;
      const any_additional_comments_ss = req.body.any_additional_comments;

      const addingdata = new ethi_doctor_feedback({
        entry_date: currentDatetime(),
        doctor_id: doctor_id_for,
        doctor_name: doctor_name_name,
        what_went_well: what_went_well_ss,
        what_could_we_improve_on: what_could_we_improve_on_ss,
        any_additional_comments: any_additional_comments_ss,
        flag: "c",
      });
      await addingdata.save();
      res.send({ message: save_success, error: true });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.get_booking_data_by_customer = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const booking_id = req.body.booking_id;
      const doctor_id_for = req.body.doctor_id;
      let condition1 = {
        flag: "c",
        doctor_id: doctor_id_for,
        status_for_complete: "0",
        _id: booking_id,
      };
      if (doctor_id_for == "000000000000000000000000") {
        condition1 = {
          flag: "c",
          status_for_complete: "0",
          _id: booking_id,
        };
      }
      // Fetch data from Collection1 with condition
      const data_appointment = await ethi_appointment_with_doctor
        .find(condition1)
        .limit(1)
        .exec();

      const responseData = {
        data_appointment,
        appId,
        channelName,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (err) {
      console.log(err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve login data for user
exports.send_pdf_diet_by_customer = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty, error: true });
  } else {
    try {
      const customer_mobile_no_dd = req.body.customer_number;
      const pdf_image_name = req.body.pdf_image_name;
      const customer_name_dd = req.body.customer_name;

      const requestBody_ddd = {
        template_name: "pdf_link_show",
        broadcast_name: "pdf_link_show",
        receivers: [
          {
            whatsappNumber: customer_mobile_no_dd.replace(/\+/g, ""),
            customParams: [
              {
                name: "pdfLink",
                value:
                  "https://api.ethi.health" +
                  data_user_document_image +
                  pdf_image_name,
              },
              {
                name: "name",
                value: customer_name_dd,
              },
            ],
          },
        ],
      };

      //wati hit data
      sendwatitemplete(requestBody_ddd);
      res.send({ message: save_success, error: false });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.update_patient_by_doctor = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty, error: true });
  } else {
    try {
      const customer_id = req.body.customer_id;
      const customer_name = req.body.customer_name;
      const user_number = req.body.user_number;

      if (user_number == "") {
        res.send({ message: post_empty, error: true });
      }

      const user_customer_mobile_no = req.body.user_number.replace(/\+/g, "");

      const countryCode = user_customer_mobile_no.substring(0, 2);
      let user_customer_mobile_no_without_zip =
        user_customer_mobile_no.substring(2);
      if (countryCode != "91") {
        user_customer_mobile_no_without_zip =
          user_customer_mobile_no.substring(3);
      }

      const filter = {
        _id: { $ne: customer_id }, // Exclude the specified _id
        customer_mobile_no: user_customer_mobile_no, // Specify the filter condition based on the blood_group field
      };

      const count = await ethi_customers.countDocuments(filter);

      if (count > 0) {
        res.send({ message: mobile_already_present, error: true });
      }

      const filter111 = {
        _id: customer_id,
      };
      const update = {
        $set: {
          customer_name: customer_name,
          mobile_no_without_zip: user_customer_mobile_no_without_zip,
          customer_mobile_no: user_customer_mobile_no,
        },
      };
      await ethi_customers.updateOne(filter111, update, {
        useFindAndModify: false,
      });
      res.send({ message: save_success, error: false });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};
// Retrieve login data for user
exports.get_package_data = async (req, res) => {
  if (!req.body) {
    res.send({ message: post_empty, error: true });
  } else {
    try {
      var condition = {
        flag: "c",
        status_for: "0",
      };
      // Fetch data from Collection1 with condition
      const package_data = await ethi_package_master.find(condition).exec();

      // Combine the results into a single object
      const responseData = {
        package_data,
      };
      res.send({ message: responseData, error: false });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

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
      if (err) {
        res.send({
          message: error_msg,
        });
      }
    });
  } catch (err) {
    res.send({
      message: error_msg,
      error: true,
    });
  }

  return image_name;
}

async function send_to_user(title, message, image, token_id, target_call) {
  const res = {
    data: {
      title: title,
      message: message,
      android_channel_id: "channel",
      image: image,
      target: target_call,
      timestamp: new Date().toISOString(),
    },
  };
  const fields = {
    to: token_id,
    data: res,
  };

  try {
    const result = await sendPushNotification(fields);
  } catch (err) {
    //erro
  }
}

async function generateDeitplan(
  inputData,
  resultArray,
  supplementsArray2,
  pointsString2
) {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  
  

  <style>

  *{
      padding:0;
      margin:0;
  font-family: sans-serif;
  
  }

     
      .other-1{
          
          background-image: url('https://api.ethi.health/ethi_user_document/dietplan-bg-image2.jpg');
                  background-size: 100% 100%;
                  background-repeat: no-repeat;
                  background-position: center;
                  height:1055px !important ;
                 
                  
      }

      .other-2{
       
          
          background-image: url('https://api.ethi.health/ethi_user_document/back_next.png');
                  background-size: 100% 100%;
                  background-repeat: no-repeat;
                  background-position: center;
                  height:1055px !important ;
      }
      .other-3{
       
          
          background-image: url('https://api.ethi.health/ethi_user_document/dietplan-bg-image2.jpg');
                  background-size: 100% 100%;
                  background-repeat: no-repeat;
                  background-position: center;
                  height:1055px !important ;
                  
      }
      @media print {
          .other-1{height:1055px;}
     }
      @media print {
          .other-2{height:1055px;}
     }
      @media print {
          .other-3{height:1055px;}
     }
      .rounded-img{
          display: block;
         padding:3rem 0;
        margin-left: auto;
         margin-right: auto;

      }
      .transparent-1{
          height:60px;
          width:100%;
          margin-top : 5%;
         background-image:url("https://api.ethi.health/ethi_user_document/back_sliop.svg");
     background-repeat:no-repeat;
     background-size:100%;
       }
       .transparent-2{
           height:70px;
          width:50%;
          margin-top : 5%;
      
       margin-left:24%;
      
        background: rgba(255, 255, 255, 0.2); 
        backdrop-filter: blur(3px); 

         border: 1px solid white;
           border-radius: 8px;
       }
      
       .transparent-3{
           height:70px;
          width:50%;
          margin-top : 5%;
      
       margin-left:24%;
      
        background: rgba(255, 255, 255, 0.2); 
        backdrop-filter: blur(8px); 

         border: 1px solid white;
           border-radius: 8px;
       }
      

       .h3-1{
          padding-top:18px;
       
           text-align: center;
        
         color:#FFFFFF;
         
           color:#FFFFFF;
       }
       .h3-2{
          padding-top:21px;
          text-align: center;
          color:#FFFFFF;
          
       }
       .h3-3{
          padding-top:21px;
          text-align: center;
          color:#FFFFFF;
          
       }
   

      .tableDataBox{
          background-color:green;
      }

      .tableBox{
        
      }

    
     .box-1{
      margin: 3% 8rem;
       background-color:#0DA568;
       margin-top:5%;
       padding-bottom:20px;
       min-height: 100px;
     }
     .box-2{

      margin: 5% 8rem;
      border: 1px solid grey;
      min-height: 120px;
      background-color:white;
      padding-bottom:20px;
     }

     .imgAndTetx {
    
     }
     .flexDisplay{
     
     display: flex;
    flex-wrap: wrap;
     }

     .flex-container {
       display: flex;
        background-color: #f1f1f1;
      }

       .flex-container > div {
       background-color: DodgerBlue;
       color: white;
       width: 100px;
       margin: 10px;
       text-align: center;
        line-height: 75px;
       font-size: 30px;
       }

  
table {
border-collapse: collapse;
border-radius: 10px;
border-spacing: 0;
width: 100%;
}

td, th   {
border: 1px solid #dddddd;

padding: 10px;
}
  </style>
</head>
<body>
<div class="other-1"  >
    <img
      class="rounded-img"

      height="350"
      width="350 "
      src="https://api.ethi.health/ethi_user_document/dietplan_logo1.svg"
      alt="image"
    />

    <div class="transparent-1" style="position: relative;">
      <h3 class="h3-1">EVERY THING HEALTH INSPIRED</h3>
      <img
      
      src="https://api.ethi.health/ethi_user_document/dobule_icon.png"
      alt="image"
      style="    position: absolute;
  top: -13px;
  left: 27%;
  width: 30px;"

    />
    </div>

    <div class="t2Box">
     <div class="transparent-2">
      <h3 class="h3-2">

      ${inputData.inputName} <span style="padding-left: 60px"> ${
    inputData.inputDate
  }</span>
      </h3>
    
      
    </div>
    
    
    </div>
    </div>
   
  </div>

  <div class="other-2"  style = " min-height:1055px !important ;">
       <div  style = "text-align:center; display: flex; align-items: center; justify-content: space-around; padding: 2rem 0;">
        <img
        height =" 150px" width ="150px "
         src="https://api.ethi.health/ethi_user_document/dietplan_logo1.svg"

       />

      <h1 style = "width: fit-content; position:relative; color:#098f5c;    font-size: 49px;" >DIET PLAN
       <div style = "height :3px ;width:35px; background: linear-gradient(45deg, green, white); position: absolute; top: 45%; left: -25%;"></div>
       <div style = "height :3px ;width:35px; background: linear-gradient(45deg, white, green); position: absolute; top: 45%; right: -25%;"></div>
      </h1>
       </div>
  
  


   <div class="tableBox">
  <table style=" margin: 1rem auto; width: 95%;"  >
      <tr>
          <th style="background: linear-gradient(45deg, #177B7D, #098F5E);text-align:center;padding:15px;color:white;">Time</th>
          <th style="background-color: white;text-align:center;padding:15px;">Diet</th>
      </tr>
      ${resultArray
        .map(
          (item) => `
            <tr>
                <td style="background: linear-gradient(45deg, #177B7D, #098F5E); text-align: center; padding: 15px; color: white;     width: 33%;">${
                  item.meal_time
                }</td>
                <td style="background-color: white; text-align: center; padding: 15px;">
                    <ul style=" padding: 0; margin: 0;">
                        ${item.supplements_dataz
                          .split(",")
                          .map(
                            (item) =>
                              `<li style="color: black; margin-left: 5%; padding-top: 10px;">${item.trim()}</li>`
                          )
                          .join("")}
                    </ul>
                </td>
            </tr>
        `
        )
        .join("")}
  </table>

 
</div>

</div>

  <div class="other-3"  style = " min-height:1055px !important ;">
  <h1 style = " visibility: hidden;">akash</h1>
    <div  class="box-1" style="background: linear-gradient(45deg, #177B7D, #098F5E)">
   
     <div style = " ">
     
    
     <div style="display: flex; justify-content: center;"> <h1 style="color: white;  padding: 1rem 1.5rem; position:relative;width: fit-content; font-size: 23px;">SUPPLEMENTS

      <div style = "height :3px ;width:50px;   background: linear-gradient(45deg, white, green);position: absolute; top: 48%; left: -15%; "></div>
     <div style = "height :3px ;width:50px;    background: linear-gradient(45deg, green, white);position: absolute; top: 48%; right: -15%;"></div>
    </h1></div>
     </div>

     
       <div style = "margin-top:3%">
      ${supplementsArray2
        .map(
          (item) => `
      <li style="color: white; padding:1rem 2rem; font-size: 20px;">${item}</li>
      `
        )
        .join("")}
      </div>
    </div>
    <div class="box-2">
    
    
       <div style = " ">
     
    
     <div style="display: flex; justify-content: center;"> <h1 style="color:  #0da568;  padding: 1rem 1.5rem; position:relative;width: fit-content;font-size: 23px;">POINTS TO REMEMBER

      <div style = "height :3px ;width:50px;    background: linear-gradient(45deg, green,white); position: absolute; top: 48%; left: -10%;"></div>
     <div style = "height :3px ;width:50px;   background: linear-gradient(45deg, white, green); position: absolute; top: 48%; right: -10%;"></div>
    </h1></div>
     </div>
      <div style = "margin-top:5%">
      ${pointsString2
        .map(
          (item) => `
      <li style="color: #0da568; padding:1rem 2rem; font-size: 20px;">${item}</li>
      `
        )
        .join("")}

      </div>
    </div>
  </div>

</body>
</html>
  
    `;
  let image_name = "diel_plan_simple.pdf";
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

    await page.setContent(htmlContent);
    const data_user_image = data_user_document_image;
    const only_side_name = "_user_dietplan";
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
      //done
    });
    await browser.close();
  } catch (err) {
    console.log(err);
  }

  return image_name;
}

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
function differenceInSecondsfunction(start_time, time_end) {
  const [startHours, startMinutes] = start_time.split(":").map(Number);
  const [endHours, endMinutes] = time_end.split(":").map(Number);

  const startDate = new Date(0, 0, 0, startHours, startMinutes);
  const endDate = new Date(0, 0, 0, endHours, endMinutes);

  let differenceInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

  // If the end time is before the start time, add a day to end date
  if (differenceInSeconds < 0) {
    differenceInSeconds += 24 * 3600; // 24 hours in seconds
  }

  return differenceInSeconds;
}
async function sendPushNotification(fields) {
  const firebaseKey = process.env.FIREBASE_SERVER_KEY;
  const fcmUrl = process.env.FCM_URL;
  const headers = {
    Authorization: "key=" + firebaseKey,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(fcmUrl, fields, { headers });
    return response;
  } catch (err) {
    throw new Error("Failed to send push notification");
  }
}

async function sendwatitemplete(requestBody) {
  try {
  const headers = {
    authorization: `Bearer ${apiKey_wati}`,
    accept: "*/*",
    "content-type": "application/json",
  };
  await axios.post(apiUrl_wati, JSON.stringify(requestBody), {
    headers,
  });
} catch (err) {
  // eslint-disable-next-line
}
  return "done";
}
