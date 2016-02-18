var _ = require('lodash');
var async = require('async');
var User = require('../../models/User');
var Game = require('../../models/Game');

/**
 * GET /admin/game
 * List users
 */

//Display list of games on a table
exports.display = function (req, res){
  Game.find(function(err, game){
    res.render('gameList', {
      game: game
    })
  })
}

exports.create = function (req, res){

}

exports.search = function (req, res){

}
exports.save = function (req, res){

}