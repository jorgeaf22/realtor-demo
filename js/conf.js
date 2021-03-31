// To create video connection to Spaces room:
//
// From HTML:  openSpacesConference()
// getSpacesToken()
//   Create anonymous user 
//   obtain authentication token  
// joinSpace()
//   Create socket.io connection
//   Subscribe to Space
//   In Subscribe callback, send presence update event, start video connection 
// startVideoForSpaces() 
//   Obtain MPaaS token
//   Create AvayaClientServices client
//   Create user
// initiateSpacesCall()
//   Create call and attach callbacks  
//   Start call
//   In Call Established callback, send Media Session Event -- conneced with audio/video.  Update presence
//   In Channels Updated callback, obtain remote video stream
//
// To end call:
//
// Unsubscribe from room
// Update presence
// End call
// Stop local and remote video displays

const DEFAULT_ROOM = "5f1f2f794758efceeeeb90a8"; // The default room is Andrew Prokop's IT Service Desk room
var token = null; // Token will be that of an anonymous user
//Spaces_Token is only required to delete a room
var SPACES_TOKEN = null;
var socketURL = "http://spacesapis-socket.avayacloud.com/chat";
var spaceId = DEFAULT_ROOM;
var connectionPayload = {
	query: "token=" + token + "&tokenType=jwt"
};
var socketConnection = "";
let conferenceCall = null;
let conferenceType = "";
let user = null;
var client;
var userName = "Anonymous User";
var videoUnmuted = true;
var audioUnmuted = true;
var onScreenShare = false;
var recording = false;
var inCall = false;
var recordingId = null;
var meetingId = null;
var password = null; // Thankfully, the Spaces APIs that use a password don't complain if you send null for a room that doesn't require one.
var attendeeId = null;

var collaborations;
var collaboration;

var remoteStream;
var localStream;
var mediaEngine;
var videoChannels;
var call;

var peopleInMeeting = [];
var micDevices = ["junk"];
var cameraDevices = ["junk"];
var speakerDevices = ["junk"];

let contentSharingRenderer;

var authenticatedToken;
var authenticatedSocketConnection;

$(document).ready(initConfSettings);

function initConfSettings() {
	console.log("setting incall to false");
	inCall = false;
	checkQueryParameters();
	confUI.setUp();
	videoUnmuted = true;
	audioUnmuted = true;
	onScreenShare = false;
	recording = false;

	initializeMicList();
	initializeCameraList();
	initializeSpeakersList();
}

function setSpaceId(room) {
	spaceId = room;
}

function populateAudioDevices() {
	console.log("Populate Audio Devices");
	displayMicDevices();
	displayCameraDevices();
	displaySpeakerDevices();
}

function displayMicDevices() {
	console.log("displayMicDevices");
	var audioInterface = client.getMediaServices().getAudioInterface().getInputInterface();
	$('#micList').find('option').remove();
	initializeMicList();
	audioInterface.getAvailableDevices().forEach(function (device) {
		if ((device._deviceId != "default") && (device._deviceId != "communications")) {
			addMicrophone(device._label, device._deviceId);
			micDevices.push(device);
		}
		console.log(device);
	});
};

function displayCameraDevices() {
	console.log("displayCameraDevices");
	var videoInterface = client.getMediaServices().getVideoInterface();
	$('#cameraList').find('option').remove();
	initializeCameraList();
	videoInterface.getAvailableDevices().forEach(function (device) {
		if ((device._deviceId != "default") && (device._deviceId != "communications")) {
			addCamera(device._label, device._deviceId);
			cameraDevices.push(device);
			console.log(device);
		}
	});
};

function displaySpeakerDevices() {
	console.log("displaySpeakerDevices");
	var speakersInterface = client.getMediaServices().getAudioInterface().getOutputInterface();
	$('#speakersList').find('option').remove();
	initializeSpeakersList();
	speakersInterface.getAvailableDevices().forEach(function (device) {
		if ((device._deviceId != "default") && (device._deviceId != "communications")) {
			addSpeaker(device._label, device._deviceId);
			speakerDevices.push(device);
		}
		console.log(device);
	});
};

function setMicrophone(device) {
	var audioInterface = client.getMediaServices().getAudioInterface().getInputInterface();
	audioInterface.setSelectedDevice(device);
}

function setCamera(device) {
	var videoInterface = client.getMediaServices().getVideoInterface();
	videoInterface.setSelectedDevice(device);
}

function setSpeakers(device) {
	var speakersInterface = client.getMediaServices().getAudioInterface().getOutputInterface();
	speakersInterface.setSelectedDevice(device);
}

