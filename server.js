require('dotenv').config();

var express = require('express');
const jsforce = require('jsforce');
const session = require('express-session');
//const config = require('./config');
const bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var util = require('util');

process.title = 'myApp';

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(process.env.BUILD_PROPERTIE_LOCATION);

var sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: process.env.SSL_PASSPHRASE
};

//jsForce connection --
const oauth2 = new jsforce.OAuth2({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl: properties.get('sf.devciam.instanceUrl'),
    //clientId and Secret will be provided when you create a new connected app in your SF developer account
    clientId: properties.get('sf.devciam.APIM_CIAM.consumer_id'),
    //use getRaw, otherwise truncate
    clientSecret: properties.getRaw('sf.devciam.APIM_CIAM.consumer_secret')+'' ,
    //redirectUri : 'http://localhost:' + port +'/token'
    redirectUri: properties.get('sf.devciam.APIM_CIAM.callback_url_knet'),
});

console.log('build.propertie: ' + process.env.BUILD_PROPERTIE_LOCATION);
console.log('http port: ' + process.env.EXPRESS_HTTP_PORT);
console.log('https port: ' + process.env.EXPRESS_HTTPS_PORT);
console.log('loginUrl: ' + properties.get('sf.devciam.instanceUrl'));
console.log('clientId: ' + properties.get('sf.devciam.APIM_CIAM.consumer_id'));
console.log('clientSecret: ' + properties.getRaw('sf.devciam.APIM_CIAM.consumer_secret'));
console.log('callback: ' + properties.get('sf.devciam.APIM_CIAM.callback_url'));
console.log('callback knet: ' + properties.get('sf.devciam.APIM_CIAM.callback_url_knet'));
//process.exit;

var app = express();
//initialize session
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));

//bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



/**
* Login endpoint
*/
app.get('/oauth2/login', function (req, res) {
    // Redirect to Salesforce login/authorization page
    res.redirect(oauth2.getAuthorizationUrl({ scope: 'api id refresh_token' }));
});

/**
* Login callback endpoint (only called by Force.com)
*/
app.get('/oauth2/callback', function (req, res) {

    const conn = new jsforce.Connection({ oauth2: oauth2 });
    const code = req.query.code;
    //console.log('req: ' + util.inspect(req));
    //console.log('code: ' + code);

    conn.authorize(code, function (err, userInfo) {
        if (err) { return console.error("*** This error is in the auth callback: " + err); }

        console.log('Access Token: ' + conn.accessToken);
        console.log('Instance URL: ' + conn.instanceUrl);
        console.log('refreshToken: ' + conn.refreshToken);
        console.log('User ID: ' + userInfo.id);
        console.log('Org ID: ' + userInfo.organizationId);

        req.session.accessToken = conn.accessToken;
        req.session.instanceUrl = conn.instanceUrl;
        req.session.refreshToken = conn.refreshToken;

        var string = encodeURIComponent('true');
        //res.redirect('http://localhost:3030/?valid=' + string);
        res.redirect('/userinfo');
    });
});

app.get('/userinfo', function (req, res) {
    // if auth has not been set, redirect to index
    if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }

    //instantiate connection
    let conn = new jsforce.Connection({
        oauth2: { oauth2 },
        accessToken: req.session.accessToken,
        instanceUrl: req.session.instanceUrl
    });

    conn.identity(function (err, res1) {
        if (err) { return console.error(err); }
        console.log("user ID: " + res1.user_id);
        console.log("organization ID: " + res1.organization_id);
        console.log("username: " + res1.username);
        console.log("display name: " + res1.display_name);
        //res.json(res1);
        res.write('<h1>accessToken</h1>');
        res.write('<pre>' + req.session.accessToken + '</pre>');
        res.write('<h2>UserInfo</h2>');
        res.write('<pre>' + JSON.stringify(res1,undefined,2) + '</pre>');
        res.end();
        //res.json(res1);
    });

});



http.createServer(app).listen(process.env.EXPRESS_HTTP_PORT);
https.createServer(sslOptions, app).listen(process.env.EXPRESS_HTTPS_PORT)

app.get('/', function (req, res) {
    var env = req.query.env;
    res.write('env=' + env);
    res.write('username=' + properties.get('sf.devciam.username'));
    res.end();
});