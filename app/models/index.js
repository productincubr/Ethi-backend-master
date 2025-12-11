const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.uri = dbConfig.uri;
db.ethi_admin = require("./ethi_admin.model.js")(mongoose);
db.ethi_super_admin = require("./ethi_super_admin.model.js")(mongoose);
db.ethi_customers = require("./ethi_customers.model.js")(mongoose);
db.ethi_corporate = require("./ethi_corporate.model.js")(mongoose);
db.ethi_goals_master = require("./ethi_goals_master.model.js")(mongoose);
db.ethi_customers_goals = require("./ethi_customers_goals.model.js")(mongoose);
db.ethi_front_master = require("./ethi_front_master.model.js")(mongoose);
db.ethi_admin_master = require("./ethi_admin_master.model.js")(mongoose);
db.ethi_testmonial = require("./ethi_testmonial.model.js")(mongoose);
db.ethi_faq_master = require("./ethi_faq_master.model.js")(mongoose);
db.ethi_package_master = require("./ethi_package_master.model.js")(mongoose);


db.ethi_doctor_master = require("./ethi_doctor_master.model.js")(mongoose);
db.ethi_appointment_with_doctor = require("./ethi_appointment_with_doctor.model.js")(mongoose);
db.ethi_subscription_plan = require("./ethi_subscription_plan.model.js")(mongoose);
db.ethi_feeds_master = require("./ethi_feeds_master.model.js")(mongoose);
db.ethi_doctor_diet_plan = require("./ethi_doctor_diet_plan.model.js")(mongoose);
db.ethi_supplements = require("./ethi_supplements.model..js")(mongoose);
db.ethi_customer_web_form = require("./ethi_customer_web_contact_form.model.js")(mongoose);
db.ethi_customer_web_subscribe_email = require("./ethi_ customer_web_subscribe_email.model.js")(mongoose);
db.ethi_points_to_remember = require("./ethi_points_to_remember.model.js")(mongoose);
db.ethi_customers_document = require("./ethi_customers_document.model.js")(mongoose);
db.ethi_customers_assesment = require("./ethi_customers_assesment.model.js")(mongoose);
db.ethi_doctor_leave = require("./ethi_doctor_leave.model.js")(mongoose);
db.ethi_notification_master = require("./ethi_notification_master.model.js")(mongoose);
db.ethi_help_center_master = require("./ethi_help_center_master.model.js")(mongoose);
db.ethi_quote_master = require("./ethi_quote_master.model.js")(mongoose);
db.ethi_video_master = require("./ethi_video_master.model.js")(mongoose);
db.ethi_query_master = require("./ethi_query_master.model.js")(mongoose);
db.ethi_feeds_like = require("./ethi_feeds_like.model.js")(mongoose);
db.ethi_feeds_bookmark = require("./ethi_feeds_bookmark.model.js")(mongoose);
db.ethi_progress_diet_plan = require("./ethi_progress_diet_plan.model.js")(mongoose);
db.ethi_supplement_master = require("./ethi_supplement_master.model.js")(mongoose);
db.ethi_food_master = require("./ethi_food_master.model.js")(mongoose);
db.ethi_remember_master = require("./ethi_remember_master.model.js")(mongoose);
db.ethi_doctors_goals = require("./ethi_doctors_goals.model.js")(mongoose);
db.ethi_doctor_feedback = require("./ethi_doctor_feedback.model.js")(mongoose);
db.ethi_customer_wati_temp = require("./ethi_customer_wati_temp.model.js")(mongoose);

// ✅ NEW: access request model
db.ethi_access_request = require("./ethi_access_request.model.js")(mongoose);


module.exports = db;

