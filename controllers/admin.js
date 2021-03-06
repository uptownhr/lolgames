"use strict"
var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Game = require('../models/Game');


/**
 * GET /admin
 * Dashboard
 */

exports.index = function(req, res){
  res.render('admin/index',{
    title: 'Dashboard'
  });
}

/**
 * GET /admin/game
 * List users
 */

//Display list of games on a table
exports.display = function (req, res){
  Game.find(function(err, games){
    res.render('admin/games', {
      games: games
    })
  })
}

exports.create = function (req, res){
  var game = new Game()
  let data = game.toJSON()

  delete data._id
  delete data.__v

  var link = "/admin/game/" + data._id;
  console.log("THIS IS THE LINK: ", link);


  res.render('admin/template/gameTemp', {
    data: data,
    link: link
  })
}

exports.search = function (req, res){
  var id = req.params.game_id;
  console.log('this is the id: ', id);
  Game.find({_id: id}, function(err, game){
    var data = game.toJSON()
    res.render('admin/gameTemp', {
      data: data,
    })
  })
}
exports.save = function (req, res){
  let body = req.body

  Game.findOne( {_id: body._id}, (err, game) => {
    if(!game) game = new Game(body)

    console.log(game);
    game.save( (err,saved) => {
      if (err) return res.send(err)
      res.send(saved)
    })
  })
}


exports.detailView = function (req, res){
  var id = req.params.game_id;
  Game.findOne({_id: id}, function (req, res){
    res.render('admin/gamelist')
  })
}
