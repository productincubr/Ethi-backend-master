module.exports = (mongoose) => {
  const ethi_appointment_with_doctor = mongoose.model(
    "ethi_appointment_with_doctor",
    mongoose.Schema(
      {
        entry_date: String,
        doctor_id: String,
        subscription_id: String,
        doctor_name: String,
        doctor_tag: String,
        doctor_image: String,
        customer_id: String,
        customer_name: String,
        customer_mobile_no: String,
        customer_image: String,
        booking_date: String,
        booking_start_time: String,
        booking_end_time: String,
        which_no_booking: String,
        diet_plan_status: String,
        occurrence: { type: String, default: null },
        category: { type: String, default: null },
        description: { type: String, default: null },
        assesment_form_status: String,
        token_agora: String,
        status_for_complete: String, //0 means pending 1 means complete 2 means cancel 3 means upcoming
        book_by: String, //0 means pending 1 means complete 2 means cancel
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_appointment_with_doctor;
};