function addMicrophone(label, deviceId) {
	var list1 = document.getElementById('micList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function addCamera(label, deviceId) {
	var list1 = document.getElementById('cameraList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function addSpeaker(label, deviceId) {
	var list1 = document.getElementById('speakersList');
	list1.options[list1.length] = new Option(label, deviceId);
}

function selectMic() {
	var list1 = document.getElementById('micList');
	console.log("Selected index " + list1.selectedIndex);
	mic = list1.options[list1.selectedIndex].value;
	console.log("Mic " + mic);
	if (list1.value != 'DEFAULT') {
		setMicrophone(micDevices[list1.selectedIndex]);
	}
}

function selectCamera() {
	var list1 = document.getElementById('cameraList');
	console.log("Selected index " + list1.selectedIndex);
	camera = list1.options[list1.selectedIndex].value;
	console.log("Camera " + camera);
	if (list1.value != 'DEFAULT') {
		setCamera(cameraDevices[list1.selectedIndex]);
	}
}

function selectSpeakers() {
	var list1 = document.getElementById('speakersList');
	console.log("Selected index " + list1.selectedIndex);
	speaker = list1.options[list1.selectedIndex].value;
	console.log("Speaker " + speaker);
	if (list1.value != 'DEFAULT') {
		setSpeakers(speakerDevices[list1.selectedIndex]);
	}
}

function initializeMicList() {
	micDevices = ["junk"];
	var list1 = document.getElementById('micList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', 'DEFAULT');
}

function initializeCameraList() {
	cameraDevices = ["junk"];
	var list1 = document.getElementById('cameraList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', 'DEFAULT');
}

function initializeSpeakersList() {
	speakerDevices = ["junk"];
	var list1 = document.getElementById('speakersList');
	list1.innerHTML = "";
	list1.options[0] = new Option('--Select--', 'DEFAULT');
}


window.onbeforeunload = function () {
	return "Do you really want to close?";
}

function sendToDialogflow(text) {
	var chatData = {
		message: text
	};

	$.ajax({
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/json'
		},
		url: 'https://ip-72-167-227-239.ip.secureserver.net:5000/dialogflow',
		type: "post",
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify(chatData),
		success: function (data) {
			sendMessage(data.response);
		},
		error: function (error) {
			console.log("Dialogflow error");
		}
	});
}

function chatSpace() {
	var chatData = {
		content: {
			bodyText: $('#message').val()
		}
	};

	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/chats',
		type: "post",
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify(chatData),
		success: function (data) {
			document.getElementById('message').value = "";
		},
		error: function (error) {
			console.log(`Error ${error}`);
		}
	});
}

function deleteRoomAccessToken() {
	$.ajax({
		headers: {
			'Accept': 'application/json'
		},
		url: 'https://ip-72-167-227-239.ip.secureserver.net:5000/getToken',
		type: "GET",
		success: function (data) {
			SPACES_TOKEN = data.accessToken;
			deleteRoom();
			console.log("Room Deleted");
		},
		error: function (error) {
			console.log("Room Not Deleted");
			console.log(`Error ${error}`);
		}
	});
}

function deleteRoom() {
	$.ajax({
		headers: {
			'Authorization': 'Bearer ' + SPACES_TOKEN,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId,
		type: "delete",
		success: function (data) {
			console.log("Room Deleted");
		},
		error: function (error) {
			console.log("Room Not Deleted");
			console.log(`Error ${error}`);
		}
	});
}

function writeToTrace(text) {
	console.log("writeToTrace " + text);
	text = text.trim();
	confUI.addToConsole(text);
}

function clearTrace() {
	var consoleTxt = $('#console-log').val();
	$('#console-log').val("");
}

function getMeetingIdAndRecord() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/activemeeting',
		type: "GET",
		dataType: "json",
		success: function (data) {
			meetingId = data["_id"];
			startRecordingFunction();
		},
		error: function (error) {
			console.log("Get Meeting ID Error");
			console.log(`Error ${error}`);
		},
		complete: function () {
		}
	});
}

function startRecordingFunction() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/meetings/' + meetingId + '/recordings',
		type: "POST",
		dataType: "json",
		contentType: 'application/json',
		success: function (data) {
			document.getElementById("startRecording").innerHTML = '<img src="./images/end@2.png" />';
			recording = true;
		},
		error: function (error) {
			console.log("Start Recording Error");
			console.log(`Error ${error}`);
		}
	});
}

