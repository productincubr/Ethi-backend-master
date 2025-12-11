const db = require("../models");
const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
const crypto = require("crypto");
const { CLIENT_RENEG_LIMIT } = require("tls");

// ✅ Import JWT and Password helpers
const { generateToken } = require("../middleware/auth.middleware");
const { hashPassword, comparePassword } = require("../helpers/password.helper");
const { processAndSaveImage, deleteImage } = require("../helpers/image.helper");

const ethi_admin = db.ethi_admin;
const ethi_super_admin = db.ethi_super_admin; // ✅ Super admin collection for owners
const ethi_access_request = db.ethi_access_request; // ✅ Pending approval requests
const ethi_goals_master = db.ethi_goals_master;
const ethi_front_master = db.ethi_front_master;
const ethi_admin_master = db.ethi_admin_master;
const ethi_testmonial = db.ethi_testmonial;
const ethi_faq_master = db.ethi_faq_master;
const ethi_package_master = db.ethi_package_master;
const ethi_feeds_master = db.ethi_feeds_master;
const ethi_customers = db.ethi_customers;
const ethi_notification_master = db.ethi_notification_master;
const ethi_help_center_master = db.ethi_help_center_master;
const ethi_quote_master = db.ethi_quote_master;
const ethi_video_master = db.ethi_video_master;
const ethi_query_master = db.ethi_query_master;
const ethi_doctor_master = db.ethi_doctor_master;
const ethi_doctor_leave = db.ethi_doctor_leave;
const ethi_subscription_plan = db.ethi_subscription_plan;
const ethi_appointment_with_doctor = db.ethi_appointment_with_doctor;
const ethi_corporate = db.ethi_corporate;
const ethi_supplement_master = db.ethi_supplement_master;
const ethi_food_master = db.ethi_food_master;
const ethi_remember_master = db.ethi_remember_master;
const ethi_doctors_goals = db.ethi_doctors_goals;
const ethi_customer_web_form = db.ethi_customer_web_form;
const ethi_customer_web_subscribe_email = db.ethi_customer_web_subscribe_email;
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

const error_msg = "Something Went Wrong, Please Try Again.";
const user_msg = "User is Invalid. Please try again.";
const post_empty = "Content can not be empty!.";
const done_empty = "done";
const error_empty = "error";
const updated_success = "Successfully Updated";
const save_success = "Successfully Saved";
const already_exists = "Data Already Exists.";
const appointment_exists = "Appointment Already Present.";
const appointment_success = "Appointment Create Successfully";
const password_worng = "Password Wrong please Try Again";
const already_done = "Already Done";
const appointment_error_date =
  "Selected Date Is Not present Between Start And End date";
const appointment_error_package =
  "Package Is Not Subscribed Please Re subscribed";
const appointment_error_subscribe =
  "Please Subscribe Package For Appointment In App";
const appointment_error_singup = "Please Signup Mobile No Not Present.";
// Fetch data from Collection2 with condition
const data_goal_image = "/goal_master_image/";
// Fetch data from Collection2 with condition
const data_front_image = "/ethi_front_image/";
// Fetch data from Collection2 with condition
const data_admin_image = "/ethi_admin_master_image/";
// Fetch data from Collection2 with condition
const data_testmonial_image = "/ethi_testmonial_image/";
// Fetch data from Collection2 with condition
const data_ethi_video_master_image = "/ethi_video_master_image/";
const data_csv_doctor = "/ethi_doctor_csv/";
// Fetch data from Collection2 with condition
const data_notification_image = "/ethi_notification_image/";

const data_query_image = "/ethi_query_master_image/";
const data_doctor_image = "/ethi_doctor_image/";

/**
 * Admin Login Controller
 * 
 * Authenticates admin users with email and password
 * Validates credentials against ethi_admin collection
 * Returns admin data and profile image path on successful authentication
 */

/**
 * ===== ADMIN ROLES & HELPERS =====
 * 
 * admin_type field (ethi_admin collection) will be used as:
 * - "SUPER_ADMIN"  => full access (can add/edit admins, doctors, settings etc.)
 * - "ADMIN"        => limited access (own profile, limited dashboards)
 * 
 * These helper functions ensure:
 * - Every "dangerous" action (add_staff, update_staff, get_all_admin, etc.)
 *   is only allowed for SUPER_ADMIN.
 */

const ADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
};

/**
 * Get requester admin document using requester_admin_id from body.
 * 
 * Frontend must send:
 *  - requester_admin_id : logged in admin _id (Mongo id string)
 */
async function getRequesterAdmin(req, res) {
  try {
    const requesterId = req.body.requester_admin_id;

    if (!requesterId) {
      res.send({
        error: true,
        message: "requester_admin_id is required for this action",
      });
      return null;
    }

    const admin = await ethi_admin.findOne({
      _id: requesterId,
      flag: "c",
    });

    if (!admin) {
      res.send({
        error: true,
        message: "Requester admin not found or inactive",
      });
      return null;
    }

    return admin;
  } catch (err) {
    console.log("getRequesterAdmin error:", err);
    res.send({
      error: true,
      message: error_msg,
    });
    return null;
  }
}

/**
 * Ensure that current requester is SUPER_ADMIN.
 * 
 * - Returns SUPER_ADMIN document if allowed
 * - Sends error response and returns null if not allowed
 */
async function assertSuperAdmin(req, res) {
  const admin = await getRequesterAdmin(req, res);
  if (!admin) return null;

  if (admin.admin_type !== ADMIN_ROLES.SUPER_ADMIN) {
    res.send({
      error: true,
      message:
        "Permission denied. Only SUPER_ADMIN can perform this action.",
    });
    return null;
  }

  // If in future you want to lock admin:
  // if (admin.allow_access === "0") { ... }

  return admin;
}


/**
 * Admin Login Controller
 *
 * PURPOSE:
 * - Authenticate admin (super_admin or admin) using email + password
 * - Check if admin account is active
 * - Return admin data including role + image path
 */
exports.login_to_superadmin = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    const user_email = req.body.useremail;
    const user_password = req.body.userpassword;

    // Find admin by email in both collections
    const query = {
      $and: [
        { admin_email: user_email },
        { flag: "c" },
      ],
    };

    // Check super admin collection first (for owners)
    let data_admin = await ethi_super_admin.findOne({ admin_email: user_email });
    let isSuperAdmin = !!data_admin;

    // If not found in super admin, check regular admin collection
    if (!data_admin) {
      const regularAdmins = await ethi_admin.find(query);
      data_admin = regularAdmins && regularAdmins.length > 0 ? regularAdmins[0] : null;
    }
    
    console.log(
      "Admin Login - Found in:",
      isSuperAdmin ? "ethi_super_admin (Owner)" : data_admin ? "ethi_admin (Team Member)" : "Not Found"
    );

    // If not found in approved collections, check if user is pending approval
    if (!data_admin) {
      const pendingRequest = await ethi_access_request.findOne({ admin_email: user_email });
      
      if (pendingRequest) {
        console.log("⏳ User found in pending requests:", user_email);
        return res.send({
          message: "Your account is pending approval. Please wait for the owner to approve your request. You will receive an email notification once approved.",
          error: true,
          pending: true, // Flag to indicate pending status
        });
      }
    }

    if (data_admin) {
      const stored_password = data_admin.admin_passowrd_enq;

      // 🔐 Check password (supports both MD5 and Bcrypt)
      let isPasswordValid = false;

      // Try Bcrypt first (new format - starts with $2b$)
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
          
          // Update in correct collection
          if (isSuperAdmin) {
            await ethi_super_admin.updateOne(
              { _id: data_admin._id },
              { $set: { admin_passowrd_enq: bcrypt_hash } }
            );
          } else {
            await ethi_admin.updateOne(
              { _id: data_admin._id },
              { $set: { admin_passowrd_enq: bcrypt_hash } }
            );
          }
          console.log("✅ Password migrated to Bcrypt successfully in", isSuperAdmin ? "super_admin" : "admin", "collection");
        }
      }

      if (!isPasswordValid) {
        console.log("❌ Invalid password for:", user_email);
        return res.send({
          message: "Invalid email or password",
          error: true,
        });
      }

      // Determine role
      const userRole = data_admin.role || 
                      data_admin.admin_type || 
                      (data_admin.is_super_admin ? "super_admin" : "admin");

      console.log("Admin found:", data_admin.admin_email, "role:", userRole);

      // ✅ Check if account is active
      if (data_admin.allow_access === "0" || data_admin.allow_access === 0) {
        console.log("Admin account is disabled:", data_admin.admin_email);
        return res.send({
          message: "Your account has been disabled. Please contact Super Admin.",
          error: true,
        });
      }

      // 🎫 Generate JWT Token
      const jwtToken = generateToken({
        _id: data_admin._id,
        email: data_admin.admin_email,
        role: userRole,
        type: 'admin',
      });

      console.log("✅ JWT token generated for:", data_admin.admin_email);

      // Frontend ko role, data aur token bhejo
      const responseData = {
        data_admin: {
          ...data_admin._doc,
          role: userRole,
          is_super_admin: userRole === "super_admin",
        },
        data_doctor_image,
        token: jwtToken, // ✅ JWT token
      };

      return res.send({
        message: responseData,
        error: false,
      });
    } else {
      console.log("No admin found with email:", user_email);
      return res.send({
        message: user_msg,
        error: true,
      });
    }
  } catch (error) {
    console.log("❌ Login error:", error);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};


