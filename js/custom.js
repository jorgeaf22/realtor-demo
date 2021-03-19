$(document).ready(customInit);

function customInit() {
    document.getElementById('custom-image').addEventListener('change', handleFileSelect, false);
    $('#brandLogo').click(function() {
        $('#entryModeDiv').hide();
        $('#videoModeDiv').hide();
        $('#customSettingsDiv').show();
    });

    $('#leaveCustomButton').click(function() {
        $('#customSettingsDiv').hide();
        $('#entryModeDiv').show();
    });

    $('#saveCustomButton').click(function() {
        var color = $('#custom-color').val();
        console.log("Custom Color: ", color);
        localStorage.setItem('custom-color', color);

        color = $('#custom-text-color').val();
        console.log("Custom Text Color: ", color);
        localStorage.setItem('custom-text-color', color);

        $('#custom-color-status')[0].innerHTML = "Save Success!";
        checkCustomSettings();
    });

    $('#removeCustomSettingsButton').click(doClearStorage);

    checkCustomSettings();
}

function checkCustomSettings() {
    var imageData = localStorage.getItem('brandLogo.jpg');

    if (imageData) {
        $('#brandLogo')[0].src = imageData;
        $('#brandLogo').css({ 'width': '100%' });
    } else {
        $('#brandLogo')[0].src = window.location.pathname.replace('index.html', '') + 'images/abc.jpg';
    }

    var color = localStorage.getItem('custom-color');

    if (color) {
        $('.brandBackgroundColor').css({ 'background-color': color });
        $('.brandBackgroundColor').css({ 'border-color': color });
        //$('.brandBackgroundColor').hover(function(){$(this).css({'background-color' : color});} , function(){$(this).css({'background-color' : color});});

        $('.brandColor').css({ 'color': color });
        $('#custom-color').val(color);
    } else {
        color = '#95c7cb';
        $('.brandBackgroundColor').css({ 'background-color': color });
        $('.brandBackgroundColor').css({ 'border-color': color });
        //$('.brandBackgroundColor').hover(function(){$(this).css({'background-color' : color});} , function(){$(this).css({'background-color' : color});});

        $('.brandColor').css({ 'color': color });
        $('#custom-color').val(color);
    }

    color = localStorage.getItem('custom-text-color');

    if (color) {
        $('.brandText').css({ 'color': color });
        $('#custom-text-color').val(color);
    }
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        // Only process image files.
        if (!f.type.match('image.*')) {
            alert("Incompatible file type");
            //continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                localStorage.setItem('brandLogo.jpg', e.target.result);
                checkCustomSettings();
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }

    document.getElementById('custom-status').innerHTML = "Image upload complete";
}

function doClearStorage() {
    localStorage.removeItem("brandLogo.jpg");
    localStorage.removeItem("logo_sq.jpg");
    localStorage.removeItem("custom-color");
    localStorage.removeItem("custom-text-color");
    localStorage.setItem("isCustom", "false");
    document.getElementById('custom-status').innerHTML = "Images reset to default";
    document.getElementById('custom-color-status').innerHTML = "Colors reset to default";
    checkCustomSettings();

}