function updateScreensharePresence(state) {
	onScreenShare = state;
	let presencePayload = {
		"category": "app.event.presence.party.online",
		"content": {
			"desktop": false,
			"idle": false,
			"mediaSession": {
				"audio": audioUnmuted,
				"connected": true,
				"phone": false,
				"screenshare": state,
				"selfMuted": false,
				"video": videoUnmuted
			},
			"offline": false,
			"role": "guest"
		},
		"topicId": spaceId
	};
	socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
}

function startSreenshare() {
	if (onScreenShare == false) {
		onScreenShare = true;
		confUI.startScreenShare();
		collaboration.getContentSharing().startScreenSharing();
		updateScreensharePresence(true);
	} else {
		updateScreensharePresence(false);
		confUI.stopScreenShare();
		collaboration.getContentSharing().end();
		startLocalVideo2(localStream);
	}
}

function startRecording() {
	if (recording) {
		stopRecording();
		return;
	}
	getMeetingIdAndRecord();
}

function stopRecording() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/meetings/' + meetingId + '/recordings/' + recordingId + '/stop',
		type: "POST",
		dataType: "json",
		success: function (data) {
			confUI.startRecording();
			recording = false;
		},
		error: function (error) {
			console.log(`Error ${error}`);
			console.dir(error);
		}
	});
}

function openSpacesConference() {
	console.log("openSpacesConference");
	console.log("incall 1 = " + inCall);
	if (inCall) {
		console.log("openSpacesConference close");
		closeSpacesConference();
		console.log("incall 2 = " + inCall);
		return;
	}
	// var input = document.getElementById("roomNumber").value;
	// if (input.trim() != '') {
	// 	spaceId = document.getElementById("roomNumber").value;
	// } else {
	// 	spaceId = DEFAULT_ROOM;
	// }

	if (token == null) {
		getSpacesToken().then(function () {
			joinSpace();
		}, function () {
			console.log("token failure");
		});
	} else {
		joinSpace();
	}
}

function startVideoForSpaces() {
	var mpaasToken = null;

	// Ask Spaces for the MPaaS token for this room
	$.ajax("https://spacesapis.avayacloud.com/api/mediasessions/mpaas/token/" + spaceId, {
		type: 'GET',
		headers: {
			Authorization: "jwt " + token,
			'spaces-x-space-password': password
		},
		success: (mpaasInfo) => {
			mpaasToken = mpaasInfo.token;

 			if (socketConnection) {
				// Create configuration with the media service context passed in.
				const userConfiguration = {
					mediaServiceContext: mpaasToken, // <- Set the MPaaS token here as the service context
					callUserConfiguration: {
						videoEnabled: true,
						incomingCall: true,
						retrieveDeviceLabelsEnabled: false
					},
					wcsConfiguration: {
						enabled: true
					},
					collaborationConfiguration: {
						contentSharingWorkerPath: "./js/lib/AvayaClientServicesWorker.min.js"
					}
				};

				// Create client object
				client = new AvayaClientServices();
				console.log("Client SDK Version = " + client.getVersion());

				// Create user object
				user = client.createUser(userConfiguration);

				// start() method will asynchronously set up connection to the MPaaS web user agent.
				user.start().then(function () {
					initiateSpacesCall();
				}, function () {
					console.log("user.start failure");
				});
			}
		}
	});
}

