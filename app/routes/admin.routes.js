module.exports = app => {
    const admin_link = require("../controllers/admin.controller.js");
    const web_link = require("../controllers/wati.controller.js");
    var router = require("express").Router();


    // Create a new ethi_admin
    router.post("/login_to_superadmin", admin_link.login_to_superadmin);
    router.post("/welcome_page", admin_link.welcome_page);
    router.post("/delete_master_data", admin_link.delete_master_data);
    router.post("/create_appointments_by_admin", admin_link.create_appointments_by_admin);
    router.post("/goal_master_save", admin_link.goal_master_save);

    router.post("/ethi_front_master", admin_link.ethi_front_master_save);
    router.post("/ethi_testmonial_master", admin_link.ethi_testmonial_master_save);
    router.post("/ethi_faq_master", admin_link.ethi_faq_master_save);
    router.post("/ethi_package_master", admin_link.ethi_package_master_save);
    router.post("/update_admin_master", admin_link.update_admin_master_save);

    router.post("/setting_page_master", admin_link.setting_page_master);
   
    router.post("/get_all_notification", admin_link.get_all_notification);
    router.post("/post_notification", admin_link.post_notification);
    router.post("/ethi_help_center_master", admin_link.ethi_help_center_master);
    router.post("/ethi_quote_master_post", admin_link.ethi_quote_master_post);
    router.post("/post_video_libery", admin_link.post_video_libery);
    router.post("/change_password_admin_save", admin_link.change_password_admin_save);
    router.post("/ethi_query_master_get", admin_link.ethi_query_master_get);

    router.post("/add_staff", admin_link.add_staff);
    router.post("/add_doctor", admin_link.add_doctor);
    router.post("/get_all_staff", admin_link.get_all_staff);
    router.post("/get_all_admin", admin_link.get_all_admin);
    router.post("/update_staff", admin_link.update_staff);
    router.post("/update_own_profile", admin_link.update_own_profile);
    router.post("/update_doctor", admin_link.update_doctor);

    router.post("/get_quote", admin_link.get_quote);
    router.post("/get_leaves", admin_link.get_leaves);
    router.post("/update_leaves", admin_link.update_leaves);

   
    router.get("/send_test_node", admin_link.send_test_node);
    router.post("/upload_supplements", admin_link.upload_supplements);
    router.post("/get_admin_by_single", admin_link.get_admin_by_single);
    router.post("/ethi_customer_update_call_flag", web_link.ethi_customer_update_call_flag);
   
    app.use('/api/admin_link', router);
};