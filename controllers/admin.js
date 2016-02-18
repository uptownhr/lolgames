/**
 * GET /admin
 * Dashboard
 */

exports.index = function(req, res){
  res.render('admin/index',{
    title: 'Dashboard'
  });
}