function initiateSpacesCall() {
	call = user.getCalls().createDefaultCall();

	call.setVideoMode(AvayaClientServices.Services.Call.VideoMode.SEND_RECEIVE);
	call.setWebCollaboration(true); // Set to true to enable web collaboration

	call.addOnCallIncomingVideoAddRequestDeniedCallback(function (call) {
		console.error("IncomingVideoAddRequestDenied");
	});
	call.addOnCallFailedCallback(function (call, callException) {
		console.error("call failed", callException);
	});
	call.addOnCallEndedCallback(function (call, event) {
		//console.log("call ended");
		//console.log(event);
	});
	call.addOnCallEstablishingCallback(function (call) {
		//console.log("call establishing...");
	});
	call.addOnCallVideoChannelsUpdatedCallback(function (call) {
		var mediaEngine = client.getMediaServices();
		var videoChannels = call.getVideoChannels();
		if (videoChannels[0]) {
			switch (videoChannels[0].getNegotiatedDirection()) {
				case AvayaClientServices.Services.Call.MediaDirection.RECV_ONLY:
					if (AvayaClientServices.Base.Utils.isDefined(remoteStream)) {
						startRemoteVideo(remoteStream);
					} else {
						remoteStream = null;
					}
					break;
				case AvayaClientServices.Services.Call.MediaDirection.SEND_ONLY:
					if (AvayaClientServices.Base.Utils.isDefined(localStream)) {
						startLocalVideo2(localStream);
					} else {
						localStream = null;
					}
					break;
				case AvayaClientServices.Services.Call.MediaDirection.SEND_RECV:
					remoteStream = mediaEngine.getVideoInterface().getRemoteMediaStream(videoChannels[0].getChannelId());
					localStream = mediaEngine.getVideoInterface().getLocalMediaStream(videoChannels[0].getChannelId());

					if (AvayaClientServices.Base.Utils.isDefined(localStream)) {
						startLocalVideo2(localStream);
					} else {
						localStream = null;
					}
					if (AvayaClientServices.Base.Utils.isDefined(remoteStream)) {
						startRemoteVideo(remoteStream);
					} else {
						remoteStream = null;
					}
					// Display buttons
					confUI.readyToReceiveMedia();
					break;
				case AvayaClientServices.Services.Call.MediaDirection.INACTIVE:
				case AvayaClientServices.Services.Call.MediaDirection.DISABLE:
				default:
					break;
			}
		}
	});
	call.addOnCallConferenceStatusChangedCallback(function (call) {
		console.log("C1");
		collaboration.addOnCollaborationServiceAvailableCallback(() => {
			console.log("C2");
			collaboration.getContentSharing().addOnContentSharingStartedCallback(() => {
				console.log("C3");
				if (onScreenShare) {
					contentSharingRenderer = new AvayaClientServices.Renderer.Konva.KonvaContentSharingRenderer();
					document.querySelector("#localVideoElement").srcObject = collaboration.getContentSharing().getOutgoingScreenSharingStream();
					document.querySelector("#littleVideoDisplay").srcObject = document.querySelector("#localVideoElement").srcObject;
					document.querySelector("#littleVideoDisplay2").srcObject = document.querySelector("#remoteVideoElement").srcObject;
				} else {
					confUI.contentSharingRendererZoom = 1; // because 100% on JSCSDK by default
					confUI.minZoomValue = 0.25; // e.g. 25% maxZoomValue = 3; // e.g. 300%
					contentSharingRenderer = initContentSharingRenderer();
					confUI.startScreenShareReceive();
				}
			});
			collaboration.getContentSharing().addOnContentSharingEndedCallback(() => {
				startLocalVideo2(localStream);
				console.log("addOnContentSharingEndedCallback");
			});
		});
		collaboration.addOnCollaborationServiceUnavailableCallback(() => {});
		collaboration.start().catch((e) => {
			console.log("Error starting collaboration: " + e);
		});
	});
	call.addOnCallEstablishedCallback(function (call) {
		conferenceCall = call;

		let mediaSessionPayload = {
			"category": "tracksstatus",
			"content": {
				"mediaSession": {
					"audio": true,
					"connected": true,
					"screenshare": false,
					"selfMuted": false,
					"video": true
				}
			},
			"topicId": spaceId
		};

		socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);

		let presencePayload = {
			"category": "app.event.presence.party.online",
			"content": {
				"desktop": false,
				"idle": false,
				"mediaSession": {
					"audio": true,
					"connected": true,
					"phone": false,
					"screenshare": false,
					"selfMuted": false,
					"video": true
				},
				"offline": false,
				"role": "guest"
			},
			"topicId": spaceId
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
		console.log("setting incall to true");
		inCall = true;

		try {
			collaborations = user.getCollaborations();
			collaboration = collaborations.getCollaborationForCall(call.getCallId());
			collaboration.addOnCollaborationStartedCallback(() => {
				console.log("Collaboration Started event...");
			});
			collaboration.addOnCollaborationInitializedCallback(() => {
				console.log("Collaboration Initialized event...");
			});
			collaboration.addOnCollaborationServiceAvailableCallback(() => {
				console.log("Collaboration Service Available event...");
			});
			collaboration.getContentSharing().addOnContentSharingEndedCallback(() => {
				console.log("Content Sharing Ended event...");
				confUI.stopScreenShare();
				updateScreensharePresence(false);
			});
		} catch (err) {
			console.log("Error: " + err.message);
		}
	});

	call.start();
}

