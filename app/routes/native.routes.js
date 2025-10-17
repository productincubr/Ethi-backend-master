module.exports = app => {
    const native_link = require("../controllers/native.controller.js");

    var router = require("express").Router();


    // Login to application
    router.post("/login_to_application", native_link.login_to_application);
    // SignUp to application
    router.post("/signup_to_application", native_link.signup_to_application);
    // SignUp to Corporate
    router.post("/signup_to_corporate", native_link.signup_to_corporate);
    router.post("/goal_master_data", native_link.goal_master_data);
    router.post("/update_customer_goal", native_link.update_customer_goal);
    router.post("/get_front_master_and_goal", native_link.get_front_master_and_goal);
    router.post("/get_package_master", native_link.get_package_master);
    router.post("/submit_pre_payment", native_link.submit_pre_payment);
    router.post("/submit_final_payment", native_link.submit_final_payment);
    router.post("/get_feed_doctor_admin", native_link.get_feed_doctor_admin);
    router.post("/update_ethi_feeds_like", native_link.update_ethi_feeds_like);
    router.post("/update_ethi_feeds_bookmark", native_link.update_ethi_feeds_bookmark);
    router.post("/get_my_doctor_data", native_link.get_my_doctor_data);
    router.post("/get_my_profile_data", native_link.get_my_profile_data);
    router.post("/get_home_profile_data", native_link.get_home_profile_data);
    router.post("/update_feeling_type", native_link.update_feeling_type);
    router.post("/get_my_dietplan_data", native_link.get_my_dietplan_data);
    router.post("/update_dietplan_data", native_link.update_dietplan_data);
    router.post("/get_package_details", native_link.get_package_details);
    router.post("/book_appointment", native_link.book_appointment);
    router.post("/get_last_booking_data", native_link.get_last_booking_data);
    router.post("/upload_document", native_link.upload_document);
    router.post("/get_my_plan", native_link.get_my_plan);
    router.post("/get_all_documents", native_link.get_all_documents);
    router.post("/delete_documents", native_link.delete_documents);
    router.post("/my_bookmark", native_link.my_bookmark);
    router.post("/help_center_data", native_link.help_center_data);
    router.post("/submit_contact_us", native_link.submit_contact_us);
    router.post("/submit_profile_data", native_link.submit_profile_data);
    router.post("/get_feed_native", native_link.get_feed_native);
    router.post("/get_all_notification", native_link.get_all_notification);
    router.post("/signup_to_application_google", native_link.signup_to_application_google);
    router.post("/update_msg_customer", native_link.update_msg_customer);
    router.post("/update_login_data", native_link.update_login_data);
    router.get("/check_doctor_id", native_link.check_doctor_id);
    router.get("/delete_account_2", native_link.delete_account);



    router.post("/get_meeting_datetime", native_link.get_meeting_datetime);

    app.use('/api/native_link', router);
};