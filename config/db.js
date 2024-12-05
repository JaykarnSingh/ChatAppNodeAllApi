const mongoose = require("mongoose");


mongoose.connect(
  "",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
console.log("DB connected");