function populateTraceChats() {
    $.ajax({
        headers: {
            'Authorization': 'jwt ' + token,
            'Accept': 'application/json',
            'spaces-x-space-password': password
        },
        url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/messages/query?category=chat&size=50',
        type: "GET",
        dataType: "json",
        success: function(data) {
            console.dir(data);
            var entries = data.total;
            var msg;
            var message;
            var strLength;
            for (i = entries - 1; i >= 0; i--) {
                msg = data.data[i];
                message = msg.content.bodyText;
                if (msg.content.data.length > 0) {
                    message = msg.sender.displayname + ": " + msg.content.data[0].name + " " + msg.content.data[0].fileId;
                } else if (message.includes("<p>")) {
                    // Chat messages from Spaces come in the form <p>message goes here<p>
                    strLength = msg.content.bodyText.length;
                    // Decode ' and " characters
                    message = msg.sender.displayname + ": " + msg.content.bodyText.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                } else {
                    message = msg.sender.displayname + ": " + message.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                }
                console.log(message);
                writeToTrace(message);
            }
        },
        error: function(error) {
            console.log(`Error ${error}`);
            console.log("error");
        }
    });
}

function populateTraceIdeas() {
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/messages/query?category=idea&size=50',
		type: "GET",
		dataType: "json",
		success: function (data) {
			var entries = data.total;
			for (i = entries - 1; i >= 0; i--) {
				msg = data.data[i];
				var message = msg.content.bodyText;
				var path = msg.content.data[0].path;
				message = msg.sender.displayname + ": " + message + " " + msg.content.data[0].fileId;
				writeToTrace(message);
			}
		},
		error: function (error) {
			console.log(`Error ${error}`);
		}
	});
}

function initContentSharingRenderer() {
	var contentSharingRenderer = new AvayaClientServices.Renderer.Konva.KonvaContentSharingRenderer();
	contentSharingRenderer.init(collaboration.getContentSharing(), 'screenReceiveFrame');
	return contentSharingRenderer;
}

function setZoom(value) {
	confUI.contentSharingRendererZoom += value;
	if (value !== undefined) {
		value = Math.max(Math.min(confUI.contentSharingRendererZoom, confUI.maxZoomValue), confUI.minZoomValue);
		contentSharingRenderer.zoom(confUI.contentSharingRendererZoom);
	}
}

function resetZoom() {
	confUI.contentSharingRendererZoom = 1;
	contentSharingRenderer.zoom(confUI.contentSharingRendererZoom);
}

function uploadFile() {
	getAccessToken().then(function(data) {
			startUploadFile(data.accessToken);
		}).catch(function(err) {
			console.log("getAccessToken Failure");
		})
}

function googleUpload(storageURL, fileKey) {
	var mySelectedFile = document.getElementById('fileName').files[0];
	$.ajax({
		url: storageURL,
		type: "put",
		processData: false,
		contentType: mySelectedFile.type,
		headers: {
			'Accept': 'application/json',
			'Content-type': mySelectedFile.type
		},
		data: mySelectedFile,
		success: function (result) {
			var post = {
				chatMessages: {},
				category: 'idea',
				content: {
					assignees: [],
					bodyText: mySelectedFile.name,
					description: mySelectedFile.name,
					status: "pending",
					data: [{
						"fileId": fileKey,
						"fileSize": mySelectedFile.size,
						"fileType": "document",
						"icon": "",
						"name": mySelectedFile.name,
						"provider": "native",
						"providerFileType": mySelectedFile.type
					}]
				},
				topicId: spaceId,
				version: "1.1"
			};
			console.log("Sending file " + authenticatedSocketConnection);
			authenticatedSocketConnection.emit('SEND_MESSAGE', post)
		},
		error: function (log) {
			// handle error
			console.log("Google Upload Error");
		}
	});
}

function startUploadFile(authToken) {
	var selectedFile = document.getElementById('fileName').files[0];
	console.dir(selectedFile);
	var uploadData = {
		files: [{
			"Content-Type": selectedFile.type,
			"Content-Length": selectedFile.size
		}]
	};
	$.ajax({
		headers: {
			'Authorization': 'Bearer ' + authToken,
			'Accept': 'application/json',
			'Content-type': 'application/json'
		},
		url: 'https://spacesapis.avayacloud.com/api/files/getuploadurl',
		type: "post",
		dataType: "json",
		contentType: 'application/json',
		data: JSON.stringify(uploadData),
		success: function (data) {
			var googleURL = data.data[0].url;
			var fileKey = data.data[0].fileKey;
			console.log("url : " + googleURL);
			googleUpload(googleURL, fileKey);
			document.getElementById("fileName").reset() ;
		},
		error: function (error) {
			console.log(`Error ${error}`);
		}
	});
}		

