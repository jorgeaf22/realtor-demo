const RESTDB_TABLE_ACCOUNTS = "accounts";
const RESTDB_URL = "https://working-5a54.restdb.io/rest/";
const CORS_KEY = "5f526aa3c5e01c1e033b8c4f";

var spacesToken;
var room;
var pwd;
var email;
var firstName;
var lastName;

function newUser() {
	findUser(document.getElementById("email").value).then(function(data) {	
		if (data.totals.total != 0) {
			window.alert("Email address already exists");
		} else {;			
			// Get Access token, create Spaces room, add user record to database collection
			getAccessToken().then(function(data) {
				spacesToken = data.accessToken;
				console.log("spacesToken: " + spacesToken);			
				createSpacesRoom(spacesToken, "Description", "Room for " + document.getElementById("email").value).then(function(data) {
					room = data.data[0].topicId;
					pwd = document.getElementById("password").value;
					email = document.getElementById("email").value;
					firstName = document.getElementById("firstname").value;
					lastName = document.getElementById("lastname").value;
					telephone = document.getElementById("telephone").value;
					addUser(email, pwd, firstName, lastName, telephone, room);
					$('#createModal').modal('hide');   
					$('#loginModal').modal('show');
					$('#liveToast').toast('show');
					document.getElementById("s-form").reset()   
					setSpacesPublic(spacesToken, room);
				}).catch(function(err) {
					console.log("createSpacesRoom Failure");
				})				
			}).catch(function(err) {
				console.log("getAccessToken Failure");
			})						
		}
	}).catch(function(err) {
			console.log("findSpacesUser Failure");			
	})
}

function findSpacesUser() {
	console.log("Find Spaces User Clicked");
	findUser(document.getElementById("email3").value).then(function(data) {
		console.log("Find Spaces User");
		if (data.totals.total != 0) {  // If totals.total == 0 then no user was found
			console.log("Email: " + data.data[0].email + " Room: " + data.data[0].room);
			var password = data.data[0].password;
			if (document.getElementById("password3").value != password) {
				alert("Invalid Password");
			} else {
				setSpaceId(data.data[0].room);
				openSpacesConference();
				// location.href = "loggedin.html"; 
				//alert("You are logged in");
				$('#loginModal').modal('hide');
				$('#loginOkModal').modal('show');				
				document.getElementById("lform").reset()   
			}
		} else {
			alert("User not found");
		}
	}).catch(function(err) {
		console.log("findSpacesUser Failure");
	})		
}

function deleteSpacesUser() {
	getAccessToken().then(function(data) {
		spacesToken = data.accessToken;
		findUser(document.getElementById("email").value).then(function(data) {
			var room = data.data[0].room;
			var id = data.data[0]._id;
			deleteSpacesRoom(spacesToken, room);
			deleteUser(id);
		}).catch(function(err) {
			console.log("Delete User Failure");
		})
	}).catch(function(err) {
		console.log("getAccessToken Failure");
	})
}	
		

function sendText() {
	var destination = document.getElementById("telephone").value;
	var message = document.getElementById("message").value;
	$.ajax({
		headers: {
			'Content-type': 'application/json',
			'Accept': 'application/json'
		},
		data: JSON.stringify(
		{
			"destination": destination,
			"message": message
		}),
		url: 'https://ip-72-167-227-239.ip.secureserver.net:5050/cpaas-SMS',
		type: "POST",
		success: function (data) {
			
		},
		error: function (error) {
			console.log("SMS Failure");
		}
	});
}	

function getAccessToken() {
	return new Promise(function(resolve, reject) {
		$.ajax({
			headers: {
				'Accept': 'application/json'
			},
			url: 'https://ip-72-167-227-239.ip.secureserver.net:5050/getToken',
			type: "GET",
			success: function(data) {
				//spacesToken = data.accessToken; // This token will be used by the Spaces APIs that require a registered user
				resolve(data);
			},
			error: function(error) {
				console.log("getAccessToken error");
				reject(error);
			}
		});
	});
}

