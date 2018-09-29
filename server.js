require('dotenv').config()

var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');

var sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: "changeit"
};

var server = express();
http.createServer(server).listen(3000);
https.createServer(sslOptions, server).listen(3443)


server.get('/', function (req, res) {
    res.send("Hello World!");
});