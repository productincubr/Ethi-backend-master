module.exports = (mongoose) => {
  const ethi_admin_master = mongoose.model(
    "ethi_admin_master",
    mongoose.Schema(
      {
        entry_date: String,
        doctor_image: String,
        doctor_detail: String,
        apple_image: String,
        apple_detail: String,
        front_first_card_per: String,
        front_first_card_detail: String,
        front_sec_card_per: String,
        front_sec_card_detail: String,
        front_third_card_per: String,
        front_third_card_detail: String,
        front_four_card_per: String,
        front_four_card_detail: String,
        front_video_link: String,
        front_video_text: String,
        front_why_us: String,
        front_calling_no: String,
        flag: String,
      },
      {
        timestamps: true, 
      }
    )
  );

  return ethi_admin_master;
};
