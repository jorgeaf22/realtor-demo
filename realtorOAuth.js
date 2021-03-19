// Flow (from https://spaces.zang.io/developers/docs/tutorials/authorizingrequests#section5)
//
// https://72.167.227.239:5000/redirect?code=1&state=2
//
// Invoke https://accounts.avayacloud.com/oauth2/authorize with redirect_uri set to /redirect/
// /redirect invoked with code
// Invoke https://accounts.avayacloud.com/oauth2/access_token to obtain token and refresh token
// Save tokens
//
// When client calls getToken, call https://accounts.avayacloud.com/oauth2/access_token with refresh token
// Return token
//
// sudo forever start cors.js


const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const request = require('request-promise');
var nodeoutlook = require('nodejs-nodemailer-outlook');
const uuid = require('uuid');
const dialogflow = require('dialogflow');

const bodyParser = require('body-parser');
const cookieParse = require('cookie-parser');

const RESTDB_URL = "https://working-5a54.restdb.io/rest/accounts/"
const RESTDB_KEY = "a1f916557ff5662139f55af35b7b92fad9668";

const CPAAS_USER = "AC777c3e324c2be6245e6948afb51b4235";
const CPAAS_PASSWORD = "4ca0913249a65cb5b2e8e955cf347b06";
const CPAAS_NUMBER = "+14387007382";
const CPAAS_URL = "https://api.zang.io/v2/Accounts/AC777c3e324c2be6245e6948afb51b4235/SMS/Messages";

var CHAIN_FILE =  "/etc/letsencrypt/live/ip-72-167-227-239.ip.secureserver.net/fullchain.pem";
var KEY_FILE = "/etc/letsencrypt/live/ip-72-167-227-239.ip.secureserver.net/privkey.pem";

const CLIENT_ID = "75b374c1b7395d897b34"; // Created when application is registered
const CLIENT_SECRET = "6c8237926e4213c948d2186ecb3879f628717256"; // Created when application is registered
const REDIRECT_URI = "https://ip-72-167-227-239.ip.secureserver.net:5050/redirect";

// Create a new Dialogflow sessionClient.  projectId and keyFileName are dependent on the Dialogflow agent.
var projectId = 'serviceagent-qthcga';
//var sessionClient = new dialogflow.SessionsClient({keyFilename:"/home/ajprokop/test-frvaci.json"});  // Authenticate application using service's JSON credentials (Non Beta features)
var sessionClient = new dialogflow.v2beta1.SessionsClient({
	keyFilename: "/home/ajprokop/service.json"
}); // Authenticate application using service's JSON credentials
var sessionId = uuid.v4(); // Create random session ID
var sessionPath = sessionClient.sessionPath(projectId, sessionId);

var key = fs.readFileSync(KEY_FILE).toString();
var cert = fs.readFileSync(CHAIN_FILE).toString();

var httpsOptions = {
        key: key,
        cert: cert
};

// Tells the application to use express and the bodyParser as middleware to easily parse JSON
var app = express();
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(bodyParser.json());
app.use(cors());

var URL_PORT = 5050;

//Create the server and tell it to listen to the given port
var httpsServer = https.createServer(httpsOptions, app);

var latestRefreshToken;

// Initialize by reading in the refresh token from the configuration file.
readConfig(function(configData){
	latestRefreshToken = configData.refreshToken;
	console.log("Latest: " + latestRefreshToken);
});	


httpsServer.listen(URL_PORT, function(){
    console.log("Listening: " , URL_PORT.toString());
});

// CPaaS Routines

app.post('/cpaas-SMS/', function (req, res) 
{
    sendTextNotification(req.body.destination, req.body.message, res);
});

async function sendTextNotification(phone, message, res) {
	await sendSMS(phone, message);
	res.type('application/json');
	res.send(JSON.stringify({status:"Success"}));	
}

async function sendSMS(number, message) 
{
	var parameters = "?From=" + encodeURIComponent(CPAAS_NUMBER) + "&To=" + encodeURIComponent("+" + number) + "&Body=" + encodeURIComponent(message);
	var url = CPAAS_URL + parameters;
	var auth = "Basic " +  Buffer.from(CPAAS_USER + ":" + CPAAS_PASSWORD, "utf-8").toString("base64");
	var response = await request.post({url: url, headers : {'Accept' : 'application/json', 'Authorization':auth}}, function(e , r , body) {
	});
    return response;	
}

// End CPaaS Routines

// restdb.io Routines

app.post('/restdb-delete/', function (req, res) 
{
    deleteFunction(req.body.id, res);
});

async function deleteFunction(id, res) {
	await deleteRecord(id);
	res.type('application/json');
	res.send(JSON.stringify({status:"Success"}));	
}

