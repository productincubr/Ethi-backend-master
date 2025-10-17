module.exports = (mongoose) => {
  const ethi_customers_document = mongoose.model(
    "ethi_customers_document",
    mongoose.Schema({
      entry_date: String,
      customer_id: String,
      package_id: String,
      doctor_id: String,
      document_data: String,
      flag: String,
    },
    {
      timestamps: true, 
    })
  );

  return ethi_customers_document;
};
