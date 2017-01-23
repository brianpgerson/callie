router = require('../router'),
		express = require('express'),
		app = express();

app.use(express.static('public'))

app.listen(process.env.PORT || 1337, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

console.log(`Your server is running on port 1337.`);
router(app, db);
