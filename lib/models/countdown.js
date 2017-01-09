const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//= ===============================
// Countdown Schema
//= ===============================
const CountdownSchema = new Schema({
  teamId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true
  },
  event: {
    type: String,
    required: true
  },
  destination: {
    type: String
  },
  schedule: {
    id: {
      type: String
    },
    rule: {
      type: String
    },
    active: {
      type: Boolean
    }
  }
},
  {
    timestamps: true
  });

//= ===============================
// Countdown ORM Methods
//= ===============================

module.exports = mongoose.model('Countdown', CountdownSchema);
