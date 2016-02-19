var mongoose = require('mongoose'),
  Schema = mongoose.Schema


var teamSchema = new Schema({
  name: {type: String},
  king: {type: Schema.Types.ObjectId, ref: 'User'},
  players: [{type: Schema.Types.ObjectId, ref: 'User'}],
  subs: [{type: Schema.Types.ObjectId, ref: 'User'}]
})

var gameSchema = new Schema({
  name: {type: String, default: ''},
  status: {
    type: String,
    enum: [
      'pending',
      'drafting-king',
      'drafting-team',
      'started',
      'completed'],
    default: 'pending'
  },
  startDate: {type: Date, default: Date.now},
  players: [{type: Schema.Types.ObjectId, ref: 'User'}],
  rule: {
    map: {type: 'String', default: '3x3'},
    player_size: {type: Number, default: 5},
    sub_size: {type: Number, default: 1},
    midIsBaron: {type: Boolean, default: true}
  },
  kings: [{type: Schema.Types.ObjectId, ref: 'User'}],
  teams: [teamSchema]
});


gameSchema.methods.players_not_in_team = function(){
  var game = this
  var players_not_in_team = this.players.filter( player_id => {
    var isInTeam = game.teams.some( team => {
      return team.players.some( p_id => p_id == player_id.toString() || team.subs.some( p_id => p_id == player_id.toString()) )
    })

    var isKing = game.kings.some( king_id => king_id == player_id.toString() )

    return !isInTeam && !isKing
  })

  return players_not_in_team
}

module.exports = mongoose.model('Game', gameSchema);