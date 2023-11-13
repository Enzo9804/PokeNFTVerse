const express = require('express');
const router = require('./router/router.js');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.use('/', router);

const listener = app.listen(process.env.PORT || 5000, () => {
    console.log("Your app is listening on port: " + listener.address().port);
})