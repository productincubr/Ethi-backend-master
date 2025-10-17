module.exports = mongoose => {
  const ethi_corporate = mongoose.model(
    "ethi_corporate",
    mongoose.Schema({
      entry_date: String,
      customer_name: String,
      company_name: String,
      work_email_id: String,
      mobile_no: String,
      no_of_employee: String,
      status_for_check: String,
      flag: String
    },
    {
      timestamps: true, 
    })
  );


  return ethi_corporate;
};
