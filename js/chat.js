function init() {
    $('#message2').prop("readonly", true);
    $('#sendMsg2').prop("disabled", true);
    document.getElementById("connect2").innerHTML = "Connect";
}

var spacesToken;
var socketURL = "https://spacesapis-socket.avayacloud.com/chat";
var spacesID = "6054ed191be7f79fb49e26ad";
var socketio = "";
var password;
var modalChat;

function connectSocket() {
    socketio = io.connect(
        socketURL, {
            query: 'tokenType=jwt&token=' + spacesToken,
            transports: ['websocket']
        }
    );
    socketio.on('connect', function() {
        var spaceToSubscribe = {
            channel: {
                _id: spacesID,
                type: 'topic',
                password: password
            }
        };
        socketio.emit('SUBSCRIBE_CHANNEL', spaceToSubscribe);
        document.getElementById("connect2").innerHTML = "Disconnect";
    });

    socketio.on('disconnect', function() {
        console.log("Socket disconnect");
    });

    socketio.on('connect_error', function() {
        console.log("Socket connect_error");
    });

    socketio.on('error', function() {
        console.log("Socket error");
    });

    socketio.on('CHANNEL_SUBSCRIBED', function() {
        $('#chatMsg2').prop("disabled", false);
        $('#sendMsg2').prop("disabled", false);
        $('#message2').prop("readonly", false);
        populateChats();
        populateTasks();
        populateIdeas();
    });

    socketio.on('CHANNEL_UNSUBSCRIBED', function() {
        console.log("CHANNEL_UNSUBSCRIBED");
    });

    socketio.on('SUBSCRIBE_CHANNEL_FAILED', function() {
        console.log("SUBSCRIBE_CHANNEL_FAILED");
    });

    socketio.on('SEND_MESSAGE_FAILED', function(msg) {
        console.log("SEND_MESSAGE_FAILED");
    });

    socketio.on('MESSAGE_SENT', function(msg) {
        var category = msg.category;
        var message;
        var description;
        var strLength;
        if (category == "chat") {
            message = msg.content.bodyText;
            if (msg.content.data !== undefined) {
                if (msg.content.data.length > 0) {
                    message = msg.sender.displayname + ": " + msg.content.data[0].name + " " + msg.content.data[0].path;
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
            trace(message);
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
            trace(message);
        } else if (category == "idea") {
            message = msg.content.bodyText;
            path = msg.content.data[0].path;
            message = "Post: " + message + " / " + path;
            trace(message);
        }
    });
}

function populateChats() {
    $.ajax({
        headers: {
            'Authorization': 'jwt ' + spacesToken,
            'Accept': 'application/json',
            'spaces-x-space-password': password
        },
        url: 'https://spacesapis.avayacloud.com/api/spaces/' + spacesID + '/messages/query?category=chat&size=50',
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
                    message = msg.sender.displayname + ": " + msg.content.data[0].name + " " + msg.content.data[0].path;
                } else if (message.includes("<p>")) {
                    // Chat messages from Spaces come in the form <p>message goes here<p>
                    strLength = msg.content.bodyText.length;
                    // Decode ' and " characters
                    message = msg.sender.displayname + ": " + msg.content.bodyText.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                } else {
                    message = msg.sender.displayname + ": " + message.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                }
                console.log(message);
                trace("msg: " + message);
            }
        },
        error: function(error) {
            console.log(`Error ${error}`);
            console.log("error");
        }
    });
}

function populateTasks() {
    $.ajax({
        headers: {
            'Authorization': 'jwt ' + spacesToken,
            'Accept': 'application/json',
            'spaces-x-space-password': password
        },
        url: 'https://spacesapis.avayacloud.com/api/spaces/' + spacesID + '/messages/query?category=task&size=50',
        type: "GET",
        dataType: "json",
        success: function(data) {
            var entries = data.total;
            for (i = entries - 1; i >= 0; i--) {
                msg = data.data[i];
                var message = msg.content.bodyText;
                var description = msg.content.description;
                if (description.includes("<p>")) {
                    strLength = msg.content.description.length;
                    // Decode ' and " characters
                    message = "Task: " + message + " / " + description.substring(3, strLength - 4).replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                } else {
                    message = "Task: " + message + " / " + description.replace(new RegExp("&" + "#" + "x27;", "g"), "'").replace(/&quot;/g, '"');
                }
                trace(message);
            }
        },
        error: function(error) {
            console.log(`Error ${error}`);
        }
    });
}

function populateIdeas() {
    $.ajax({
        headers: {
            'Authorization': 'jwt ' + spacesToken,
            'Accept': 'application/json',
            'spaces-x-space-password': password
        },
        url: 'https://spacesapis.avayacloud.com/api/spaces/' + spacesID + '/messages/query?category=idea&size=50',
        type: "GET",
        dataType: "json",
        success: function(data) {
            var entries = data.total;
            for (i = entries - 1; i >= 0; i--) {
                msg = data.data[i];
                var message = msg.content.bodyText;
                var path = msg.content.data[0].path;
                message = "Post: " + message + " / " + path;
                trace(message);
            }
        },
        error: function(error) {
            console.log(`Error ${error}`);
        }
    });
}

function sendMsg() {
    var message = {
        content: {
            bodyText: $('#message2').val()
        },
        sender: {
            type: 'user'
        },
        category: 'chat',
        topicId: spacesID
    };

    socketio.emit('SEND_MESSAGE', message);
    document.getElementById('message2').value = "";
}

function clearTrace() {
    var consoleTxt = $('#console-log2').val();
    $('#console-log2').val("");
}

function disconnect() {
    var spaceToUnsubscribe = {
        channel: {
            _id: spacesID,
            type: 'topic',
            password: password
        }
    };
    socketio.emit('UNSUBSCRIBE_CHANNEL', spaceToUnsubscribe);
    init();
    clearTrace();
    socketio = null;
}

function startConnect() {
    if (document.getElementById("connect2").innerHTML == "Disconnect") {
        disconnect();
        return;
    }
    // input = document.getElementById("password2").value;
    // if (input.trim() != '') {
    //     password = document.getElementById("password2").value;
    // } else {
    //     password = null;
    // }

    $.ajax({
        data: JSON.stringify({
            "displayname": document.getElementById("userChat").value,
            "username": "Anonymous"
        }),
        url: "https://spacesapis.avayacloud.com/api/anonymous/auth",
        contentType: 'application/json',
        type: 'POST',
        success: function(data) {
            spacesToken = data.token;
            joinRoom();
            connectSocket();
			$('#sendMsg2').prop( "disabled", false );
			$('#message2').prop( "disabled", false );
        },
        error: function(error) {}
    });
}

function joinRoom() {
    // Join the space
    $.ajax({
        headers: {
            'Authorization': 'jwt ' + spacesToken,
            'Accept': 'application/json',
            'spaces-x-space-password': password
        },
        url: 'https://spacesapis.avayacloud.com/api/spaces/' + spacesID + '/join',
        type: "GET",
        success: function(data) {
            console.log("Room joined");
            console.dir(data);
        }
    });
}

function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
    var consoleTxt = $('#console-log2').val();
    var log = text;
    $('#console-log2').val(consoleTxt + "\n\n" + log);
}