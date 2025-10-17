module.exports = mongoose => {
    const ethi_customer_web_subscribe_email= mongoose.model(
        "ethi_customer_web_subscribe_email",
        mongoose.Schema({
          entry_date: String,
          email: String,
          flag: String,  
        },
        {
            timestamps: true,
        })
    );

    return ethi_customer_web_subscribe_email;
};
