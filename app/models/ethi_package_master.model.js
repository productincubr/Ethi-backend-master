
module.exports = mongoose => {
    const ethi_package_master = mongoose.model(
      "ethi_package_master",
      mongoose.Schema({
        entry_date: String,
        package_name: String,
        package_price: String,
        package_month_plan: String,
        package_days: String,
        no_of_calling: String,
        first_facility: String,
        sec_facility: String,
        thrid_facility: String,
        four_facility: String,
        five_facility: String,
        status_for: String,
        flag: String,
      },
      {
        timestamps: true, 
      })
    );
  
    return ethi_package_master;
  };
  