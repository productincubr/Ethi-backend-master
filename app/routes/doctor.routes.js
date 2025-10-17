module.exports = (app) => {
  const doctor_link = require("../controllers/doctor.controller.js");
  const wati_link = require("../controllers/wati.controller.js");
  var router = require("express").Router();

  // Create a new doctor login
  router.post("/login_to_doctor", doctor_link.login_to_doctor);

  router.post("/welcome_doctor", doctor_link.welcome_doctor);
  router.post(
    "/create_appointments_by_doctor",
    doctor_link.create_appointments_by_doctor
  );
  router.post(
    "/create_patient_by_doctor",
    doctor_link.create_patient_by_doctor
  );
  router.post("/my_patients_doctor", doctor_link.my_patients_doctor);
  router.post("/post_doctor_save", doctor_link.post_doctor_save);
  router.post("/post_doctor_get", doctor_link.post_doctor_get);
  router.post(
    "/my_patients_full_details_doctor",
    doctor_link.my_patients_full_details_doctor
  );
  router.post("/my_patients_data_single", doctor_link.my_patients_data_single);
  router.post(
    "/assesment_form_patients_save",
    doctor_link.assesment_form_patients_save
  );
  router.post("/diet_form_patients_save", doctor_link.diet_form_patients_save);

  router.post("/get_doctor_by_single", doctor_link.get_doctor_by_single);
  router.post("/post_doctor_save_single", doctor_link.post_doctor_save_single);
  router.post("/post_leave_request_save", doctor_link.post_leave_request_save);
  router.post("/change_password_save", doctor_link.change_password_save);

  router.post(
    "/cancel_appointment_by_doctor",
    doctor_link.cancel_appointment_by_doctor
  );

  router.post("/get_last_appointment", doctor_link.get_last_appointment);
  router.post("/update_water_sleep", doctor_link.update_water_sleep);
  router.post("/get_booking_data", doctor_link.get_booking_data);
  router.post("/update_period", doctor_link.update_period);
  router.post("/post_customer_sms", doctor_link.post_customer_sms);
  router.post(
    "/save_ethi_doctor_feedback",
    doctor_link.save_ethi_doctor_feedback
  );
  router.post("/get_package_data", doctor_link.get_package_data);
  router.post(
    "/submit_pre_payment_call_website",
    wati_link.submit_pre_payment_call_website
  );
  router.post(
    "/get_booking_data_by_customer",
    doctor_link.get_booking_data_by_customer
  );

  //admin Doctor
  router.post(
    "/get_appointment_by_doctor",
    doctor_link.get_appointment_by_doctor
  );
  router.post(
    "/send_pdf_diet_by_customer",
    doctor_link.send_pdf_diet_by_customer
  );
  router.post(
    "/update_patient_by_doctor",
    doctor_link.update_patient_by_doctor
  );
  //admin Doctor

  app.use("/api/doctor_link", router);
};