async function deleteRecord(id) 
{
	var url = RESTDB_URL + id;
	var response = await request.delete({url: url, headers : {'Accept' : 'application/json', 'x-api-key':RESTDB_KEY}}, function(e , r , body) {
	});
    return response;	
}

// End resdb.io Routines

app.get('/redirect/' , function(req , res){	
	console.log("Code = " + req.query.code + " State = " + req.query.state);
	callAccessToken(req.query.code, req.query.state);
    res.type('application/json')
    res.send(JSON.stringify({status:"Success"}));	  
});

app.get('/processRequest/' , function(req , res){
	console.dir(req);
    res.type('application/json')
    res.send(JSON.stringify({status:"Success"}));	  
});

app.post('/dialogflow/', function (req, res) 
{
    processText(req.body.message, res);
});


async function processText(message, res) {
	var result = await callGoogleIntent(message, sessionPath);
	prompt = result.fulfillmentText;
	res.type('application/json');
	res.send(JSON.stringify({status:"Success", response: prompt}));	
}

app.get('/getToken/' , function(req , res){
	// Make a call to https://accounts.avayacloud.com/oauth2/access_token with the grant_type set to refresh_token
	// This guarantees that the token never expires
	refreshToken(res);
});

async function refreshToken(res) {
	getToken(res);
}

async function getToken(res) {
	var access_token = await callSpacesRefreshToken(latestRefreshToken);
	console.log("After refresh " + access_token);
	res.type('application/json')
	res.send(JSON.stringify({status:"Success", accessToken: access_token}));
	return access_token;	
}

async function callSpacesRefreshToken(refreshToken) {
	var parameters = "grant_type=refresh_token";
	parameters += "&client_id=" + CLIENT_ID;
	parameters += "&client_secret=" + CLIENT_SECRET;
	parameters += "&refresh_token=" + refreshToken;
	
	var url = "https://accounts.avayacloud.com/oauth2/access_token";
	var response = await request.post({url: url, body : parameters, headers : {'Accept' : 'application/json', 'content-type' : 'application/x-www-form-urlencoded'}}, function(e , r , body) {
	});	
	// a successful call returns access_token, scope, expires_in, id_token, and refresh_token
	// Save access_token, id_token (refresh token), and expires_in values
	
	var jsonResponse = JSON.parse(response);
	console.log("Refresh token = " + jsonResponse.refresh_token);
	
	var config = {
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		accessToken: jsonResponse.access_token,
		refreshToken: jsonResponse.refresh_token,
		idToken: jsonResponse.id_token,
		expiration: jsonResponse.expires_in,
		scope: jsonResponse.scope
	};	
	writeConfig(config);
	latestRefreshToken = jsonResponse.refresh_token; // Save refresh_token for the next invocation
	return jsonResponse.access_token;
}	

function writeConfig(configData) {
	let data = JSON.stringify(configData);
	fs.writeFileSync('configuration.json', data);
}

function readConfig(callback) {
	fs.readFile('configuration.json', 'utf8', (err, data) => {
		if (err) throw err;
		let configData = JSON.parse(data);
		callback(configData);
	});
}	

async function callAccessToken(code, state) {
	var response = await callSpacesAccessToken(code, state);
}

async function callSpacesAccessToken(code, state) {		
	var parameters = "grant_type=authorization_code";
	parameters += "&client_id=" + CLIENT_ID;
	parameters += "&client_secret=" + CLIENT_SECRET;
	parameters += "&redirect_uri=" + REDIRECT_URI;
	parameters += "&code=" + code;
	
	var url = "https://accounts.avayacloud.com/oauth2/access_token";
	var response = await request.post({url: url, body : parameters, headers : {'Accept' : 'application/json', 'content-type' : 'application/x-www-form-urlencoded'}}, function(e , r , body) {
	});	
	// A successful call returns access_token, scope, expires_in, refresh_token, and id_token
	// Save everything in the configuration file.
	console.dir(response);
	var jsonResponse = JSON.parse(response);
	
	var config = {
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		accessToken: jsonResponse.access_token,
		refreshToken: jsonResponse.refresh_token,
		idToken: jsonResponse.id_token,
		expiration: jsonResponse.expires_in,
		scope: jsonResponse.scope
	};
	latestRefreshToken = jsonResponse.refresh_token;
	writeConfig(config);
}

//-----------  Google Dialogflow functions

async function callGoogleIntent(speech, sessionPath) {
	// The text query request.
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				// The query to send to the Dialogflow agent
				text: speech,
				// The language used by the client (en-US)
				languageCode: 'en-US',
			},
		},
	};

	// Send request
	const responses = await sessionClient.detectIntent(request);
	const result = responses[0].queryResult;

	var intent = "Nothing";
	if (result.intent) {
		intent = result.intent.displayName;
		//console.log(`  Intent: ${result.intent.displayName}`);
	} else {
		console.log(`  No intent matched.`);
	}
	return result;
}