function connectAuthenticatedSocket() {
	getAccessToken().then(function(data) {
		authenticatedToken = data.accessToken;
		var connectionPayload = {
			query: "token=" + authenticatedToken + "&tokenType=oauth",
			transports: ['websocket']
		};
		authenticatedSocketConnection = io.connect(socketURL, connectionPayload);
		authenticatedSocketConnection.on('connect', function () {
			// On connect, subscribe to room
			var spaceToSubscribe = {
				channel: {
					_id: spaceId,
					type: 'topic',
					password: password
				}
			};
			authenticatedSocketConnection.emit('SUBSCRIBE_CHANNEL', spaceToSubscribe);
		});	
		authenticatedSocketConnection.on('SEND_MESSAGE_FAILED', function (error) {
			//console.log('Auth SEND_MESSAGE_FAILED ' + error);
		});		
		authenticatedSocketConnection.on('MESSAGE_SENT', function (msg) {
			//console.log('Auth MESSAGE_SENT');
		});	
	}).catch(function(err) {
			console.log("getAccessToken Failure");
	})	
}

function joinSpace() {
	input = document.getElementById("password").value;
	if (input.trim() != '') {
		password = document.getElementById("password").value;		
	} else {
		password = null;
	}

	// Join the space
	$.ajax({
		headers: {
			'Authorization': 'jwt ' + token,
			'Accept': 'application/json',
			'spaces-x-space-password': password
		},
		url: 'https://spacesapis.avayacloud.com/api/spaces/' + spaceId + '/join',
		type: "GET",
		success: function (data) {
			// Connect to websocket
			var socketURL = "https://spacesapis-socket.zang.io/chat";
			var connectionPayload = {
				query: "token=" + token + "&tokenType=jwt",
				transports: ['websocket']
			};
			connectAuthenticatedSocket();
			
			socketConnection = io.connect(socketURL, connectionPayload);

			socketConnection.on('connect', function () {
				// On connect, subscribe to room
				var spaceToSubscribe = {
					channel: {
						_id: spaceId,
						type: 'topic',
						password: password
					}
				};
				socketConnection.emit('SUBSCRIBE_CHANNEL', spaceToSubscribe);
			});

			socketConnection.on("CHANNEL_SUBSCRIBED", (channelInfo) => {
				// Once subscribed, start the process of calling the space
				populateTraceChats();
				populateTraceIdeas();
				let presencePayload = {
					"category": "app.event.presence.party.online",
					"content": {
						"desktop": false,
						"idle": false,
						"mediaSession": {
							"audio": false,
							"connected": false,
							"phone": false,
							"screenshare": false,
							"selfMuted": true,
							"video": false
						},
						"offline": false,
						"role": "guest"
					},
					"topicId": spaceId,
					"loopbackMetadata": "some metadata"
				};
				socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
				startVideoForSpaces();
				confUI.openSpacesConference();
			});

			socketConnection.on('MESSAGE_SENT', function (msg) {
				var category = msg.category;
				if (category == "chat") {
					message = msg.content.bodyText;
					if (msg.content.data !== undefined) {
						if (msg.content.data.length > 0) {
							message = msg.sender.displayname + ": " + msg.content.data[0].name + " " + msg.content.data[0].fileId;
							writeToTrace(message);
							return;
						}
					}						
					// Chat messages from Spaces come in the form <p>message goes here<p>
					if (message.includes("<p>")) {
						strLength = msg.content.bodyText.length;
						// Decode ' and " characters
						message = msg.sender.displayname + ": " + message.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					} else {
						message = msg.sender.displayname + ": " + message.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					}
					writeToTrace(message);
				} else if (category == "task") {
					message = msg.content.bodyText;
					description = msg.content.description;
					if (description.includes("<p>")) {
						strLength = msg.content.description.length;
						// Decode ' and " characters
						message = "Task: " + message + " / " + description.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					} else {
						message = "Task: " + message + " / " + description.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
					}
					writeToTrace(message);
				} else if (category == "idea") {
					message = msg.content.bodyText;
					path = msg.content.data[0].path;
					fileKey = msg.content.data[0].fileId;

/* 					callCuttly(path).then(function(data) {
						message = msg.sender.displayname + ": " + data.link;
						writeToTrace(message);
					}).catch(function(err) {
						console.log("Cuttly Failure");
					})	 */				
					
					message = msg.sender.displayname + ": " + msg.content.data[0].name + " " + fileKey;
					writeToTrace(message);
				}
			});

			socketConnection.on('connect_error', function (error) {
				console.log('Socket connection error: ' + error);
			});

			socketConnection.on('error', function (error) {
				console.log('Socket error: ' + error);
			});

			socketConnection.on('disconnect', function () {
				console.log('Socket disconnected.');
			});

			socketConnection.on('PRESENCE_EVENT_RESPONSE', function (msg) {
				console.log("Presence received");
				if (msg.category == "app.event.presence.party.online") {
					peopleInMeeting.push(msg.sender);
					confUI.displayPeopleInMeeting(peopleInMeeting);
					console.log(msg.sender.displayname + " is online.");
				} else if (msg.category == "app.event.presence.party.leaves") {

					peopleInMeeting = peopleInMeeting.filter(function (person) {
						return person['_id'] != msg.sender['_id'];
					});
					confUI.displayPeopleInMeeting(peopleInMeeting);
					console.log(msg.sender.displayname + " has left the room.");
				} else if (msg.category == "app.event.presence.request.parties") {
					// We are being requested to send our current presence status.
					let presencePayload = {
						"category": "app.event.presence.party.online",
						"content": {
							"desktop": false,
							"idle": false,
							"mediaSession": {
								"audio": audioUnmuted,
								"connected": true,
								"phone": false,
								"screenshare": onScreenShare,
								"selfMuted": false,
								"video": videoUnmuted
							},
							"offline": false,
							"role": "guest"
						},
						"topicId": spaceId
					};
					socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);
				}
			});

			socketConnection.on('MEDIA_SESSION_RESPONSE', (msr) => {
				if (msr.category == "app.event.recording.started") {
					console.log("Recording Started Data recording Id: " + msr.sender._id);
					recordingId = msr.content.recordings[0]._id;
				}

				if (msr.category == "app.event.meeting.started") { //Display attendees
					console.log("Meeting Started");
					console.log("Meeting Started Attendees: ", msr.content.attendees);
				}

				if (msr.category == "app.event.attendee.added") { //Do defaults
					if (!attendeeId) {
						attendeeId = msr.content.attendee['_id'];
						peopleInMeeting.push(msr.content.attendee);
						confUI.displayPeopleInMeeting(peopleInMeeting);
					}
				}
			});

			socketConnection.on('SEND_MESSAGE_FAILED', function (error) {
				//console.log('SEND_MESSAGE_FAILED' + error);
			});
		},
		error: function (error) {
			//console.log(`Error ${error}`);
			window.alert("The room could not be joined.");
		}
	});
}

