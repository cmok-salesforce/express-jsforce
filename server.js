var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');

var server = express();
http.createServer(server).listen(3000);