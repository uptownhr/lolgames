"use strict"
const _ = require('lodash'),
  async = require('async'),
  Template = require('../../models/Template')

exports.index = function(req, res){
  Template.findOne( (err,template) =>{

    if(!template){
      template = new Template()
    }

    let data = template.toJSON()

    delete data._id
    delete data.__v

    res.render('admin/template/index', {
      data: data,
    })
  })
}

exports.save = function(req,res){
  let body = req.body

  Template.findOne( (err,template) => {
    if(!template) template = new Template()

    _.assign(template, body)

    template.save( (err,saved) => {
      res.send(saved)
    })
  })

}