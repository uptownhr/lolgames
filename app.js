/**
 * Module dependencies.
 */
var _ = require('lodash');
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var dotenv = require('dotenv');
var MongoStore = require('connect-mongo/es5')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var sass = require('node-sass-middleware');
var multer = require('multer');
var upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 *
 * Default path: .env (You can remove the path argument entirely, after renaming `.env.example` to `.env`)
 */
dotenv.load({ path: '.env.example' });


/**
 * Models
 */

var Game = require('./models/Game');
var User = require('./models/User');

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');
var adminController = require('./controllers/admin');
var adminUserController = require('./controllers/admin/user');
var adminTemplateController = require('./controllers/admin/template');

/**
 * API keys and Passport configuration.
 */
var passportConf = require('./config/passport');

/**
 * Init
 */

var init = require('./config/init');

/**
 * Create Express server.
 */
var app = express();

/**
 * Init stuff
 */

app.use(init.initialized)

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB || process.env.MONGOLAB_URI);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  return next()
  var api_path = /^\/api.*\//
  console.log(req.path)
  if ( api_path.test(req.path) ) {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * Admin Routes
 */
app.get('/admin', passportConf.isAdmin, adminController.index)
app.get('/admin/users', passportConf.isAdmin, adminUserController.list)
app.get('/admin/users/edit/:id?', passportConf.isAdmin, adminUserController.edit)
app.get('/admin/users/delete/:id?', passportConf.isAdmin, adminUserController.delete)
app.post('/admin/users/save', passportConf.isAdmin, adminUserController.save)

/**
 * Admin/Game Routes
 */
app.get('/admin/game', passportConf.isAdmin, adminController.display) //Display list of games on a table with game details( name, status, startdate)
app.get('/admin/game/create', passportConf.isAdmin, adminController.create)//Displays a blank form to create / saving hits POST /admin/game/save
app.get('/admin/game/:game_id', passportConf.isAdmin, adminController.search)//Display editable form for game details / saving hits POST /admin/game/save
app.post('/admin/game/save', passportConf.isAdmin, adminController.save)//Takes info from /admin/game/create or /admin/game/:game_id and saves to db

/**
 * Game Routes
 */
app.get('/game/:game_id', homeController.detailView)

/**
 * Template admin routes
 */

app.get('/admin/template', adminTemplateController.index)
app.post('/admin/template/save', adminTemplateController.save)


/**
 * Game related API
 */
app.get('/api/game/list', function(req,res){
  Game.find( function(err, games){
    res.send(games)
  })
})
app.post('/api/game/create', function(req,res){
  var body = req.body

  var game = new Game({
    name: body.name,
    startDate: body.startDate
  });

  game.save( function(err, saved){
    if(err) return res.send(err)
    res.send(saved)
  })
})

app.post('/api/game/:game_id/join', passportConf.isAuthenticated, function(req,res){
  var game_id = req.params.game_id,
    body = req.body

  var player_id = body.player_id

  Game.findOne({_id: game_id}, function(err,game){
    game.players.addToSet( player_id )
    game.save(function(err,saved){
      res.send(saved)
    })
  })
})

app.post('/api/game/:game_id/select-king/:player_id', function(req,res){
  var game_id = req.params.game_id,
    player_id = req.params.player_id


  Game.findOne({_id: game_id}, function(err, game){
    game.kings.addToSet( player_id )
    game.save( function(err, saved){
      res.send(saved)
    })
  })
})


app.post('/api/game/:game_id/next-step', function(req,res){
  var game_id = req.params.game_id
  console.log(game_id);
  Game.findOne({_id: game_id}, function(err, game){
    console.log(err,game);
    switch(game.status){
      case 'pending': game.status = 'drafting-king'; break;
      case 'drafting-king': game.status = 'drafting-team'; break;
      case 'drafting-team': game.status = 'started'; break;
      case 'started': game.status = 'completed'; break;
    }
    console.log('wtf');
    game.save( function(err, saved){
      console.log('comon',err)
      res.send(saved)
    })
  })
})

app.post('/api/game/:game_id/create-team', function(req,res){
  var game_id = req.params.game_id,
    body = req.body

  Game.findOne({_id: game_id}, function(err, game){
    game.teams.push({
      name: body.name,
      king: body.king_id
    })

    game.save( function(err, saved){
      res.send(saved)
    })
  })
})

app.post('/api/game/:game_id/team/select-player', function(req, res){
  var game_id = req.params.game_id,
    body = req.body

  var team_id = body.team_id,
    player_id = body.player_id

  Game.findOne({_id: game_id}, function(err, game){

    //check player is in game
    console.log(player_id, '56c503ff433524385f2fdfbc', game)
    if( !game.players.some( p_id => p_id == player_id ) ){
      return res.status(400).send(`Player not in game: ${game_id}`)
    }

    //check player is not king
    if( game.kings.some( king_id => king_id == player_id )){
      return res.status(400).send(`Player is a king`)
    }

    //check player is not in another team
    var isInTeam = game.teams.some( team => {
      return team.players.some( p_id => p_id == player_id)
    })

    if( isInTeam ){
      return res.status(400).send('Already in another team')
    }

    team = game.teams.find( function(team){
      return team.id == team_id
    })

    team.players.addToSet(player_id)

    game.save(function(err,saved){
      res.send(saved);
    })
  })
})

app.post('/api/game/:game_id/team/select-sub', function(req,res){
  var game_id = req.params.game_id,
    body = req.body

  var team_id = body.team_id,
    player_id = body.player_id

  Game.findOne({_id: game_id}, function(err, game){

    //check player is in game
    console.log(player_id, '56c503ff433524385f2fdfbc', game)
    if( !game.players.some( p_id => p_id == player_id ) ){
      return res.status(400).send(`Player not in game: ${game_id}`)
    }

    //check player is not king
    if( game.kings.some( king_id => king_id == player_id )){
      return res.status(400).send(`Player is a king`)
    }

    //check player is not in another team
    var isInTeam = game.teams.some( team => {
      return team.players.some( p_id => p_id == player_id) || team.subs.some( p_id => p_id == player_id )
    })

    if( isInTeam ){
      return res.status(400).send('Already in another team')
    }

    team = game.teams.find( function(team){
      return team.id == team_id
    })

    team.subs.addToSet(player_id)

    game.save(function(err,saved){
      res.send(saved);
    })
  })
})

app.get('/api/game/:game_id/create-subs', function(req,res){
  var game_id = req.params.game_id

  Game.findOne({_id: game_id}, function(err, game){
    var rule = game.rule

    map_size_arr = rule.map.split('x')
    map_size = map_size_arr[0] * map_size_arr[1]

    var player_limit = map_size * (rule.player_size + rule.sub_size)

    if(rule.midIsBaron){
      player_limit = player_limit - (rule.player_size + rule.sub_size)
    }

    console.log(game.players_not_in_team());

    test = game.players_not_in_team().reduce(
      ( teams, player_id, index ) => {
        var lastItem = teams[teams.length-1]
        if(lastItem == undefined ){
          teams.push({
            name: teams.length + 1,
            players: [player_id],
            subs: []
          })
          return teams
        }


        if(lastItem.players.length < 5){
          lastItem.players.push(player_id)
        }else if(lastItem.subs.length < 1) {
          lastItem.subs.push(player_id)
        }else{
          teams.push({
            name: teams.length + 1,
            players: [player_id],
            subs: []
          })
        }

        return teams
      },
      []
    )

    console.log(test)
  })
})

app.get('/api/test/create-users', function(req,res){
  for(var x=0; x < 20; x++){
    var user = new User({
      email: `test${x}@test.com`,
      password: 'asdfasdf'
    })

    user.save()

  }
  res.send('done')
})

app.get('/api/test/join-game/:game_id', function(req,res){
  var game_id = req.params.game_id
  Game.findOne({_id: game_id}, function(err, game){
    User.find(function(err, users){
      user_ids = users.map( user => user._id )
      console.log(game)
      user_ids.forEach( id => {
        game.players.addToSet(id)
      })

      game.save(function(err, saved){
        res.send(saved)
      })
    })
  })
})

app.get('/api/user/list', function(req,res){
  User.find( function(err, users){
    res.send(users)
  })
})


/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/venmo');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
