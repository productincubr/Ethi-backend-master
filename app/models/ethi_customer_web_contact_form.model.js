module.exports = (mongoose) => {
  const ethi_customer_web_form = mongoose.model(
    "ethi_customer_web_contact_form",
    mongoose.Schema(
      {
        entry_date: String,
        fullName: String,
        email: String,
        phoneNo: String,
        flag: String,
      },
      {
        timestamps: true,
      }
    )
  );

  return ethi_customer_web_form;
};
