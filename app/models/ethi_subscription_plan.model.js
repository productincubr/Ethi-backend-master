module.exports = mongoose => {
    const ethi_subscription_plan = mongoose.model(
      "ethi_subscription_plan",
      mongoose.Schema({
        entry_date: String,
        doctor_id: String,
        doctor_name: String,
        doctor_image: String,
        customer_id: String,
        customer_name: String,
        customer_mobile_no: String,
        customer_image: String,
        package_id: String,
        package_start_date: String,
        package_end_date: String,
        no_of_calling: String,
        complete_calling: String,
        payment_amount: String,
        payment_mode: String,
        order_id: String,
        payment_id: String,
        payment_status: String,
        invoice_pdf: String,
        renew_status: String,    //c    update d
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_subscription_plan;
  };
  