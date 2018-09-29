require('dotenv').config();

var express = require('express');
const jsforce = require('jsforce');
const session = require('express-session');
const config = require('./config');
const bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(process.env.BUILD_PROPERTIE_LOCATION);

var sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: process.env.SSL_PASSPHRASE
};

var server = express();
http.createServer(server).listen(3000);
https.createServer(sslOptions, server).listen(3443)


server.get('/', function (req, res) {
    res.send("Hello World!" + properties.get('sf.devciam.username'));
});