function sendMessage(messageToSend) {
	var message = {
		content: {
			bodyText: messageToSend
		},
		category: 'chat',
		topicId: spaceId
	};
	socketConnection.emit('SEND_MESSAGE', message);
}

function getSpacesToken() {
	var input = document.getElementById("email3").value;
	if (input.trim() != '') {
		userName = document.getElementById("email3").value;
	}

	// Get Spaces token for anonymous user
	return new Promise(function (resolve, reject) {
		$.ajax("https://spacesapis.avayacloud.com/api/anonymous/auth", {
			data: JSON.stringify({
				"displayname": userName,
				"username": "Anonymous",
                "room": DEFAULT_ROOM
			}),
			contentType: 'application/json',
			type: 'POST',
			success: (data) => {
				//console.log(data);
				token = data.token;
				resolve(data);
			},
			error: () => {
				reject(null)
			}
		})
	})
}

function closeSpacesConference() {
	if (socketConnection) {
		let payload = {
			"channel": {
				"type": "topic",
				"_id": spaceId
			}
		};
		socketConnection.emit('UNSUBSCRIBE_CHANNEL', payload);
		authenticatedSocketConnection.emit('UNSUBSCRIBE_CHANNEL', payload);

		let presencePayload = {
			"category": "app.event.presence.party.leaves",
			"content": {
				"desktop": false,
				"idle": true,
				"mediaSession": {
					"audio": false,
					"connected": false,
					"phone": false,
					"screenshare": false,
					"selfMuted": true,
					"video": false
				},
				"offline": true,
				"role": "guest"
			},
			"topicId": spaceId,
			"loopbackMetadata": "some metadata"
		};
		socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);

		if (conferenceCall) {
			console.log("3");
			conferenceCall.end();
			stopLocalVideo();
			stopRemoteVideo()
			console.log("4");
		}
	}
	console.log("5");
	inCall = false;
	initConfSettings();
	console.log("6");
	token = null;
	clearTrace();
/* 	if (document.getElementById("delete").checked == true) {
		deleteRoomAccessToken();
	} */

	confUI.closeSpacesConference();
}

