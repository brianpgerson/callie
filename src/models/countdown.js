const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CountdownSchema = new Schema({
  botId: {
    type: String,
    required: false
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

const Countdown = mongoose.model('Countdown', CountdownSchema);
export default Countdown;
