const db = require("../models");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const apiKey_wati = process.env.WATI_API_KEY;
const ethi_customers = db.ethi_customers;
const ethi_goals_master = db.ethi_goals_master;
const ethi_customers_goals = db.ethi_customers_goals;
const ethi_customer_wati_temp = db.ethi_customer_wati_temp;
const ethi_subscription_plan = db.ethi_subscription_plan;
const ethi_package_master = db.ethi_package_master;
const ethi_appointment_with_doctor = db.ethi_appointment_with_doctor;
const ethi_doctor_master = db.ethi_doctor_master;
const apiUrl_wati = process.env.WATI_API_URL;
let website_link = process.env.WEBSITE_LINK;
let api_website_link_wati = process.env.API_WEBSITE_LINK;
const payment_page_link = website_link + "customerpayment/";
const success_url =
  api_website_link_wati + "successpaymenthitdata?subscription_id=";
const cancel_url = website_link + "errorinpage/";
const agrora_link = website_link + "customervideocall/";
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;
const channelName = process.env.AGORA_CHANNEL_NAME;
const options = {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

function currentDatetime() {
  const currentDate = new Date();
  const currentDateTime = currentDate
    .toLocaleString("en-IN", options)
    .replace(",", "");
  return currentDateTime;
}

const error_msg = "Something Went Wrong, Please Try Again.";
const post_empty = "Content can not be empty!.";
const mobile_no_already_exists = "Mobile No Already Present. Please Login.";
const save_success = "Successfully Saved";
const doctor_busy = "Doctor Is Busy That Time Please Choose Another Time.";

//code by shubham jain
//add data to request from wati server
exports.add_customer_by_wati = async (req, res) => {
  console.log("err 2");
  if (!req.body) {
    res.send({ message: post_empty });
  } else {
    try {
      const user_customer_mobile_no_plus = req.body.waId;
      const user_customer_mobile_nowaId = req.body.waId;
      const countryCode = user_customer_mobile_no_plus.substring(0, 2);
      let user_customer_mobile_no_without_zip =
        user_customer_mobile_no_plus.substring(2);
      if (countryCode != "91") {
        user_customer_mobile_no_without_zip =
          user_customer_mobile_no_plus.substring(3);
      }
      const login_type_id = "normal";
      const customer_name_user = req.body.senderName;
      const show_text = req.body.text;
      const show_ticketId = req.body.ticketId;
      const show_conversationId = req.body.conversationId;
      const show_whatsappMessageId = req.body.whatsappMessageId;
      const show_replyContextId = req.body.replyContextId;
      let customer_disease = "";
      let step = 0; //means customer add
      let customer_book_date_dd = "";
      let customer_email_dd = "";
      let customer_book_start_time_dd = "";
      let customer_book_end_time_dd = "";

      if (req.body.type === "interactive") {
        step = 1; //means customer add
        customer_disease = req.body.listReply.title;
      }
      if (show_text != null) {
        

        if (show_text.includes("Thank you so much")) {
          // Regular expressions to match email, date, and time
          const emailRegex = /Email\s*:\s*([^\n]+)/;
          const dateRegex = /Date\s*:\s*([^\n]+)/;
          const timeRegex = /Time\s*:\s*([^\n]+)/;
          step = 2; // data is selected and update to booking
          // Extract email, date, and time
          const emailMatch = show_text.match(emailRegex);
          const dateMatch = show_text.match(dateRegex);
          const timeMatch = show_text.match(timeRegex);

          // Extracted values
          customer_email_dd = emailMatch ? emailMatch[1].trim() : null;
          customer_book_date_dd = dateMatch ? dateMatch[1].trim() : null;
          if (timeMatch) {
            const [startTime, endTime] = timeMatch[1].trim().split(" - ");
            customer_book_start_time_dd = convert12HourTo24Hour(startTime);
            customer_book_end_time_dd = convert12HourTo24Hour(endTime);
          }
        }
      }

      if (step !== 0) {
        const ethi_customers_ss22 = new ethi_customer_wati_temp({
          entry_date: currentDatetime(),
          whatsappMessageId: show_whatsappMessageId,
          conversationId: show_conversationId,
          ticketId: show_ticketId,
          text_add: show_text,
          customer_id: "0",
          customer_mobile_no: user_customer_mobile_no_plus,
          customer_name: customer_name_user,
          customer_email: customer_email_dd,
          customer_book_date: customer_book_date_dd,
          customer_book_start_time: customer_book_start_time_dd,
          customer_book_end_time: customer_book_end_time_dd,
          listReply: customer_disease,
          replyContextId: show_replyContextId,
          booking_step: step,
          flag: "c",
        });
        await ethi_customers_ss22.save();
      }

      if (step === 1) {
        create_customer_data(
          customer_name_user,
          user_customer_mobile_no_plus,
          user_customer_mobile_no_without_zip,
          login_type_id,
          customer_disease,
          res
        );
      } else if (step === 2) {
        let query = {
          $and: [
            {
              customer_mobile_no: user_customer_mobile_no_plus,
            },
            {
              login_type: login_type_id,
            },
            // Add more conditions as needed
          ],
        };

        ethi_customers
          .findOne(query)
          .then(async (existingCustomer) => {
            let customer_id_dd = existingCustomer._id;
            let customer_name_user = existingCustomer.customer_name;
            let customer_image_dd = existingCustomer.customer_image;
            let last_subscription_id = existingCustomer.last_subscription_id;

            if (last_subscription_id == "") {
              //add  Booking Details
              make_booking_first_time(
                user_customer_mobile_no_plus,
                show_conversationId,
                customer_id_dd,
                customer_name_user,
                customer_image_dd,
                user_customer_mobile_nowaId,
                res
              );
            } else {
              const current_date = new Date();
              const current_date_entry = new Date(customer_book_date_dd);

              if (
                current_date >= package_start_date &&
                current_date <= package_end_date
              ) {
                //add  Booking Details
                make_apponitment_for_booking(
                  customer_id_dd,
                  customer_book_date_dd,
                  customer_book_start_time_dd,
                  customer_book_end_time_dd,
                  res
                );
              } else {
                //add  Booking Details
                make_booking_first_time(
                  user_customer_mobile_no_plus,
                  show_conversationId,
                  customer_id_dd,
                  customer_name_user,
                  customer_image_dd,
                  user_customer_mobile_nowaId,
                  res
                );
              }
            }
          })
          .catch((err) => {
            res.send({
              message: error_msg,
              error: true,
            });
          });
      }
    } catch (err) {
      console.log("err", err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

async function create_customer_data(
  customer_name_user,
  user_customer_mobile_no,
  user_customer_mobile_no_without_zip,
  login_type_id,
  customer_disease,
  res
) {
  let query = {
    $and: [
      {
        customer_mobile_no: user_customer_mobile_no,
      },
      {
        login_type: login_type_id,
      },
      // Add more conditions as needed
    ],
  };

  const otp_send = "1234";
  const ethi_customers_ss = new ethi_customers({
    entry_date: currentDatetime(),
    customer_name: customer_name_user,
    customer_mobile_no: user_customer_mobile_no,
    mobile_no_without_zip: user_customer_mobile_no_without_zip,
    customer_email: "",
    customer_image: "user_image.png",
    date_of_birth: "",
    gender: "",
    height_fit: "0",
    height_cm: "0",
    weight_kg: "0",
    weight_lbs: "0",
    blood_group: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
    contry: "",
    feeling_type: "",
    send_msg_flag: 0,
    receive_msg_flag: 0,
    last_msg_send: "",
    last_msg_time: "",
    firebase_token: "",
    otp: otp_send,
    last_subscription_id: "",
    last_doctor_id: "",
    choose_goal: "0",
    hours_water: "5",
    sleep_hour: "8",
    step_count: "0",
    heart_rate: "0",
    login_type: login_type_id,
    login_id: "",
    login_token: "",
    package_select_status: "0",
    package_id: "0",
    package_start_date: "",
    package_end_date: "",
    period_start_date: "",
    referred_by: "",
    description: "",
    add_by: "Wati",
    call_flag: "1",
    Comment: "",
    period_end_date: "",
    period_days: "",
    login_step: 0,
    flag: "c",
  });

  ethi_customers
    .findOne(query)
    .then((existingCustomer) => {
      if (existingCustomer) {
        res.send({
          message: mobile_no_already_exists,
          error: false,
        });
      } else {
        const newCustomer = new ethi_customers(ethi_customers_ss);
        newCustomer
          .save()
          .then(async (get_save_data) => {
            if (customer_disease != "") {
              const query = {
                $and: [
                  { goal_name: customer_disease },
                  { flag: "c" },
                  // Add more conditions as needed
                ],
              };

              const data = await ethi_goals_master.find(query);
              let goal_id = "0";
              if (!data[0]) {
                const ethi_goals_master_data = new ethi_goals_master({
                  entry_date: currentDatetime(),
                  goal_name: customer_disease,
                  goal_details: customer_disease,
                  flag: "c",
                  goal_image: "",
                });

                const savedCustomer = await ethi_goals_master_data.save();
                goal_id = savedCustomer._id;
              } else {
                goal_id = data[0]._id;
              }

              const newCustomer = new ethi_customers_goals({
                entry_date: currentDatetime(),
                customer_id: get_save_data._id,
                goal_id: goal_id,
                customer_goal_name: customer_disease,
                customer_goal_detail: customer_disease,
                customer_goal_image: "",
                flag: "c",
              });

              await newCustomer.save();
            }

            res.send({
              message: save_success,
              error: false,
            });
          })
          .catch((err) => {
            res.send({
              message: error_msg,
              error: true,
            });
          });
      }
    })
    .catch((err) => {
      res.send({
        message: error_msg,
        error: true,
      });
    });
}

async function make_booking_first_time(
  user_customer_mobile_no,
  show_conversationId,
  customer_id_dd,
  customer_name_user,
  customer_image_dd,
  user_customer_mobile_nowaId,
  res
) {
  const ethi_customers_ss = new ethi_subscription_plan({
    entry_date: currentDatetime(),
    doctor_id: "",
    doctor_name: "",
    doctor_image: "",
    customer_id: customer_id_dd,
    customer_name: customer_name_user,
    customer_mobile_no: user_customer_mobile_no,
    customer_image: customer_image_dd,
    package_id: "0",
    package_start_date: "",
    package_end_date: "",
    no_of_calling: 0,
    complete_calling: "0",
    payment_amount: "0",
    payment_mode: "Online",
    order_id: show_conversationId,
    payment_id: "",
    payment_status: 0,
    renew_status: "d",
    flag: "d",
  });

  const newCustomer = new ethi_subscription_plan(ethi_customers_ss);
  await newCustomer.save();
  const payment_id = newCustomer._id;
  const update1 = {
    $set: {
      customer_id: customer_id_dd,
    },
  };
  const filter_remove = {
    conversationId: show_conversationId,
  };
  ethi_customer_wati_temp
    .updateMany(filter_remove, update1, {
      useFindAndModify: false,
    })
    .then(async (data) => {
      const url_create_payment = payment_page_link + payment_id;
      const requestBody = {
        template_name: "payment_link_user",
        broadcast_name: "payment_link_user",
        receivers: [
          {
            whatsappNumber: user_customer_mobile_nowaId,
            customParams: [
              {
                name: "name",
                value: customer_name_user,
              },
              {
                name: "link",
                value: url_create_payment,
              },
            ],
          },
        ],
      };

      //wati hit data
      sendwatitemplete(requestBody);
      res.send({
        message: save_success,
        error: true,
      });
    })
    .catch((err) => {
      res.send({
        message: error_msg,
        error: true,
      });
    });
  try {
  } catch (err) {
    //err
    res.send({
      message: error_msg,
      error: true,
    });
  }
}

function convert12HourTo24Hour(time12) {
  // Split the input time into hours, minutes, and AM/PM

  const [time, period] = time12.split(" ");
  const [hours, minutes] = time.split(":");

  // Convert hours and minutes to integers
  const hoursInt = parseInt(hours, 10);
  const minutesInt = parseInt(minutes, 10);
  // Calculate the 24-hour equivalent hours
  let hours24 = hoursInt;
  if (period === "PM" && hoursInt !== 12) {
    hours24 += 12;
  } else if (period === "AM" && hoursInt === 12) {
    hours24 = 0;
  }

  // Convert to string format with leading zeros
  const hours24Str = hours24.toString().padStart(2, "0");
  const minutesStr = minutesInt.toString().padStart(2, "0");

  return `${hours24Str}:${minutesStr}`;
}

exports.submit_pre_payment_call_website = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const subscription_plan_id = req.body.subscription_plan_id;
      const package_id = req.body.package_id;
      const package_name = req.body.package_name;
      const package_days = req.body.package_days;
      const package_price = req.body.package_price;
      const lineItems = [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: package_name,
            },
            unit_amount: package_price * 100,
          },
          quantity: 1,
        },
      ];
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems, // Pass lineItems as an array
        mode: "payment",
        success_url: success_url + subscription_plan_id,
        cancel_url: cancel_url,
      });

      const update1 = {
        $set: {
          package_id: package_id,
          payment_amount: package_price,
          payment_mode: "online",
          order_id: session.id,
        },
      };
      const filter_remove = {
        _id: subscription_plan_id,
        flag: "d",
        renew_status: "d",
      };
      ethi_subscription_plan
        .updateMany(filter_remove, update1, {
          useFindAndModify: false,
        })
        .then((data) => {
          res.send({
            message: session.id,
            error: false,
          });
        })
        .catch((err) => {
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (err) {
      console.log("err12", err);
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};
exports.successpaymenthitdata = async (req, res) => {
  // Check if req.query is not empty
  if (Object.keys(req.query).length === 0) {
    res.send({
      message: "GET request is empty",
      error: true,
    });
  } else {
    const subscription_id = req.query.subscription_id;
    var condition1 = {
      flag: "c",
      allow_access: "1",
    };
    const data_doctor_data_only = await ethi_doctor_master
      .find(condition1)
      .limit(1)
      .exec();
    doctor_id_dd = data_doctor_data_only[0]._id;

    var condition2 = {
      _id: subscription_id,
    };
    const data_subscription_only = await ethi_subscription_plan
      .find(condition2)
      .limit(1)
      .exec();

    let customer_id_id = data_subscription_only[0].customer_id;
    let package_id_dd = data_subscription_only[0].package_id;
    var condition3 = {
      _id: package_id_dd,
    };
    const data_package_only = await ethi_package_master
      .find(condition3)
      .limit(1)
      .exec();

    const complete_days = parseInt(data_package_only[0].package_days, 10);
    const complete_calling_dd = data_package_only[0].no_of_calling;
    const currentDate = new Date();

    // Format the date as YYYY-MM-dd
    let year = currentDate.getFullYear();
    let month = String(currentDate.getMonth() + 1).padStart(2, "0");
    let day = String(currentDate.getDate()).padStart(2, "0");

    const package_start_date_dd = `${year}-${month}-${day}`;

    currentDate.setDate(currentDate.getDate() + complete_days);

    // Format the date as YYYY-MM-dd
    year = currentDate.getFullYear();
    month = String(currentDate.getMonth() + 1).padStart(2, "0");
    day = String(currentDate.getDate()).padStart(2, "0");

    const package_end_date_dd = `${year}-${month}-${day}`;

    const filter1 = {
      _id: customer_id_id,
    };
    const filter_renew = {
      _id: subscription_id,
      payment_status: "0",
      renew_status: "d",
      flag: "d",
    };

    const update_renew = {
      $set: {
        payment_status: "done",
        payment_id: "0",
        doctor_id: doctor_id_dd,
        doctor_name: data_doctor_data_only[0].doctor_name,
        doctor_image: data_doctor_data_only[0].doctor_image,
        package_start_date: package_start_date_dd,
        package_end_date: package_end_date_dd,
        no_of_calling: 0,
        complete_calling: complete_calling_dd,
        invoice_pdf: "",
        flag: "c",
        renew_status: "c",
      },
    };
    const update1 = {
      $set: {
        last_subscription_id: subscription_id,
        last_doctor_id: doctor_id_dd,
        package_id: package_id_dd,
        package_select_status: "1",
        package_start_date: package_start_date_dd,
        package_end_date: package_end_date_dd,
        login_step: "2",
      },
    };
    const filter = {
      _id: subscription_id,
      package_id: package_id_dd,
      customer_id: customer_id_id,
    };
    const filter_remove = {
      package_id: package_id_dd,
      customer_id: customer_id_id,
      flag: "c",
      renew_status: "c",
    };
    const update_remove = {
      $set: {
        payment_status: "repayment",
        flag: "d",
        renew_status: "c",
      },
    };
    ethi_subscription_plan
      .updateMany(filter_remove, update_remove, {
        useFindAndModify: false,
      })
      .then((data) => {
        ethi_subscription_plan
          .updateOne(filter, update_renew, {
            useFindAndModify: false,
          })
          .then((data) => {
            if (data.modifiedCount > 0) {
              ethi_subscription_plan
                .deleteMany(filter_renew)
                .then((result) => {
                  ethi_customers
                    .updateOne(filter1, update1, {
                      useFindAndModify: false,
                    })
                    .then(async (data2) => {
                      //payment done

                      const filter_wati = {
                        customer_book_date: { $ne: null },
                        customer_book_start_time: { $ne: "" },
                        customer_id: customer_id_id,
                      };

                      const wati_data = await ethi_customer_wati_temp
                        .find(filter_wati)
                        .sort({ createrby: -1 });
                      if (wati_data[0]) {
                        let customer_book_date =
                          wati_data[0].customer_book_date;
                        let customer_book_start_time =
                          wati_data[0].customer_book_start_time;
                        let customer_book_end_time =
                          wati_data[0].customer_book_end_time;

                        make_apponitment_for_booking(
                          customer_id_id,
                          customer_book_date,
                          customer_book_start_time,
                          customer_book_end_time,
                          res
                        );
                      }
                    })
                    .catch((err) => {
                      res.send({
                        message: error_msg,
                        error: true,
                      });
                    });
                })
                .catch((err) => {
                  res.send({
                    message: error_msg,
                    error: true,
                  });
                });
            } else {
              res.send({
                message: error_msg,
                error: true,
              });
            }
          })
          .catch((err) => {
            res.send({
              message: error_msg,
              error: true,
            });
          });
      })
      .catch((err) => {
        res.send({
          message: error_msg,
          error: true,
        });
      });
  }
};

async function make_apponitment_for_booking(
  customer_id_id,
  customer_book_date,
  booking_start_time,
  booking_end_time,
  res
) {
  var condition3 = {
    flag: "c",
    _id: customer_id_id,
  };
  const data_customers_data = await ethi_customers.find(condition3).exec();

  let customer_name_dd = "User";
  let customer_mobile_no_dd = "";
  let customer_image_dd = "";
  let doctor_id_id = "";
  let subscription_id_dd = "";
  if (data_customers_data[0]) {
    customer_name_dd = data_customers_data[0].customer_name;
    customer_mobile_no_dd = data_customers_data[0].customer_mobile_no;
    customer_image_dd = data_customers_data[0].customer_image;
    doctor_id_id = data_customers_data[0].last_doctor_id;
    subscription_id_dd = data_customers_data[0].last_subscription_id;
  }

  const query = {
    $and: [
      {
        doctor_id: doctor_id_id,
      },
      {
        booking_date: customer_book_date,
      },
      {
        booking_start_time: booking_start_time,
      },
      {
        status_for_complete: "0",
      },
    ],
  };

  ethi_appointment_with_doctor
    .findOne(query)
    .then(async (existingCustomer) => {
      if (existingCustomer) {
        res.send({
          message: doctor_busy,
          error: true,
        });
        //run wati select another time
      } else {
        var condition4 = {
          flag: "c",
          customer_id: customer_id_id,
          status_for_complete: "1",
        };
        const count_apponiment = await ethi_appointment_with_doctor
          .countDocuments(condition4)
          .exec();

        var condition3 = {
          flag: "c",
          _id: doctor_id_id,
        };
        const ethi_doctor_master_data = await ethi_doctor_master
          .find(condition3)
          .exec();
        let doctor_name_dd = "";
        let doctor_tag_dd = "";
        let doctor_image_dd = "";
        if (ethi_doctor_master_data[0]) {
          doctor_name_dd = ethi_doctor_master_data[0].doctor_name;
          doctor_tag_dd = ethi_doctor_master_data[0].doctor_tag;
          doctor_image_dd = ethi_doctor_master_data[0].doctor_image;
        }

        let make_sec = differenceInSecondsfunction(
          booking_start_time,
          booking_end_time
        );
        let token_agora_dd = generateAgoraToken(customer_id_id, make_sec);
        const ethi_appointment_with_doctor_ss =
          new ethi_appointment_with_doctor({
            entry_date: currentDatetime(),
            doctor_id: doctor_id_id,
            subscription_id: subscription_id_dd,
            doctor_name: doctor_name_dd,
            doctor_tag: doctor_tag_dd,
            doctor_image: doctor_image_dd,
            customer_id: customer_id_id,
            customer_name: customer_name_dd,
            customer_mobile_no: customer_mobile_no_dd,
            customer_image: customer_image_dd,
            booking_date: customer_book_date,
            booking_start_time: booking_start_time,
            booking_end_time: booking_end_time,
            which_no_booking: count_apponiment,
            diet_plan_status: "0",
            assesment_form_status: "0",
            token_agora: token_agora_dd,
            book_by: "user",
            status_for_complete: "0",
            flag: "c",
          });
        const newCustomer = new ethi_appointment_with_doctor(
          ethi_appointment_with_doctor_ss
        );
        newCustomer
          .save()
          .then((savedCustomer) => {
            let booking_id = savedCustomer._id;
            const filter = {
              _id: customer_id_id,
            };
            const update = {
              $set: {
                login_step: "2",
              },
            };
            ethi_customers
              .updateOne(filter, update, {
                useFindAndModify: false,
              })
              .then((data) => {
                //send appointment Link to Customer Whatapp
                const requestBody = {
                  template_name: "agora_link",
                  broadcast_name: "agora_link",
                  receivers: [
                    {
                      whatsappNumber: customer_mobile_no_dd.replace(/\+/g, ""),
                      customParams: [
                        {
                          name: "link",
                          value: agrora_link + booking_id,
                        },
                        {
                          name: "ordernumber",
                          value: customer_book_date,
                        },
                        {
                          name: "tracking_company",
                          value: booking_start_time,
                        },
                      ],
                    },
                  ],
                };

                //wati hit data
                sendwatitemplete(requestBody);
              })
              .catch((err) => {
                console.log("1", err);
                res.send({
                  message: error_msg,
                  error: true,
                });
              });
          })
          .catch((err) => {
            console.log("2", err);
            res.send({
              message: error_msg,
              error: true,
            });
          });
      }
    })
    .catch((err) => {
      console.log("3", err);
      res.send({
        message: error_msg,
        error: true,
      });
    });
}

function generateAgoraToken(userId, expirationTimeInSeconds) {
  // Example usage

  const role = RtcRole.PUBLISHER;

  // Set the token expiration time
  const expirationTime =
    Math.floor(Date.now() / 1000) + expirationTimeInSeconds;

  // Generate the token
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    0,
    role,
    expirationTime
  );

  return token;
}
function differenceInSecondsfunction(start_time, time_end) {
  const [startHours, startMinutes] = start_time.split(":").map(Number);
  const [endHours, endMinutes] = time_end.split(":").map(Number);

  const startDate = new Date(0, 0, 0, startHours, startMinutes);
  const endDate = new Date(0, 0, 0, endHours, endMinutes);

  let differenceInSeconds = (endDate.getTime() - startDate.getTime()) / 1000;

  // If the end time is before the start time, add a day to end date
  if (differenceInSeconds < 0) {
    differenceInSeconds += 24 * 3600; // 24 hours in seconds
  }

  return differenceInSeconds;
}
async function sendwatitemplete(requestBody) {
  const headers = {
    authorization: `Bearer ${apiKey_wati}`,
    accept: "*/*",
    "content-type": "application/json",
  };
  await axios.post(apiUrl_wati, JSON.stringify(requestBody), {
    headers,
  });
  return "done";
}

exports.ethi_customer_update_call_flag = async (req, res) => {
  if (!req.body) {
    res.send({
      message: post_empty,
      error: true,
    });
  } else {
    try {
      const customer_id_id = req.body.person_id;
      const comment = req.body.comment;
      const selected_status = req.body.selected_status;

      const update1 = {
        $set: {
          call_flag: "0",
          Comment: comment,
          response_by: selected_status,
        },
      };

      var condition3 = {
        flag: "c",
        _id: customer_id_id,
      };

      ethi_customers
        .updateOne(condition3, update1, {
          useFindAndModify: false,
        })
        .then(async (savedCustomer) => {
          const data_customers_data = await ethi_customers
            .find(condition3)
            .exec();
          let requestBody = {
            template_name: "status_update",
            broadcast_name: "status_update",
            receivers: [
              {
                whatsappNumber:
                  data_customers_data[0].customer_mobile_no.replace(/\+/g, ""),
                customParams: [],
              },
            ],
          };
          if (selected_status === "1") {
            requestBody = {
              template_name: "sale_not_confirmed",
              broadcast_name: "sale_not_confirmed",
              receivers: [
                {
                  whatsappNumber:
                    data_customers_data[0].customer_mobile_no.replace(
                      /\+/g,
                      ""
                    ),
                  customParams: [
                    {
                      name: "name",
                      value: data_customers_data[0].customer_name,
                    },
                  ],
                },
              ],
            };

            //wati hit data
          }
          sendwatitemplete(requestBody);
          res.send({
            message: error_msg,
            error: false,
          });
        })
        .catch((err) => {
          console.log(err);
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};

exports.check_customer_presernt_or_not = async (req, res) => {
  console.log(req.body);
  if (!req.body) {
    res.status(200).send({
      message: error_msg,
      error: false,
    });
  } else {
    try {
      console.log("err");
      // 200 new customer
      // 400 already apponinet
      // 600 again book appointment
      // 800 repayment for subscription
      const user_customer_mobile_no_plus = req.body.waId;
      const login_type_id = "normal";
      let query = {
        $and: [
          {
            customer_mobile_no: user_customer_mobile_no_plus,
          },
          {
            login_type: login_type_id,
          },
          // Add more conditions as needed
        ],
      };

      ethi_customers
        .findOne(query)
        .then(async (existingCustomer) => {
          if (existingCustomer) {
            let customer_id_dd = existingCustomer._id;
            let customer_name_user = existingCustomer.customer_name;
            let customer_image_dd = existingCustomer.customer_image;
            let last_subscription_id = existingCustomer.last_subscription_id;
            let doctor_id_id = existingCustomer.last_doctor_id;

            var condition6 = {
              flag: "c",
              customer_id: customer_id_dd,
              subscription_id: last_subscription_id,
              doctor_id: doctor_id_id,
              status_for_complete: "0",
            };

            const data_count_apponiment_data =
              await ethi_appointment_with_doctor
                .find(condition6)
                .limit(2)
                .sort({ createdAt: -1 })
                .exec();

            if (data_count_apponiment_data[0]) {
              const requestBody = {
                template_name: "agora_link",
                broadcast_name: "agora_link",
                receivers: [
                  {
                    whatsappNumber: user_customer_mobile_no_plus,
                    customParams: [
                      {
                        name: "link",
                        value: agrora_link + data_count_apponiment_data[0]._id,
                      },
                      {
                        name: "ordernumber",
                        value: data_count_apponiment_data[0].booking_date,
                      },
                      {
                        name: "tracking_company",
                        value: data_count_apponiment_data[0].booking_start_time,
                      },
                    ],
                  },
                ],
              };

              //wati hit data
              sendwatitemplete(requestBody);
              console.log("400");
              res.status(400).send({
                message: error_msg,
                error: false,
              });
            } else {
              console.log("600");
              res.status(600).send({
                message: error_msg,
                error: false,
              });
            }
          } else {
            console.log("200");
            res.status(200).send({
              message: error_msg,
              error: false,
            });
          }
        })
        .catch((err) => {
          res.send({
            message: error_msg,
            error: true,
          });
        });
    } catch (error) {
      res.send({
        message: error_msg,
        error: true,
      });
    }
  }
};
