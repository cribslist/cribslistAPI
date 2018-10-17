const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use("/", express.static(__dirname + '/public'))
  // .get('*', function(req, res){
  //       req.redirect('')
  //   })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
