var express = require('express');
var router = express.Router();
var { envirData } = require("../socketio");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/chartdata", (req, res) => {
  if (envirData.length > 10) {
    return res.json(envirData.slice(envirData.length - 10));
  } else {
    return res.json(envirData);
  }
});

module.exports = router;
