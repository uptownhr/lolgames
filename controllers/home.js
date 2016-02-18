var Game = require('../models/Game');
/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  console.log("WHAT THE FUCK MAN?!");
  Game.find(function(err, game){
    console.log("HEY WTF: ", game);
    res.render('home', {
      game: 'game'
    });
  })
};

exports.detailView = function (req, res){
  var id = req.params.game_id
  Game.find({_id: id}, function(err, game){
    res.render('admin/gamelist', {

    })
  })
}