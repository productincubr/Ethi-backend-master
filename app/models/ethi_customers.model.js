module.exports = (mongoose) => {
  const ethi_customers = mongoose.model(
    "ethi_customers",
    mongoose.Schema(
      {
        entry_date: String,
        customer_name: String,
        customer_mobile_no: String,
        mobile_no_without_zip: String,
        customer_email: String,
        customer_image: String,
        date_of_birth: String,
        gender: String,
        height_fit: String,
        height_cm: String,
        weight_kg: String,
        weight_lbs: String,
        blood_group: String,
        address: String,
        pincode: String,
        city: String,
        state: String,
        contry: String,
        feeling_type: String,
        send_msg_flag: String,
        receive_msg_flag: String,
        last_msg_send: String,
        last_msg_time: String,
        firebase_token: String,
        choose_goal: String,
        hours_water: String,
        sleep_hour: String,
        step_count: String,
        heart_rate: String,
        login_type: String,
        login_id: String,
        login_token: String,
        package_select_status: String,
        package_id: String,
        last_subscription_id: String,
        last_doctor_id: String,
        package_start_date: String,
        package_end_date: String,
        period_start_date: String,
        period_end_date: String,
        period_days: String,
        referred_by: { type: String, default: null },
        description: { type: String, default: null },
        add_by: { type: String, default: null },
        call_flag: { type: String, default: 0 }, // 1 means call
        Comment: { type: String, default: null },
        response_by: { type: String, default: 0 }, // 0 means positive 1 means nagative
        customer_disease: { type: String, default: null },
        otp: String,
        login_step: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_customers;
};