function muteVideo() {
	if (socketConnection) {
		if (videoUnmuted == false) {
			unmuteVideo();
			return;
		}
		videoUnmuted = false;
		conferenceCall.muteVideo().then(function () {
			let presencePayload = {
				"category": "app.event.presence.party.online",
				"content": {
					"desktop": false,
					"idle": false,
					"mediaSession": {
						"audio": audioUnmuted,
						"connected": true,
						"phone": false,
						"screenshare": onScreenShare,
						"selfMuted": false,
						"video": videoUnmuted
					},
					"offline": false,
					"role": "guest"
				},
				"topicId": spaceId,
				"loopbackMetadata": "some metadata"
			};
			socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);

			let mediaSessionPayload = {
				"category": "tracksstatus",
				"content": {
					"mediaSession": {
						"audio": audioUnmuted,
						"connected": true,
						"screenshare": onScreenShare,
						"selfMuted": false,
						"video": videoUnmuted
					}
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		}, function () {
			console.log("mute video failure");
		});
		confUI.muteVideo();
	}
}

function unmuteVideo() {
	if (socketConnection) {
		videoUnmuted = true;
		conferenceCall.unmuteVideo().then(function () {
			let presencePayload = {
				"category": "app.event.presence.party.online",
				"content": {
					"desktop": false,
					"idle": false,
					"mediaSession": {
						"audio": audioUnmuted,
						"connected": true,
						"phone": false,
						"screenshare": onScreenShare,
						"selfMuted": false,
						"video": videoUnmuted
					},
					"offline": false,
					"role": "guest"
				},
				"topicId": spaceId,
				"loopbackMetadata": "some metadata"
			};
			socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);

			let mediaSessionPayload = {
				"category": "tracksstatus",
				"content": {
					"mediaSession": {
						"audio": audioUnmuted,
						"connected": true,
						"screenshare": onScreenShare,
						"selfMuted": false,
						"video": videoUnmuted
					}
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		}, function () {
			console.log("unmute video failure");
		});
		confUI.unmuteVideo();
	}
}

function muteAudio() {
	if (socketConnection) {
		if (audioUnmuted == false) {
			unmuteAudio();
			return;
		}
		audioUnmuted = false;
		conferenceCall.muteAudio().then(function () {
			let presencePayload = {
				"category": "app.event.presence.party.online",
				"content": {
					"desktop": false,
					"idle": false,
					"mediaSession": {
						"audio": false,
						"connected": true,
						"screenshare": onScreenShare,
						"video": videoUnmuted
					},
					"offline": false,
					"role": "guest"
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);

			let mediaSessionPayload = {
				"category": "tracksstatus",
				"content": {
					"mediaSession": {
						"audio": false,
						"connected": true,
						"screenshare": onScreenShare,
						"selfMuted": true,
						"video": videoUnmuted
					}
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		}, function () {
			console.log("mute audio failure");
		});
		confUI.muteAudio();
	}
}

function unmuteAudio() {
	if (socketConnection) {
		audioUnmuted = true;
		conferenceCall.unmuteAudio().then(function () {
			let presencePayload = {
				"category": "app.event.presence.party.online",
				"content": {
					"desktop": false,
					"idle": false,
					"mediaSession": {
						"audio": true,
						"connected": true,
						"screenshare": onScreenShare,
						"video": videoUnmuted
					},
					"offline": false,
					"role": "guest"
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_PRESENCE_EVENT', presencePayload);

			let mediaSessionPayload = {
				"category": "tracksstatus",
				"content": {
					"mediaSession": {
						"audio": true,
						"connected": true,
						"screenshare": onScreenShare,
						"video": videoUnmuted
					}
				},
				"topicId": spaceId
			};
			socketConnection.emit('SEND_MEDIA_SESSION_EVENTS', mediaSessionPayload);
		}, function () {
			console.log("unmute audio failure");
		});
		confUI.unmuteAudio();
	}
}

function startRemoteVideo(stream) {
	var video = document.querySelector("#remoteVideoElement");
	video.srcObject = stream;
	if (confUI.presentedStream == "REMOTE") {
		$("#littleVideoDisplay")[0].srcObject = $("#localVideoElement")[0].srcObject;
	} else {
		$("#littleVideoDisplay")[0].srcObject = $("#remoteVideoElement")[0].srcObject;
	}
}

function stopRemoteVideo() {
	var video = document.querySelector("#remoteVideoElement");
	video.srcObject = null;
	document.querySelector("#littleVideoDisplay").srcObject = null;
}

function startLocalVideo2(stream) {
	console.log("Starting local video");
	var video = document.querySelector("#localVideoElement");
	video.srcObject = stream;
}

function stopLocalVideo() {
	var video = document.querySelector("#localVideoElement")
	video.srcObject = null;
}

function checkQueryParameters() {
	const urlParams = new URLSearchParams(window.location.search);
	var username = urlParams.get('username');
	var room = urlParams.get('room');

	if (room) {
		$('#roomNumber').val(room);
	}

	if (username) {
		$('#email').val(username);
	}
}// JavaScript Document