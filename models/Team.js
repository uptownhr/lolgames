var mongoose = require('mongoose'),
  Schema = mongoose.Schema


var teamSchema = new Schema({
  name: {type: String},
  king: {type: Schema.Types.ObjectId, ref: 'User'},
  players: [{type: Schema.Types.ObjectId, ref: 'User'}],
  subs: [{type: Schema.Types.ObjectId, ref: 'User'}]
})

module.exports = mongoose.model('Team', teamSchema);