// Retrieve login data for user
exports.welcome_page = async (req, res) => {
  try {
    var condition = {
      flag: "c",
    };
    var condition2 = {
      flag: "c",
      status_for: "0",
    };

    var condition3 = {
      flag: "c",
      renew_status: "c",
    };
    var condition4 = {
      flag: "c",
      payment_status: "done",
    };

    // Fetch data from Collection1 with condition
    const count_doctor = await ethi_doctor_master
      .countDocuments(condition)
      .exec();

    //doubt
    const count_patient = await ethi_subscription_plan
      .countDocuments(condition3)
      .exec();
    const count_apponiment = await ethi_appointment_with_doctor
      .countDocuments(condition)
      .exec();

    const count_customer = await ethi_customers
      .countDocuments(condition)
      .exec();

    const count_leaves = await ethi_doctor_leave
      .countDocuments(condition2)
      .exec();

    const result = await ethi_subscription_plan
      .aggregate([
        {
          $match: condition4, // Your match criteria
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$payment_amount" }, // Replace "amount" with the actual field name
          },
        },
      ])
      .exec();
    console.log(result);
    const sumOfAmount_revence = result.length > 0 ? result[0].totalAmount : 0;

    // Fetch data from Collection1 with condition
    const data_doctor = await ethi_doctor_master
      .find(condition)
      .limit(10)
      .sort({ createdAt: -1 })
      .exec();

    // Combine the results into a single object
    const responseData = {
      data_doctor,
      data_doctor_image,
      count_doctor,
      count_customer,
      count_apponiment,
      sumOfAmount_revence,
      count_patient,
      count_leaves,
    };

    res.send({
      message: responseData,
      error: false,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: error_msg,
      error: true,
    });
  }
};

exports.create_appointments_by_admin = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
    return;
  }

  try {
    const admin_id = req.body.admin_id;
    const user_customer_mobile_no = req.body.user_customer_mobile_no;
    const user_customer_mobile_name = req.body.user_customer_mobile_name || "New Patient";
    const selected_date_id = req.body.selected_date;
    const selected_time_id = req.body.selected_time;
    const consultation_category = req.body.category || "initial";
    const occurrence_type = req.body.occurrence || "one_time";

    console.log("📞 Creating appointment for:", user_customer_mobile_no);

    // Check if customer exists
    const existingCustomer = await ethi_customers.findOne({
      mobile_no_without_zip: user_customer_mobile_no,
    });

    let customer_id_id;
    let customer_name_dd;
    let customer_mobile_no_dd;
    let customer_image_dd;
    let doctor_id_id;
    let subscription_id_dd;
    let package_start_date;
    let package_end_date;
    let is_new_customer = false;

    if (existingCustomer) {
      // ✅ EXISTING CUSTOMER - Use their data
      console.log("✅ Customer found:", existingCustomer.customer_name);
      
      customer_id_id = existingCustomer._id;
      customer_name_dd = existingCustomer.customer_name;
      customer_mobile_no_dd = existingCustomer.customer_mobile_no;
      customer_image_dd = existingCustomer.customer_image;
      doctor_id_id = existingCustomer.last_doctor_id || "0";
      subscription_id_dd = existingCustomer.last_subscription_id || "free_consultation";
      package_start_date = existingCustomer.package_start_date || new Date();
      package_end_date = existingCustomer.package_end_date || new Date(new Date().setMonth(new Date().getMonth() + 1));

    } else {
      // ✅ NEW CUSTOMER - Create profile automatically
      console.log("📝 Creating new customer profile for:", user_customer_mobile_name);
      is_new_customer = true;
      
      const newCustomer = new ethi_customers({
        customer_name: user_customer_mobile_name,
        customer_mobile_no: "+91" + user_customer_mobile_no,
        mobile_no_without_zip: user_customer_mobile_no,
        customer_email: "",
        customer_image: "user_image.png",
        customer_dob: "",
        customer_gender: "",
        customer_medical_history: "",
        entry_date: currentDatetime(),
        login_step: "0",
        last_doctor_id: "0",
        last_subscription_id: "free_consultation",
        package_start_date: new Date(),
        package_end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        flag: "c",
      });

      const savedCustomer = await newCustomer.save();
      console.log("✅ New customer created with ID:", savedCustomer._id);

      customer_id_id = savedCustomer._id;
      customer_name_dd = savedCustomer.customer_name;
      customer_mobile_no_dd = savedCustomer.customer_mobile_no;
      customer_image_dd = savedCustomer.customer_image;
      doctor_id_id = "0";
      subscription_id_dd = "free_consultation";
      package_start_date = savedCustomer.package_start_date;
      package_end_date = savedCustomer.package_end_date;
    }

    // Validate date is within package period
    const selected_date_obj = new Date(selected_date_id);
    const current_date = new Date();

    if (selected_date_obj < package_start_date || selected_date_obj > package_end_date) {
      console.log("⚠️ Date outside package period");
      return res.send({
        message: appointment_error_date,
        error: true,
      });
    }

    // Check for duplicate appointment
    const duplicateAppointment = await ethi_appointment_with_doctor.findOne({
      customer_id: customer_id_id,
      doctor_id: doctor_id_id,
      booking_date: selected_date_id,
      booking_start_time: selected_time_id,
      status_for_complete: { $ne: "2" }, // Not cancelled
    });

    if (duplicateAppointment) {
      console.log("⚠️ Duplicate appointment found");
      return res.send({
        message: `Already Appointment on ${selected_date_id} Time ${selected_time_id}`,
        error: true,
      });
    }

    // Count existing appointments
    const appointmentCount = await ethi_appointment_with_doctor.countDocuments({
      flag: "c",
      customer_id: customer_id_id,
      subscription_id: subscription_id_dd,
      doctor_id: doctor_id_id,
      status_for_complete: "1",
    });

    let time_add = appointmentCount > 1 ? 15 : 30;

    // Get doctor information
    let doctor_name_dd = "To Be Assigned";
    let doctor_tag_dd = "";
    let doctor_image_dd = "user_image.png";

    if (doctor_id_id && doctor_id_id !== "0") {
      const doctor = await ethi_doctor_master.findById(doctor_id_id);
      if (doctor) {
        doctor_name_dd = doctor.doctor_name;
        doctor_tag_dd = doctor.doctor_tag;
        doctor_image_dd = doctor.doctor_image;
      }
    }

    // Calculate end time
    const booking_end_time_dd = add_time(selected_time_id, time_add);
    
    // Generate Agora token
    let make_sec = convertinsec(selected_date_id, booking_end_time_dd);
    let token_agora_dd = generateAgoraToken(customer_id_id, make_sec);

    // Create appointment
    const newAppointment = new ethi_appointment_with_doctor({
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
      which_no_booking: appointmentCount.toString(),
      occurrence: occurrence_type,
      category: consultation_category,
      description: req.body.description || "",
      diet_plan_status: "0",
      assesment_form_status: "0",
      token_agora: token_agora_dd,
      status_for_complete: "0",
      book_by: "admin",
      flag: "c",
    });

    const savedAppointment = await newAppointment.save();
    console.log("✅ Appointment created:", savedAppointment._id);

    // Update customer login step
    await ethi_customers.updateOne(
      { _id: customer_id_id },
      { $set: { login_step: "2" } }
    );

    // Send WhatsApp notification
    try {
      const requestBody = {
        template_name: "agora_link",
        broadcast_name: "agora_link",
        receivers: [
          {
            whatsappNumber: customer_mobile_no_dd,
            customParams: [
              {
                name: "link",
                value: agrora_link + savedAppointment._id,
              },
              {
                name: "ordernumber",
                value: selected_date_id,
              },
              {
                name: "tracking_company",
                value: selected_time_id,
              },
            ],
          },
        ],
      };
      sendwatitemplete(requestBody);
    } catch (whatsappError) {
      console.log("⚠️ WhatsApp notification failed:", whatsappError.message);
    }

    res.send({
      message: is_new_customer 
        ? "New patient registered and appointment created successfully!" 
        : appointment_success,
      error: false,
      data: {
        appointment_id: savedAppointment._id,
        customer_id: customer_id_id,
        customer_name: customer_name_dd,
        is_new_customer: is_new_customer,
      },
    });

  } catch (error) {
    console.error("❌ Appointment creation error:", error);
    res.status(500).send({
      message: "Failed to create appointment: " + error.message,
      error: true,
    });
  }
};

