const Clinic = require("../models/clinicModel");
//post clinic data
const postClinic = (req, res, next) => {
    const user = new Clinic(req.body);
    const result = user.save();
    res.send(result);
  };
  //get clinic data
  // const getClinicData = async (req, res, next) => {
  //   try {
  //     const users = await Clinic.find();
  //     if (users.length > 0) {
  //       res.send(users);
  //     } else {
  //       res.send({ result: "no ticket info. found" });
  //     }
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  const getClinicData = async (req, res, next) => {
    try {
      // Retrieve pagination parameters from the request body
      const { page = 1, limit = 250 } = req.body;
      const skip = (page - 1) * limit;
  
      const clinics = await Clinic.find().skip(skip).limit(Number(limit));
  
      if (clinics.length > 0) {
        res.send(clinics);
      } else {
        res.send({ result: "no clinic info. found" });
      }
    } catch (error) {
      next(error);
    }
  };
  

  module.exports = {
    postClinic,
    getClinicData
  }