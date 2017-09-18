const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//= ===============================
// Countdown Schema
//= ===============================
const CountdownSchema = new Schema({
  botId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  botAccessToken: {
    type: String,
    required: true
  },
  teamName: {
    type: String,
    default: 'a default name'
  },
  channels: [],
  teamId: {
    type: String,
    required: true
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
    channel: {
      type: String
    },
    rule: {
      hour: {
        type: Number
      },
      dayOfWeek: {
        type: Number
      }
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