// Retrieve all ethi_admin from the database.
exports.goal_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const title_sss = req.body.title;
      const description_sss = req.body.description;

      const image_name = upload_image(
        "_goal",
        data_goal_image,
        req.files.image_for_new
      );
      const query = {
        $and: [
          { goal_name: title_sss },
          { goal_details: description_sss },
          // Add more conditions as needed
        ],
      };

      ethi_goals_master
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const ethi_goals_master_data = new ethi_goals_master({
              entry_date: currentDatetime(),
              goal_name: title_sss,
              goal_image: image_name,
              goal_details: description_sss,
              flag: "c",
            });

            ethi_goals_master_data
              .save()
              .then((savedCustomer) => {
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_front_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const title_sss = req.body.title;
      const description_sss = req.body.description;

      const image_name = upload_image(
        "_ethi",
        data_front_image,
        req.files.image_for_ethi_new
      );

      const image_name2 = upload_image(
        "_small_icon",
        data_front_image,
        req.files.image_for_popup_new
      );

      const query = {
        $and: [
          { front_name: title_sss },
          { front_detail: description_sss },
          // Add more conditions as needed
        ],
      };

      ethi_front_master
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const ethi_front_master_data = new ethi_front_master({
              entry_date: currentDatetime(),
              front_name: title_sss,
              front_image: image_name,
              front_icon_image: image_name2,
              front_detail: description_sss,
              flag: "c",
            });

            ethi_front_master_data
              .save()
              .then((savedCustomer) => {
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_testmonial_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const title_sss = req.body.title;
      const description_sss = req.body.description;
      const authorName_sss = req.body.authorname;

      const image_name = upload_image(
        "_tes",
        data_testmonial_image,
        req.files.image_for_tes_new
      );

      const query = {
        $and: [
          { title_name: title_sss },
          { full_detail: description_sss },
          // Add more conditions as needed
        ],
      };

      ethi_testmonial
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const ethi_testmonial_data = new ethi_testmonial({
              entry_date: currentDatetime(),
              title_name: title_sss,
              image_name: image_name,
              author_name: authorName_sss,
              full_detail: description_sss,
              flag: "c",
            });

            ethi_testmonial_data
              .save()
              .then((savedCustomer) => {
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_faq_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const question_sss = req.body.question;
      const answer_sss = req.body.answer;

      const query = {
        $and: [
          { question_name: question_sss },
          { answer_name: answer_sss },
          // Add more conditions as needed
        ],
      };

      ethi_faq_master
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const ethi_faq_master_data = new ethi_faq_master({
              entry_date: currentDatetime(),
              question_name: question_sss,
              answer_name: answer_sss,
              flag: "c",
            });

            ethi_faq_master_data
              .save()
              .then((savedCustomer) => {
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_package_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const package_price = req.body.package_price;
      const package_name_ss = req.body.package_name;
      const package_days_ss = req.body.package_days;
      const no_of_calling_ss = req.body.no_of_calling;
      const package_month_plan = req.body.package_month_plan + " Month plan";
      let feature_1 = "";
      let feature_2 = "";
      let feature_3 = "";
      let feature_4 = "";
      let feature_5 = "";

      if (req.body.feature_1) {
        feature_1 = req.body.feature_1;
      }
      if (req.body.feature_2) {
        feature_2 = req.body.feature_2;
      }
      if (req.body.feature_3) {
        feature_3 = req.body.feature_3;
      }
      if (req.body.feature_4) {
        feature_4 = req.body.feature_4;
      }
      if (req.body.feature_5) {
        feature_5 = req.body.feature_5;
      }

      const query = {
        $and: [
          { package_name: package_name_ss },
          { package_price: package_price },
          // Add more conditions as needed
        ],
      };

      ethi_package_master
        .find(query)
        .then((data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            const ethi_package_master_data = new ethi_package_master({
              entry_date: currentDatetime(),
              package_name: package_name_ss,
              package_price: package_price,
              package_month_plan: package_month_plan,
              no_of_calling: no_of_calling_ss,
              package_days: package_days_ss,
              first_facility: feature_1,
              sec_facility: feature_2,
              thrid_facility: feature_3,
              four_facility: feature_4,
              five_facility: feature_5,
              status_for: "1",
              flag: "c",
            });

            ethi_package_master_data
              .save()
              .then((savedCustomer) => {
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.update_admin_master_save = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_image_old_sss = req.body.doctor_image_old;
      const doctor_detail_sss = req.body.doctor_detail;
      const apple_image_old_sss = req.body.apple_image_old;
      const apple_detail_sss = req.body.apple_detail;
      const front_first_card_per_sss = req.body.front_first_card_per;
      const front_first_card_detail_sss = req.body.front_first_card_detail;
      const front_sec_card_per_sss = req.body.front_sec_card_per;
      const front_sec_card_detail_sss = req.body.front_sec_card_detail;
      const front_third_card_per_sss = req.body.front_third_card_per;
      const front_third_card_detail_sss = req.body.front_third_card_detail;
      const front_four_card_per_sss = req.body.front_four_card_per;
      const front_four_card_detail_sss = req.body.front_four_card_detail;
      const front_video_link_old_sss = req.body.front_video_link_old;
      const front_video_text_sss = req.body.front_video_text;
      const front_why_us_sss = req.body.front_why_us;
      const front_calling_no_ss = req.body.front_calling_no;

      let actual_doctor_image = doctor_image_old_sss;
      let actual_apple_image = apple_image_old_sss;
      let actual_front_video_link = front_video_link_old_sss;

      if (req.files?.front_video_link_new) {
        actual_front_video_link = upload_image(
          "_ethi_video",
          data_admin_image,
          req.files.front_video_link_new
        );
      }
      if (req.files?.apple_image_new) {
        actual_apple_image = upload_image(
          "_ethi_apple",
          data_admin_image,
          req.files.apple_image_new
        );
      }
      if (req.files?.doctor_image_new) {
        actual_doctor_image = upload_image(
          "_ethi_front",
          data_admin_image,
          req.files.doctor_image_new
        );
      }

      const update1 = {
        $set: {
          entry_date: currentDatetime(),
          doctor_image: actual_doctor_image,
          doctor_detail: doctor_detail_sss,
          apple_image: actual_apple_image,
          apple_detail: apple_detail_sss,
          front_first_card_per: front_first_card_per_sss,
          front_first_card_detail: front_first_card_detail_sss,
          front_sec_card_per: front_sec_card_per_sss,
          front_sec_card_detail: front_sec_card_detail_sss,
          front_third_card_per: front_third_card_per_sss,
          front_third_card_detail: front_third_card_detail_sss,
          front_four_card_per: front_four_card_per_sss,
          front_four_card_detail: front_four_card_detail_sss,
          front_video_link: actual_front_video_link,
          front_calling_no: front_calling_no_ss,
          front_video_text: front_video_text_sss,
          front_why_us: front_why_us_sss,
          flag: "c",
        },
      };
      const filter1 = {};

      ethi_admin_master
        .updateOne(filter1, update1, {
          useFindAndModify: false,
        })
        .then((savedCustomer) => {
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
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve login data for user
exports.setting_page_master = async (req, res) => {
  try {
    var condition = {
      flag: "c",
    };
    // Fetch data from Collection1 with condition
    const data_goal = await ethi_goals_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_front = await ethi_front_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_package = await ethi_package_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_admin = await ethi_admin_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_testmonial = await ethi_testmonial
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_faq = await ethi_faq_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_ethi_help_center = await ethi_help_center_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_ethi_quote = await ethi_quote_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();
    const data_video_libery = await ethi_video_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();

    // Combine the results into a single object
    const responseData = {
      data_goal,
      data_goal_image,
      data_front,
      data_front_image,
      data_testmonial,
      data_testmonial_image,
      data_faq,
      data_package,
      data_admin,
      data_admin_image,
      data_ethi_help_center,
      data_ethi_quote,
      data_video_libery,
      data_ethi_video_master_image,
    };
    res.send({
      message: responseData,
      error: false,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: error_msg,
      error: true,
    });
  }
};

// Retrieve login data for user
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
    res.send({
      message: responseData,
      error: false,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: error_msg,
      error: true,
    });
  }
};

// Retrieve all ethi_admin from the database.
exports.post_notification = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const notification_name = req.body.notification_name;
      const notification_details = req.body.notification_details;

      const image_name = upload_image(
        "_noti",
        data_notification_image,
        req.files.image_for_noti_new
      );

      const ethi_notification_master_data = new ethi_notification_master({
        entry_date: currentDatetime(),
        notification_name: notification_name,
        notification_details: notification_details,
        notification_image: image_name,
        flag: "c",
      });

      ethi_notification_master_data
        .save()
        .then((savedCustomer) => {
          const image = data_notification_image + image_name;
          send_to_topic(
            "ethi_global",
            notification_name,
            notification_details,
            image
          );
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
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};
// Retrieve all ethi_admin from the database.
exports.send_test_node = (req, res) => {
  send_to_topic("ethi_global", "test", "test", null);
};
// Retrieve all ethi_admin from the database.
exports.post_video_libery = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const video_name_dd = req.body.video_name;

      const image_name = upload_image(
        "_video",
        data_ethi_video_master_image,
        req.files.image_for_noti_new
      );
      const image_name2 = image_name;

      const ethi_video_master_data = new ethi_video_master({
        entry_date: currentDatetime(),
        video_name: video_name_dd,
        video_image: image_name,
        thumbnail_name: image_name2,
        flag: "c",
      });

      ethi_video_master_data
        .save()
        .then((savedCustomer) => {
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
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_help_center_master = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const question_name_dd = req.body.question_name;
      const answer_name_dd = req.body.answer_name;

      const ethi_help_center_master_data = new ethi_help_center_master({
        entry_date: currentDatetime(),
        question_name: question_name_dd,
        answer_name: answer_name_dd,
        popular_type: "0",
        flag: "c",
      });

      ethi_help_center_master_data
        .save()
        .then((savedCustomer) => {
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
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.ethi_quote_master_post = (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const quote_name_dd = req.body.quote_name;
      const author_name_dd = req.body.author_nam;

      const ethi_quote_master_data = new ethi_quote_master({
        entry_date: currentDatetime(),
        quote_name: quote_name_dd,
        author_name: author_name_dd,
        flag: "c",
      });

      ethi_quote_master_data
        .save()
        .then((savedCustomer) => {
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
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.change_password_admin_save = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const admin_id_for = req.body.admin_id;
      const admin_passowrd = req.body.newpassword;
      const admin_passowrd_enq = make_password(req.body.newpassword);
      const olduserpassword_enq = make_password(req.body.currentpassword);

      const update1 = {
        $set: {
          admin_password: admin_passowrd,
          admin_passowrd_enq: admin_passowrd_enq,
        },
      };

      const filter1 = {
        _id: admin_id_for,
        flag: "c",
        admin_passowrd_enq: olduserpassword_enq,
      };

      ethi_admin
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
          console.log(err);
          res.send({
            message: password_worng,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve login data for user
exports.ethi_query_master_get = async (req, res) => {
  try {
    var condition = {
      flag: "c",
    };

    // Fetch data from Collection1 with condition
    const data_query = await ethi_query_master
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();

    // Fetch data from Collection2 with condition

    // Combine the results into a single object
    const responseData = {
      data_query,
      data_query_image,
    };
    res.send({
      message: responseData,
      error: false,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: error_msg,
      error: true,
    });
  }
};

// Retrieve all ethi_admin from the database.
// Create a new Admin Staff (SUPER_ADMIN only)
/**
 * ✅ ADD STAFF - ONLY Super Admin can add new admins
 * 
 * Permission: Super Admin ONLY
 * Restriction: Cannot create another super_admin
 */
exports.add_staff = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    // 1) Verify requester is super_admin
    const requesterId = req.body.requester_admin_id;
    
    if (!requesterId) {
      return res.send({
        error: true,
        message: "requester_admin_id is required for this action",
      });
    }

    const requester = await ethi_admin.findOne({
      _id: requesterId,
      flag: "c",
    });

    if (!requester) {
      return res.send({
        error: true,
        message: "Requester admin not found or inactive",
      });
    }

    // ✅ Check if requester is super_admin
    const isSuper = requester.role === "super_admin" || 
                    requester.admin_type === "super_admin" ||
                    requester.is_super_admin === true;

    if (!isSuper) {
      return res.send({
        error: true,
        message: "🚫 Permission denied. Only Super Admin can add staff members.",
      });
    }

    console.log(`✅ Staff being added by Super Admin: ${requester.admin_name}`);

    // 2) Read staff fields from body
    const admin_email_ss = req.body.admin_email;
    const admin_name_ss = req.body.admin_name;
    const admin_mobile_no_ss = req.body.admin_mobile_no;
    const admin_type_ss = req.body.admin_type || "admin";
    const admin_city_ss = req.body.admin_city;
    const admin_country_ss = req.body.admin_country;
    const admin_education_ss = req.body.admin_education;
    const admin_join_date_ss = req.body.admin_join_date;
    const admin_state_ss = req.body.admin_state;
    const admin_zipcode_ss = req.body.admin_zipcode;
    const admin_password_ss = req.body.admin_password;
    const admin_passowrd_enq_ss = make_password(req.body.admin_password);

    let admin_image_ss = "";

    // 3) Do NOT allow creating another super_admin from UI
    if (admin_type_ss === "super_admin" || admin_type_ss === "SUPER_ADMIN") {
      return res.send({
        error: true,
        message: "❌ You cannot create another Super Admin from this screen.",
      });
    }

    // 4) Check if email already exists
    const query = {
      $and: [{ admin_email: admin_email_ss }, { flag: "c" }],
    };

    const existing = await ethi_admin.find(query);
    if (existing && existing[0]) {
      return res.send({
        message: already_exists,
        error: true,
      });
    }

    // 5) If image uploaded, save it
    if (req.files?.admin_image_new) {
      admin_image_ss = upload_image(
        "_admin",
        data_doctor_image,
        req.files.admin_image_new
      );
    }

    // 6) Create new staff admin
    const ethi_admin_data = new ethi_admin({
      entry_date: currentDatetime(),
      admin_name: admin_name_ss,
      admin_mobile_no: admin_mobile_no_ss,
      admin_email: admin_email_ss,
      admin_image: admin_image_ss,
      admin_type: "admin",
      role: "admin",
      is_super_admin: false,
      admin_city: admin_city_ss,
      admin_country: admin_country_ss,
      admin_education: admin_education_ss,
      admin_join_date: admin_join_date_ss,
      admin_state: admin_state_ss,
      admin_zipcode: admin_zipcode_ss,
      admin_password: admin_password_ss,
      admin_passowrd_enq: admin_passowrd_enq_ss,
      allow_access: "1",
      flag: "c",
    });

    await ethi_admin_data.save();

    console.log(`✅ Normal Admin created: ${admin_name_ss} (${admin_email_ss})`);

    return res.send({
      message: save_success,
      error: false,
    });
  } catch (error) {
    console.error("❌ Add Staff Error:", error);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};


// Retrieve all ethi_admin from the database.
// Update staff admin (SUPER_ADMIN only)
// Update staff admin (SUPER_ADMIN only)
exports.update_staff = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    // 1) Only SUPER_ADMIN is allowed to update staff from this endpoint
    const superAdmin = await assertSuperAdmin(req, res);
    if (!superAdmin) {
      return;
    }

    const admin_email_ss = req.body.admin_email;
    const admin_name_ss = req.body.admin_name;
    const admin_mobile_no_ss = req.body.admin_mobile_no;
    const admin_type_ss = req.body.admin_type;
    const admin_city_ss = req.body.admin_city;
    const admin_country_ss = req.body.admin_country;
    const admin_education_ss = req.body.admin_education;
    const admin_join_date_ss = req.body.admin_join_date;
    const admin_state_ss = req.body.admin_state;
    const admin_zipcode_ss = req.body.admin_zipcode;
    const admin_password_ss = req.body.admin_password;
    const admin_id_ss = req.body.admin_id;
    let admin_image_ss = req.body.admin_old_image;
    const admin_passowrd_enq_ss = make_password(req.body.admin_password);

    // 2) Prevent email duplication with other admins
    const query = {
      $and: [
        { admin_email: admin_email_ss },
        { flag: "c" },
        { _id: { $ne: admin_id_ss } },
      ],
    };

    const existing = await ethi_admin.find(query);
    if (existing && existing[0]) {
      return res.send({
        message: already_exists,
        error: true,
      });
    }

    // 3) If new image uploaded -> upload
    if (req.files && req.files.admin_image_new) {
      admin_image_ss = upload_image(
        "_admin",
        data_doctor_image,
        req.files.admin_image_new
      );
    }

    // 4) Also update any feed entries where this admin is referenced
    const updateFeeds = {
      $set: {
        doctor_name: admin_name_ss,
        doctor_admin_image: admin_image_ss,
      },
    };
    const filterFeeds = {
      admin_id: admin_id_ss,
      flag: "c",
    };

    await ethi_feeds_master.updateMany(filterFeeds, updateFeeds, {
      useFindAndModify: false,
    });

    // 5) Finally update admin document
    const updateAdmin = {
      $set: {
        admin_name: admin_name_ss,
        admin_mobile_no: admin_mobile_no_ss,
        admin_email: admin_email_ss,
        admin_image: admin_image_ss,
        admin_type: admin_type_ss,
        admin_city: admin_city_ss,
        admin_country: admin_country_ss,
        admin_education: admin_education_ss,
        admin_join_date: admin_join_date_ss,
        admin_state: admin_state_ss,
        admin_zipcode: admin_zipcode_ss,
        admin_password: admin_password_ss,
        admin_passowrd_enq: admin_passowrd_enq_ss,
      },
    };

    const filterAdmin = {
      _id: admin_id_ss,
    };

    await ethi_admin.updateOne(filterAdmin, updateAdmin, {
      useFindAndModify: false,
    });

    return res.send({
      message: updated_success,
      error: false,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};

/**
 * UPDATE OWN PROFILE - Any admin can update their own profile
 * 
 * Purpose: Allow both super_admin and normal admin to update their own profile
 * Permission: Any logged-in admin
 * Validation: Ensures admin_id matches requester_admin_id (cannot update others)
 */
exports.update_own_profile = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    // 1) Get requester admin
    const requesterId = req.body.requester_admin_id;
    const adminIdToUpdate = req.body.admin_id;

    if (!requesterId) {
      return res.send({
        error: true,
        message: "requester_admin_id is required for this action",
      });
    }

    if (!adminIdToUpdate) {
      return res.send({
        error: true,
        message: "admin_id is required",
      });
    }

    // 2) Verify requester exists and is active
    const requester = await ethi_admin.findOne({
      _id: requesterId,
      flag: "c",
      allow_access: "1",
    });

    if (!requester) {
      return res.send({
        error: true,
        message: "Requester admin not found or inactive",
      });
    }

    // 3) ✅ CRITICAL: Admin can ONLY update their own profile
    if (requesterId !== adminIdToUpdate) {
      return res.send({
        error: true,
        message: "❌ You can only update your own profile. Use staff management to edit other admins.",
      });
    }

    console.log(`✅ ${requester.admin_name} updating own profile...`);

    // 4) Read profile fields from body
    const admin_email_ss = req.body.admin_email;
    const admin_name_ss = req.body.admin_name;
    const admin_mobile_no_ss = req.body.admin_mobile_no;
    const admin_city_ss = req.body.admin_city;
    const admin_country_ss = req.body.admin_country;
    const admin_education_ss = req.body.admin_education;
    const admin_join_date_ss = req.body.admin_join_date;
    const admin_state_ss = req.body.admin_state;
    const admin_zipcode_ss = req.body.admin_zipcode;
    const admin_password_ss = req.body.admin_password;
    let admin_image_ss = req.body.admin_old_image;
    const admin_passowrd_enq_ss = make_password(admin_password_ss);

    // 5) Prevent email duplication with other admins
    const query = {
      $and: [
        { admin_email: admin_email_ss },
        { flag: "c" },
        { _id: { $ne: adminIdToUpdate } },
      ],
    };

    const existing = await ethi_admin.find(query);
    if (existing && existing[0]) {
      return res.send({
        message: already_exists,
        error: true,
      });
    }

    // 6) If new image uploaded -> process and save with optimization
    if (req.files && req.files.admin_image) {
      console.log('📸 Processing admin profile image...');
      
      const imageResult = await processAndSaveImage(
        req.files.admin_image,
        '/ethi_doctor_image/',
        '_admin',
        {
          size: 'passport',        // 200x200 passport size
          quality: 85,             // Good quality
          format: 'jpeg',          // JPEG format
          oldImageName: admin_image_ss, // Delete old image
        }
      );

      if (imageResult.success) {
        admin_image_ss = imageResult.filename;
        console.log(`✅ Image saved: ${admin_image_ss}`);
      } else {
        console.error('❌ Image processing failed:', imageResult.error);
        return res.send({
          message: 'Failed to process image. Please try again.',
          error: true,
        });
      }
    }

    // 7) Update admin document (preserve role and is_super_admin)
    const updateAdmin = {
      $set: {
        admin_name: admin_name_ss,
        admin_mobile_no: admin_mobile_no_ss,
        admin_email: admin_email_ss,
        admin_image: admin_image_ss,
        admin_city: admin_city_ss,
        admin_country: admin_country_ss,
        admin_education: admin_education_ss,
        admin_join_date: admin_join_date_ss,
        admin_state: admin_state_ss,
        admin_zipcode: admin_zipcode_ss,
        admin_password: admin_password_ss,
        admin_passowrd_enq: admin_passowrd_enq_ss,
      },
    };

    const filterAdmin = {
      _id: adminIdToUpdate,
    };

    await ethi_admin.updateOne(filterAdmin, updateAdmin, {
      useFindAndModify: false,
    });

    console.log(`✅ Profile updated successfully: ${admin_name_ss}`);

    return res.send({
      message: "Profile updated successfully! 👤",
      error: false,
    });
  } catch (error) {
    console.error("❌ Update Own Profile Error:", error);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};

// Retrieve all ethi_admin from the database.
exports.update_doctor = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const doctor_email_ss = req.body.doctor_email;
      const doctor_name_ss = req.body.doctor_name;
      const doctor_profession_ss = req.body.doctor_profession;
      const doctor_mobile_no_ss = req.body.doctor_mobile_no;
      const doctor_city_ss = req.body.doctor_city;
      const doctor_state_ss = req.body.doctor_state;
      const doctor_country_ss = req.body.doctor_country;
      const doctor_zipcode_ss = req.body.doctor_zipcode;

      const doctor_education_ss = req.body.doctor_education;
      const doctor_exp_years_ss = req.body.doctor_exp_years;
      const doctor_join_date_ss = req.body.doctor_join_date_ss;
      const doctor_about_us_ss = req.body.about_us;
      const doctor_leave_allow_ss = req.body.doctor_leave_allow;
      const doctor_password_ss = req.body.doctor_password;
      const doctor_id_ss = req.body.doctor_id;
      let doctor_image_ss = req.body.doctor_old_image;
      const doctor_passowrd_enq_ss = make_password(req.body.doctor_password);
      const doctor_goals = req.body.doctor_goals;
      const query = {
        $and: [
          { doctor_email: doctor_email_ss },
          { flag: "c" },
          { _id: { $ne: doctor_id_ss } }, // Replace your_id_value with the actual value you want to compare with
        ],
      };

      await ethi_doctor_master
        .find(query)
        .then(async (data) => {
          if (data[0]) {
            res.send({
              message: already_exists,
              error: true,
            });
          } else {
            
            // 📸 Process doctor image upload with optimization
            if (req.files && req.files.doctor_image_new) {
              console.log('📸 Processing doctor profile image...');
              
              const imageResult = await processAndSaveImage(
                req.files.doctor_image_new,
                '/ethi_doctor_image/',
                '_doctor',
                {
                  size: 'passport',        // 200x200 passport size
                  quality: 85,             // Good quality
                  format: 'jpeg',          // JPEG format
                  oldImageName: doctor_image_ss, // Delete old image
                }
              );

              if (imageResult.success) {
                doctor_image_ss = imageResult.filename;
                console.log(`✅ Doctor image saved: ${doctor_image_ss}`);
              } else {
                console.error('❌ Image processing failed:', imageResult.error);
                return res.send({
                  message: 'Failed to process image. Please try again.',
                  error: true,
                });
              }
            }
            
            const update2 = {
              $set: {
                doctor_name: doctor_image_ss,
              },
            };
            const update4 = {
              $set: {
                doctor_name: doctor_name_ss,
                doctor_admin_image: doctor_image_ss,
              },
            };
            const update3 = {
              $set: {
                doctor_name: doctor_name_ss,
                doctor_image: doctor_image_ss,
              },
            };
            const update5 = {
              $set: {
                doctor_name: doctor_name_ss,
                doctor_image: doctor_image_ss,
                doctor_tag: doctor_profession_ss,
              },
            };
            const filter2 = {
              doctor_id: doctor_id_ss,
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
            await ethi_appointment_with_doctor.updateMany(filter2, update5, {
              useFindAndModify: false,
            });

            const update = {
              $set: {
                doctor_name: doctor_name_ss,
                doctor_profession: doctor_profession_ss,
                doctor_image: doctor_image_ss,
                doctor_email: doctor_email_ss,
                doctor_mobile_no: doctor_mobile_no_ss,
                doctor_city: doctor_city_ss,
                doctor_state: doctor_state_ss,
                doctor_zipcode: doctor_zipcode_ss,
                doctor_country: doctor_country_ss,
                doctor_education: doctor_education_ss,
                doctor_exp_years: doctor_exp_years_ss,
                doctor_join_date: doctor_join_date_ss,
                doctor_about_us: doctor_about_us_ss,
                doctor_leave_allow: doctor_leave_allow_ss,
                doctor_password: doctor_password_ss,
                doctor_passowrd_enq: doctor_passowrd_enq_ss,
              },
            };
            const filter = {
              _id: doctor_id_ss,
            };
            await ethi_doctor_master
              .updateOne(filter, update, {
                useFindAndModify: false,
              })
              .then(async (savedCustomer) => {
                const result = await ethi_doctors_goals.deleteMany({
                  doctor_id: doctor_id_ss,
                });
                if(doctor_goals){
                  for (let i = 1; i < doctor_goals.length; i++) {
                    let main_goal = doctor_goals[i].split("~@~");
                    const ethi_supplement_master_ss = new ethi_doctors_goals({
                      entry_date: currentDatetime(),
                      doctor_id: doctor_id_ss,
                      goal_id: main_goal[0],
                      doctor_goal_name: main_goal[1],
                      doctor_goal_detail: main_goal[2],
                      doctor_goal_image: main_goal[3],
                      flag: "c",
                    });
  
                    ethi_supplement_master_ss.save();
                  }
                }
                
                res.send({
                  message: updated_success,
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
          }
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.get_quote = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      var condition2 = {
        flag: "c",
      };

      // Fetch data from Collection1 with condition
      const data_ethi_feeds_master = await ethi_corporate
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();
      const web_contactFormdata = await ethi_customer_web_form
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();
      const web_subscribeEmaildata = await ethi_customer_web_subscribe_email
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();

      // Fetch data from Collection1 with condition
      const data_query = await ethi_query_master
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();

      var responce = {
        data_ethi_feeds_master: data_ethi_feeds_master,
        web_contactFormdata: web_contactFormdata,
        web_subscribeEmaildata: web_subscribeEmaildata,
        data_query: data_query,
        data_query_image: data_query_image,
      };

      res.send({
        message: responce,
        error: false,
      });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
exports.get_leaves = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      var condition2 = {
        flag: "c",
      };

      // Fetch data from Collection1 with condition
      const data_ethi_feeds_master = await ethi_doctor_leave
        .find(condition2)
        .sort({ createdAt: -1 })
        .exec();

      res.send({
        message: data_ethi_feeds_master,
        error: false,
      });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
}; // Retrieve all ethi_admin from the database.

exports.update_leaves = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const reason_id = req.body.remarks;
      const status_for_id = req.body.status_for;
      const leave_id = req.body.leave_id;
      const doctor_id = req.body.doctor_id;
      const filter2 = {
        _id: leave_id,
        flag: "c",
      };

      const data_leave = await ethi_doctor_leave.find(filter2).exec();

      var condition = {
        flag: "c",
        _id: doctor_id,
      };

      // Fetch data from Collection1 with condition
      const data_doctor = await ethi_doctor_master.find(condition).exec();

      let allow_data =
        Number(data_doctor[0].doctor_leave_used) +
        Number(data_leave[0].leave_duration);

      if (
        allow_data > data_doctor[0].doctor_leave_allow &&
        status_for_id === "1"
      ) {
        res.send({
          message: error_msg,
          error: true,
        });
      } else {
        if (data_leave[0].status_for === "0") {
          const update5 = {
            $set: {
              remarks: reason_id,
              status_for: status_for_id,
            },
          };

          ethi_doctor_leave
            .updateMany(filter2, update5, {
              useFindAndModify: false,
            })
            .then(async (data) => {
              if (status_for_id === "1") {
                const update3 = {
                  $set: {
                    doctor_leave_used: allow_data,
                  },
                };
                const filter3 = {
                  _id: doctor_id,
                  flag: "c",
                };
                ethi_doctor_master
                  .updateMany(filter3, update3, {
                    useFindAndModify: false,
                  })
                  .then(async (data) => {
                    res.send({
                      message: updated_success,
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
              } else {
                res.send({
                  message: updated_success,
                  error: false,
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
        } else {
          res.send({
            message: already_done,
            error: true,
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
/**
 * ✅ ADD DOCTOR - Works for BOTH Super Admin AND Normal Admin
 * 
 * Permission: Super Admin + Normal Admin
 * Validates: Doctor email must be unique
 */
exports.add_doctor = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    // ✅ Optional: Verify requester is logged in admin (super_admin OR admin)
    const requesterId = req.body.requester_admin_id;
    
    if (requesterId) {
      const requester = await ethi_admin.findOne({
        _id: requesterId,
        flag: "c",
        allow_access: "1"
      });
      
      if (!requester) {
        return res.send({
          error: true,
          message: "Invalid admin session. Please login again.",
        });
      }
      
      // ✅ Both super_admin and admin can add doctors
      console.log(`✅ Doctor being added by: ${requester.admin_name} (${requester.role || requester.admin_type})`);
    }

    // Extract doctor data
    const doctor_email_ss = req.body.doctor_email;
    const doctor_name_ss = req.body.doctor_name;
    const doctor_profession_ss = req.body.doctor_profession;
    const doctor_mobile_no_ss = req.body.doctor_mobile_no;
    const doctor_city_ss = req.body.doctor_city;
    const doctor_state_ss = req.body.doctor_state;
    const doctor_country_ss = req.body.doctor_country;
    const doctor_zipcode_ss = req.body.doctor_zipcode;
    const doctor_education_ss = req.body.doctor_education;
    const doctor_exp_years_ss = req.body.doctor_exp_years;
    const doctor_join_date_ss = req.body.doctor_join_date_ss;
    const doctor_about_us_ss = req.body.about_us;
    const doctor_leave_allow_ss = req.body.doctor_leave_allow;
    const doctor_password_ss = req.body.doctor_password;
    const doctor_passowrd_enq_ss = make_password(req.body.doctor_password);
    const doctor_goals = req.body.doctor_goals;

    let doctor_image_ss = "";

    // Check if doctor already exists
    const query = {
      $and: [
        { doctor_email: doctor_email_ss },
        { flag: "c" },
      ],
    };

    const existingDoctor = await ethi_doctor_master.find(query);

    if (existingDoctor && existingDoctor[0]) {
      return res.send({
        message: already_exists,
        error: true,
      });
    }

    // Handle image upload
    if (req.files?.doctor_image_new) {
      doctor_image_ss = upload_image(
        "_doctor",
        data_doctor_image,
        req.files.doctor_image_new
      );
    }

    // Create new doctor
    const ethi_doctor_master_data = new ethi_doctor_master({
      entry_date: currentDatetime(),
      doctor_name: doctor_name_ss,
      doctor_profession: doctor_profession_ss,
      doctor_image: doctor_image_ss,
      doctor_email: doctor_email_ss,
      doctor_mobile_no: doctor_mobile_no_ss,
      doctor_city: doctor_city_ss,
      doctor_state: doctor_state_ss,
      doctor_zipcode: doctor_zipcode_ss,
      doctor_country: doctor_country_ss,
      doctor_education: doctor_education_ss,
      doctor_exp_years: doctor_exp_years_ss,
      doctor_join_date: doctor_join_date_ss,
      doctor_about_us: doctor_about_us_ss,
      doctor_leave_allow: doctor_leave_allow_ss,
      doctor_leave_used: 0,
      doctor_password: doctor_password_ss,
      doctor_passowrd_enq: doctor_passowrd_enq_ss,
      allow_access: "1", // ✅ Changed to "1" so doctor can login immediately
      flag: "c",
    });

    const savedDoctor = await ethi_doctor_master_data.save();

    // Save doctor goals
    if (doctor_goals && doctor_goals.length > 1) {
      for (let i = 1; i < doctor_goals.length; i++) {
        let main_goal = doctor_goals[i].split("~@~");
        const ethi_supplement_master_ss = new ethi_doctors_goals({
          entry_date: currentDatetime(),
          doctor_id: savedDoctor._id,
          goal_id: main_goal[0],
          doctor_goal_name: main_goal[1],
          doctor_goal_detail: main_goal[2],
          doctor_goal_image: main_goal[3],
          flag: "c",
        });

        await ethi_supplement_master_ss.save();
      }
    }

    console.log(`✅ Doctor created: ${doctor_name_ss} (${doctor_email_ss})`);

    return res.send({
      message: save_success,
      error: false,
    });
  } catch (err) {
    console.error("❌ Add Doctor Error:", err);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};


// Retrieve all ethi_admin from the database.
exports.get_all_staff = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      var condition = {
        flag: "c",
      };

      // Fetch data from Collection1 with condition
      const data_goal = await ethi_goals_master
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();

      // Fetch data from Collection1 with condition
      const data_doctor = await ethi_doctor_master
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();

      const data_doctor_goals = await ethi_doctors_goals
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();

      // Combine the results into a single object
      const responseData = {
        data_doctor,
        data_doctor_image,
        data_doctor_goals,
        data_goal,
      };

      res.send({
        message: responseData,
        error: false,
      });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Retrieve all ethi_admin from the database.
// Get admin list (role-based)
// - SUPER_ADMIN  => sees all admins
// - ADMIN        => sees only his own record
exports.get_all_admin = async (req, res) => {
  if (!req.body) {
    return res.send({
      message: post_empty,
      error: true,
    });
  }

  try {
    const requester = await getRequesterAdmin(req, res);
    if (!requester) {
      // error already sent
      return;
    }

    let condition = {
      flag: "c",
    };

    // ✅ Check if requester is super_admin (lowercase)
    const isSuper = requester.role === "super_admin" || 
                    requester.admin_type === "super_admin" ||
                    requester.is_super_admin === true;

    // SUPER_ADMIN => sees all admins (including themselves)
    // Normal ADMIN => sees only themselves
    if (!isSuper) {
      condition._id = requester._id;
    }

    const data_admin = await ethi_admin
      .find(condition)
      .sort({ createdAt: -1 })
      .exec();

    console.log(`✅ ${requester.admin_name} viewing ${data_admin.length} admin(s)`);

    const responseData = {
      data_admin,
      data_doctor_image,
    };

    return res.send({
      message: responseData,
      error: false,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      message: error_msg,
      error: true,
    });
  }
};


exports.upload_supplements = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const admin_id = req.body.admin_id;
      let image_for_supplement_new = "";
      let image_for_remember_new = "";
      let image_for_food_new = "";
      const targetDir = `${__dirname.split("controllers")[0]}`;
      let filePath = targetDir + "assets" + data_csv_doctor;
      let firstHeading = "";

      if (req.files?.image_for_supplement_new !== undefined) {
        image_for_supplement_new = upload_image(
          "_doctor_supplement",
          data_csv_doctor,
          req.files.image_for_supplement_new
        );

        image_for_supplement_new = filePath + image_for_supplement_new;

        fs.createReadStream(image_for_supplement_new)
          .pipe(csv())
          .on("headers", (headers) => {
            firstHeading = headers[0]; // Access the first heading (column name)
          })
          .on("data", async (row) => {
            const query = {
              $and: [{ supplement_name: row[firstHeading] }],
            };

            ethi_supplement_master
              .find(query)
              .then((data) => {
                if (!data[0]) {
                  const ethi_supplement_master_ss = new ethi_supplement_master({
                    entry_date: currentDatetime(),
                    doctor_id: admin_id,
                    supplement_name: row[firstHeading],
                    flag: "c",
                  });

                  ethi_supplement_master_ss.save();
                }
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .on("end", () => {});
      }
      if (req.files?.image_for_remember_new !== undefined) {
        image_for_remember_new = upload_image(
          "_doctor_remember",
          data_csv_doctor,
          req.files.image_for_remember_new
        );

        image_for_remember_new = filePath + image_for_remember_new;

        fs.createReadStream(image_for_remember_new)
          .pipe(csv())
          .on("headers", (headers) => {
            firstHeading = headers[0]; // Access the first heading (column name)
          })
          .on("data", async (row) => {
            const query = {
              $and: [{ remember_name: row[firstHeading] }],
            };

            ethi_remember_master
              .find(query)
              .then((data) => {
                if (!data[0]) {
                  const ethi_supplement_master_ss = new ethi_remember_master({
                    entry_date: currentDatetime(),
                    doctor_id: admin_id,
                    remember_name: row[firstHeading],
                    flag: "c",
                  });

                  ethi_supplement_master_ss.save();
                }
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .on("end", () => {});
      }
      if (req.files?.image_for_food_new !== undefined) {
        image_for_food_new = upload_image(
          "_doctor_food",
          data_csv_doctor,
          req.files.image_for_food_new
        );

        image_for_food_new = filePath + image_for_food_new;

        fs.createReadStream(image_for_food_new)
          .pipe(csv())
          .on("headers", (headers) => {
            firstHeading = headers[0]; // Access the first heading (column name)
          })
          .on("data", async (row) => {
            const query = {
              $and: [{ food_name: row[firstHeading] }],
            };

            ethi_food_master
              .find(query)
              .then((data) => {
                if (!data[0]) {
                  const ethi_supplement_master_ss = new ethi_food_master({
                    entry_date: currentDatetime(),
                    doctor_id: admin_id,
                    food_name: row[firstHeading],
                    flag: "c",
                  });

                  ethi_supplement_master_ss.save();
                }
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .on("end", () => {});
      }

      res.send({
        message: save_success,
        error: false,
      });
    } catch (error) {
      console.log(error);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.get_admin_by_single = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const admin_id = req.body.admin_id;

      var condition = {
        flag: "c",
        _id: admin_id,
      };

      var condition1 = {
        flag: "c",
      };
      // Fetch data from Collection1 with condition
      const data_admin = await ethi_admin
        .find(condition)
        .sort({ createdAt: -1 })
        .exec();
      const data_feedback = await ethi_doctor_feedback
        .find(condition1)
        .sort({ createdAt: -1 })
        .exec();
      // Combine the results into a single object

      const responseData = {
        data_admin,
        data_feedback,
        data_doctor_image,
      };
      res.send({
        message: responseData,
        error: false,
      });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

// Delete data
exports.delete_master_data = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const id_delete = req.body.id_for_delete;
      const flag_for = req.body.flag_for;
      const for_status_final = req.body.for_status_final;
      const update1 = {
        $set: {
          flag: "d",
        },
      };
      const update2 = {
        $set: {
          status_for: for_status_final,
        },
      };
      const update3 = {
        $set: {
          approve_status: for_status_final,
        },
      };

      const update4 = {
        $set: {
          last_doctor_id: for_status_final,
        },
      };

      const update5 = {
        $set: {
          allow_access: for_status_final,
        },
      };
      const update7 = {
        $set: {
          popular_type: for_status_final,
        },
      };

      const update6 = {
        $set: {
          status_for_complete: "1",
        },
      };

      const filter1 = {
        _id: id_delete,
      };

      const filter2 = {
        _id: for_status_final,
      };

      if (flag_for == "1") {
        ethi_goals_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
            });
          });
      } else if (flag_for == "2") {
        ethi_front_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "3") {
        ethi_testmonial
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "4") {
        ethi_faq_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "5") {
        ethi_package_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "6") {
        ethi_package_master
          .updateOne(filter1, update2, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "7") {
        ethi_feeds_master
          .updateOne(filter1, update3, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "8") {
        ethi_customers
          .updateOne(filter1, update4, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "9") {
        ethi_help_center_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "10") {
        ethi_quote_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "11") {
        ethi_video_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "12") {
        ethi_admin
          .updateOne(filter1, update5, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "13") {
        ethi_doctor_master
          .updateOne(filter1, update5, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "14") {
        ethi_notification_master
          .updateOne(filter1, update1, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
              error: false,
            });
          })
          .catch((err) => {
            console.log(err);
            res.send({
              message: error_empty,
              error: true,
            });
          });
      } else if (flag_for == "15") {
        ethi_appointment_with_doctor
          .updateOne(filter1, update6, {
            useFindAndModify: false,
          })
          .then(async (savedCustomer) => {
            const ethi_subscription_plan_data = await ethi_subscription_plan
              .find(filter2)
              .exec();

            let like_count = ethi_subscription_plan_data[0].no_of_calling + 1;
            let customer_id_for = ethi_subscription_plan_data[0].customer_id;
            let update7 = {
              $set: {
                no_of_calling: like_count,
              },
            };

            ethi_subscription_plan
              .updateOne(filter2, update7, {
                useFindAndModify: false,
              })
              .then(async (savedCustomer) => {
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
                  customer_mobile_no_dd =
                    data_customers_data[0].customer_mobile_no;
                }

                const requestBody = {
                  template_name: "appoint_done",
                  broadcast_name: "appoint_done",
                  receivers: [
                    {
                      whatsappNumber: customer_mobile_no_dd.replace(/\+/g, ""),
                      customParams: [],
                    },
                  ],
                };

                //wati hit data
                sendwatitemplete(requestBody);

                res.send({
                  message: done_empty,
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
      } else if (flag_for == "16") {
        ethi_help_center_master
          .updateOne(filter1, update7, {
            useFindAndModify: false,
          })
          .then((savedCustomer) => {
            res.send({
              message: done_empty,
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
      } else {
        res.send({
          message: error_msg,
          error: true,
        });
      }
    } catch (error) {
      console.log(error);
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
    const path_name = targetDir + "assets" + path_name_only + image_name;

    console.log("📸 Uploading Image:");
    console.log("  - Filename:", image_name);
    console.log("  - Target Path:", path_name);
    console.log("  - File Size:", image_file.size, "bytes");

    image_file.mv(path_name, (err) => {
      if (err) {
        console.error("❌ Image Upload Error:", err);
        console.error("  - Failed Path:", path_name);
      } else {
        console.log("✅ Image uploaded successfully:", image_name);
      }
    });
  } catch (error) {
    console.error("❌ Upload Function Error:", error);
  }

  return image_name;
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

async function send_to_topic(to, title, message, image) {
  const res = {
    data: {
      title: title,
      message: message,
      android_channel_id: "channel",
      image: image,
      target: "",
      timestamp: new Date().toISOString(),
    },
  };
  const fields = {
    to: "/topics/" + to,
    data: res,
  };

  try {
    const result = await sendPushNotification(fields);
  } catch (error) {
    console.log(error);
    //erro
  }
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

function convertinsec(date_show, time_shoe) {
  let make_time = add_time(time_shoe, 15);

  let make_date = date_show + " " + make_time + ":00";
  const date1 = new Date();
  const date2 = new Date(make_date);

  const differenceInSeconds = (date2 - date1) / 1000;

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
  } catch (error) {
    console.log(error);
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
