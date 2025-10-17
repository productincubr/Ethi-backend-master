module.exports = mongoose => {
  const ethi_front_master = mongoose.model(
    "ethi_front_master",
    mongoose.Schema({
      entry_date: String,
      front_name: String,
      front_detail: String,
      front_image: String,
      front_icon_image: String,
      flag: String
    },
    {
      timestamps: true, 
    })
  );


  return ethi_front_master;
};