// Create Spaces room
function createSpacesRoom(token, description, title) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json',
				'Authorization': 'Bearer ' + token
			},
			data: JSON.stringify(
			{
				"topic": {
					"id": null,
					"title": title,
					"description": description,
					"type": "group"
				},
				"invitees": []
			}),
			url: 'https://spacesapis.avayacloud.com/api/spaces/invite',
			type: "POST",
			dataType: "json",
			contentType: 'application/json',
			success: function(data) {
				//room = data.data[0].topicId;
				resolve(data);				
			},
			error: function(error) {
				console.log("Create Space Room Error");
				reject(error);
			}
		});		
	});
}

// Delete Spaces room
function deleteSpacesRoom(token, room) {
	$.ajax({
		headers: {
			'Authorization': 'Bearer ' + token,
			'Accept': 'application/json'
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + room,
		type: "delete",
		success: function (data) {
			
		},
		error: function (error) {
			console.log("Room Not Deleted");
		}
	});
}

// Add new user to the accounts collection
function addUser(email, pwd, firstName, lastName, telephone, room) {
	$.ajax({
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'x-apikey': CORS_KEY
		},
		data: JSON.stringify(
		{
			"userId": "RealtyUser",
			"password": pwd,
			"email": email,
			"firstName": firstName,
			"lastName": lastName,
			"telephone": telephone,
			"room": room
		}),
		url: RESTDB_URL + RESTDB_TABLE_ACCOUNTS + "?totals=true",
		type: "POST",
		dataType: "json",
		contentType: 'application/json',
		success: function(data) {
			
		},
		error: function(error) {
			console.log("Add User Error");
		}
	});		
}

// Delete a user from the accounts collection
function deleteUser(id) { // id is the _id of the record in the collection.  _id can be obtained with findUser()
	$.ajax({
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/json'
		},
		data: JSON.stringify(
		{
			"id": id
		}),
		url: "https://ip-72-167-227-239.ip.secureserver.net:5050/restdb-delete",
		type: "POST",
		dataType: "json",
		contentType: 'application/json',
		success: function(data) {
			
		},
		error: function(error) {
			console.log("Delete User Error");
		}
	});		
}

// Find a user in the accounts collection
function findUser(emailId) {
	var queryData = {
			"email": emailId
    };
	return new Promise(function(resolve, reject) {
		$.ajax({
			headers: {
				'Accept': 'application/json',
				'x-apikey': CORS_KEY
			},
			url: RESTDB_URL + RESTDB_TABLE_ACCOUNTS + "?q=" + encodeURIComponent(JSON.stringify(queryData)) + "&totals=true",
			type: "GET",
			dataType: "json",
			success: function(data) {
				resolve(data);
				//if (data.totals.total == 0) {
					// No user found
					//return;
				//}
				// User found.  These are the user values as returned by the rest.db JSON.
				//var email = data.data[0].email;
				//var firstName = data.data[0].firstName;
				//var lastName = data.data[0].lastName;
				//var pwd = data.data[0].password;
				//var telephone = data.data[0].telephone;
				//var room = data.data[0].room;
				//var id = data.data[0]._id;
			},
			error: function(error) {
				console.log("Lookup User Error");
				reject(error);
			}
		});	
	});		
}

function setSpacesPublic(token, room) {
	$.ajax({
				   headers: {
								 'Accept': 'application/json',
								 'Content-type': 'application/json',
								 'Authorization': 'Bearer ' + token
				   },
				  data: JSON.stringify(
				   {
								 "settings": {
												"memberOnly":false
								 }
				   }),
				   url: 'https://spacesapis.avayacloud.com/api/spaces/' + room,
				   type: "POST",
				   dataType: "json",
				   contentType: 'application/json',
				   success: function(data) {
								 //console.log("Public success");
				   },
				   error: function(error) {
								 console.log("Public Error");
								 console.dir(`Error ${error}`);
				   }
	});                        
}