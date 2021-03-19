var confUI = {
    presentedStream: 'REMOTE',
    receivingShare: false,
    attachedEventHandlers: false,
    contentSharingRendererZoom: 1, // because 100% on JSCSDK by default
    minZoomValue: 0.25, // e.g. 25% maxZoomValue = 3; // e.g. 300%
    maxZoomValue: 3,
    callDefaults: {
        hideVideo: false,
        muteAudio: false
    },
    device: {
        width: null,
        height: null,
        mobile: null
    },
    setUp: function() {
        confUI.width = $(document).width();
        confUI.height = $(document).height();
        confUI.mobile = confUI.checkMobile();

        if (confUI.mobile) {
            ///Apply mobile layout
            confUI.applyMobileStyle();
        } else {
            $('#showVideoButton').hide();
            $('.videoContentEl').css({ 'max-height': Math.floor(confUI.height * 0.50).toString() + "px" });
        }

        if (!confUI.attachedEventHandlers) {
            confUI.attachEventHandlers();
        }


        confUI.initialStyling();
    },

    applyMobileStyle: function() {
        $('#chatDisplayDiv').hide();
        $('#spacesControlsButtonGroup').css({ 'width': '100%', 'margin-left': '0%', 'margin-right': '0%' });
        $('#videoDisplayDiv').removeClass('col-9');
        $('#chatDisplayDiv').removeClass('col-3');
        $('#chatDisplayDiv').css({ 'width': '100%' });

        //$('#toggleVideoButton').css({'top' : '10%' , 'right' : '5%'});
        $('#toggleChatButton').show();
        $('#littleVideoDiv').hide();

        $('#showVideoButton').click(function() {
            $('#chatDisplayDiv').hide();
            $('#showVideoButton').hide();
            $('#videoDisplayDiv').show();

            setTimeout(function() {
                $('#showVideoButton').find('a').removeClass('active');
                $('#chatTab').find('a').addClass('active');
            }, 500);

        });

        $('#toggleChatButton').click(function() {
            $('#videoDisplayDiv').hide();
            $('#chatDisplayDiv').show();
            $('#showVideoButton').show();
        });

        $('#screenshare').prop('disabled', true);
        $('#screenshare').hide();

    },

    checkMobile: function() {
        var isMobile = false; //initiate as false
        // device detection
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
            isMobile = true;
        }

        return isMobile;

    },

    attachEventHandlers: function() {
        confUI.attachedEventHandlers = true;
        $('#connectSocket').click(openSpacesConference);
        $('#muteAudio').click(muteAudio);
        $('#muteVideo').click(muteVideo);
        $('#startRecording').click(startRecording);
        $('#screenshare').click(startSreenshare);

        $('#sendMsg').click(chatSpace);
        $('#joinSpaceButton').click(openSpacesConference);
        $('#joinSpaceButton').click(checkCustomSettings);
        $('#joinSpaceButton2').click(openSpacesConference);
        $('#joinSpaceButton2').click(checkCustomSettings);
        $('#find').click(openSpacesConference);

        $('#toggleVideoButton').click(confUI.toggleVideoStreams);

        $('#audioDefault').change(function() {
            var checked = $('#audioDefault')[0].checked;
            confUI.callDefaults.muteAudio = checked;
        });
        $('#videoDefault').change(function() {
            var checked = $('#videoDefault')[0].checked;
            confUI.callDefaults.hideVideo = checked;
        });



    },

    showSpeakerSettings: function() {
        console.log("Show Speaker Settings");
        confUI.hideVideoToggle();
        //Populate Audio Devices Select
        populateAudioDevices();

        if (confUI.mobile) {
            $('#toggleChatButton').hide();
        }
    },

    closeSpeakerSettings: function() {

        confUI.showVideoToggle();
        if (confUI.mobile) {
            $('#toggleChatButton').show();
        }

    },

    hideVideoToggle: function() {
        $('#toggleVideoButton').hide();
    },

    showVideoToggle: function() {
        $('#toggleVideoButton').show();
    },

    initialStyling: function() {
        $('#videoModeDiv').hide();
        $('#connectSocket').prop("disabled", false);
        $('#muteAudio').prop("disabled", true);
        $('#muteVideo').prop("disabled", true);
        $('#startRecording').prop("disabled", true);
        $('#screenshare').prop("disabled", true);
        $('#sendMsg').prop("disabled", true);
        $('#littleVideoDisplay2').hide();
        $('#screenReceiveFrame').hide();

        //$('.nonMainMediaControlButton').hide();
        //$('#SixBlocksDiv').hide();
        //$('.spacesRoomContent').hide();

        //$('.mediaControlButton').css({ 'border': '1px solid black' , 'color': 'white' , 'margin-top': '3%' ,  'margin-bottom' : '3%' , 'background-color': 'white'});
    },

    openSpacesConference: function() {
        $('#roomName')[0].innerHTML = "<span style='font-weight:bold;'> Meeting Room: </span>" + spaceId;
        $('#usernameDisplay')[0].innerHTML = userName;
        $('#videoModeDiv').show();

        presentedStream = "REMOTE";
        $('#localVideoElement').hide();
        $('#remoteVideoElement').show();
        $('#screenReceiveFrame').hide();
        var videoHeight = $('#remoteVideoElement').height();
        videoHeightConsole = videoHeight * 0.45;
        videoHeight = Math.floor(videoHeight).toString() + "px";
        videoHeightConsole = Math.floor(videoHeightConsole).toString() + "px";

        console.log("Max video height: ", videoHeight, videoHeightConsole);
        if (!confUI.mobile) {
            $('#chatDisplayDiv').css({ 'max-height': videoHeight });
            $('#console-log').css({ 'max-height': videoHeightConsole });

        }

        //confUI.prepareDefaults();

    },

    prepareDefaults: function() {
        if (confUI.callDefaults.hideVideo) {
            console.log("Muting Video By Default");
            muteVideo();
        }

        if (confUI.callDefaults.muteAudio) {
            console.log("Muting Audio By Default");
            muteAudio();
        }
    },

    readyToReceiveMedia: function() {
        document.getElementById("connectSocket").innerHTML = '<img src="./images/end-call@2.png" />';
        $('#muteVideo').prop("disabled", false);
        $('#muteAudio').prop("disabled", false);
        $('#startRecording').prop("disabled", false);
        $('#screenshare').prop("disabled", false);
        $('#sendMsg').prop("disabled", false);

        $('.nonMainMediaControlButton').show();

    },

    closeSpacesConference: function() {
        //$('#connectSocket').find('img')[0].src = './images/voice@2.png';
        $('#entryModeDiv').show();
        $('#videoModeDiv').hide();
    },

    muteVideo: function() {
        document.getElementById("muteVideo").innerHTML = '<img src="./images/video-off@2.png" />';
    },

    unmuteVideo: function() {
        document.getElementById("muteVideo").innerHTML = '<img src="./images/video@2.png" />';
    },

    muteAudio: function() {
        document.getElementById("muteAudio").innerHTML = '<img src="./images/audio-off@2.png" />';
    },

    unmuteAudio: function() {
        document.getElementById("muteAudio").innerHTML = '<img src="./images/audio@2.png" />';
    },

    startScreenShare: function() {
        console.log("Start screen share:");
        confUI.receivingShare = true;
        document.getElementById("screenshare").innerHTML = '<img src="./images/screenshare-off@2.png" />';
        $('#screenReceiveFrame').show();
        $('#screenReceiveFrame')[0].style.display = 'block';

        $('#littleVideoDisplay').removeClass('littleBigVideo');
        $('#littleVideoDisplay').addClass('littleVideos');
        $('#littleVideoDisplay2').show();

    },

    startScreenShareReceive: function() {
        console.log("Start screen share:");
        document.getElementById("screenshare").innerHTML = '<img src="./images/screenshare-off@2.png" />';
        $('#screenReceiveFrame').show();
        $('#screenReceiveFrame')[0].style.display = 'block';
        confUI.presentedStream = "REMOTE-SHARING";
        confUI.showCurrentVideoStream();
        $('#toggleVideoButton').hide();

        $('.zoomButton').show();
        //$('#chatDisplayDiv').hide();
    },

    stopScreenShare: function() {
        console.log("Stop screen share");
        document.getElementById("screenshare").innerHTML = '<img src="./images/screenshare-on@2.png" />';
        $('#screenReceiveFrame').hide();
        $('#screenReceiveFrame')[0].style.display = 'none';
        confUI.receivingShare = false;
        confUI.presentedStream = "REMOTE";
        confUI.showCurrentVideoStream();

        var activeChat = $('#chatTab').find('a').find('.active');
        var activePeople = $('#peopleTab').find('a').find('.active');
        if (confUI.mobile && (activeChat.length > 0 || activePeople.length > 0)) {
            $('#chatDisplayDiv').show();
            $('#toggleVideoButton').show();
        }

        if (!confUI.mobile) {
            $('#toggleVideoButton').show();
        }

        $('#littleVideoDisplay2').hide();
        $('#littleVideoDisplay').removeClass('littleVideos');
        $('#littleVideoDisplay').addClass('littleBigVideo');
        $('.zoomButton').hide();






    },

    startRecording: function() {
        document.getElementById("startRecording").innerHTML = '<img src="./images/filetype-mp4@2.png" />';
    },

    showCurrentVideoStream: function() {
        if (confUI.presentedStream == "REMOTE") {
            $('#localVideoElement').hide();
            $('#remoteVideoElement').show();
            $('#littleVideoDisplay')[0].srcObject = $('#localVideoElement')[0].srcObject;
        } else if (confUI.presentedStream == "LOCAL") {
            $('#remoteVideoElement').hide();
            $('#localVideoElement').show();
            $('#littleVideoDisplay')[0].srcObject = $('#remoteVideoElement')[0].srcObject;

        } else { //Sharing
            $('#remoteVideoElement').hide();
            $('#localVideoElement').hide();

            $('#littleVideoDisplay')[0].srcObject = $('#localVideoElement')[0].srcObject;
            $('#littleVideoDisplay2')[0].srcObject = $('#remoteVideoElement')[0].srcObject;
        }
    },

    toggleVideoStreams: function() {
        console.log("Toggle: ", confUI.presentedStream);
        if (confUI.presentedStream == "REMOTE") {
            $('#remoteVideoElement').hide();
            $('#localVideoElement').show();
            confUI.presentedStream = 'LOCAL';
            $('#littleVideoDisplay')[0].srcObject = $('#remoteVideoElement')[0].srcObject;
            $('#toggleVideoButton').show();
        } else if (confUI.presentedStream == 'LOCAL') {
            $('#localVideoElement').hide();
            $('#remoteVideoElement').show();
            confUI.presentedStream = 'REMOTE';
            $('#littleVideoDisplay')[0].srcObject = $('#localVideoElement')[0].srcObject;
            $('#toggleVideoButton').show();
        } else { //Sharing
            $('#toggleVideoButton').hide();
            $('#littleVideoDisplay')[0].srcObject = $('#localVideoElement')[0].srcObject;
            $('#littleVideoDisplay2')[0].srcObject = $('#localVideoElement')[0].srcObject;


        }
    },

    displayPeopleInMeeting: function(people) {
        console.log("Display People In Meeting: ", people);

        $('#peopleInMeeting').find('.personInMeeting').remove();
        var uniqueIds = [];
        for (var i = 0; i < people.length; i++) {
            if (uniqueIds.includes(people[i]['_id']) == true) {
                continue;
            }

            uniqueIds.push(people[i]['_id']);

            var displayName = people[i].displayname;
            if (attendeeId == people[i]['_id']) {
                displayName += " (You)";
            }
            var person = '<p class = "personInMeeting">' + displayName + '</p>';
            $('#peopleInMeeting').append(person);
        }
    },

    addToConsole: function(msg) {
        //var consoleTxt = $('#console-log').val();

        var span = confUI.createLogElement(msg);
        console.log("Span: ", span);
        $('#console-log').append(span);
        document.getElementById("console-log").scrollTop = document.getElementById("console-log").scrollHeight;
    },

    createLogElement: function(msg) {
        console.log("Create Log Element: ", msg);

        var span = document.createElement('span');
        $(span).addClass('log-element');

        var msgArray = msg.split(':');

        var sender = msgArray[0];
        var restMsg = "";
        for (var i = 1; i < msgArray.length; i++) {
            if (i == 1) {
                restMsg += " " + msgArray[i];
            } else {
                restMsg += ":" + msgArray[i];
            }
        }


        var sendSpan = document.createElement('span');
        $(sendSpan).addClass('log-element-sender');
        sendSpan.innerHTML = sender + ":";


        var msgSpan = document.createElement('span');
        $(msgSpan).addClass('log-element-msg');
        $(msgSpan).append(confUI.messageWithLink(restMsg));

        $(span).append(sendSpan);
        $(span).append(msgSpan);

        return span;

    },

    messageWithLink: function(msg) {
        if (!msg) {
            return msg;
        }
        //var regex = '[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)';
        //var re = new RegExp(regex,"g");

        //var matches = msg.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        console.log("PreMatch: ", msg);
        var matches = msg.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);

        console.log("Matches: ", matches);

        if (matches) {

            for (var i = 0; i < matches.length; i++) {
                msg = msg.replace(matches[i], '<a href = "' + matches[i] + '" target = "_blank">' + matches[i] + '</a>'); //target = '_blank' says to open in new tab or window
            }

        }

        console.log("MessageWithLink: ", msg);
        return msg;



    }
};