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
  Game.find(function(err, game){
    res.render('game', {
      game: game
    })
  })
}

exports.create = function (req, res){
  Game.findOne( (err,game) =>{

    if(!game){
    game = new Game()
  }

  let data = game.toJSON()

  delete data._id
  delete data.__v

  res.render('admin/template/index', {
    data: data,
  })
})
}

exports.search = function (req, res){
  var id = req.params.game_id;
  Game.findOne({_id: id}, function(err, game){
    if (!game){
      game = new Game()
    }
    let data = game.toJSON();

    delete data._id
    delete data.__values__

    res.render('admin/template/index', {
      data:data,
    })
  })
}
exports.save = function (req, res){
  let body = req.body

  Game.findOne( (err, game) => {
    if(!game) game = new Game()

  _.assign(game, body)

  game.save( (err,saved) => {
    res.send(saved)
})
})
}

exports.detailView = function (req, res){
  var id = req.params.game_id
  Game.find({_id: id}, function(err, game){
    res.render('admin/gamelist', {

    })
  })
}