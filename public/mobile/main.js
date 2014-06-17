// var socket = io.connect('http://192.168.1.13:3000');
var currentURL = window.location.href,
    loc = window.location,
    angleOffset = 1,
    playing = false,
    cartChosen = false,
    cartChosenNumber;

var totalPlayers = 0;

if (loc.port != undefined) {
    var currentURL = loc.protocol + '//' + loc.hostname + ':' + loc.port;
} else {
    var currentURL = loc.protocol + '//' + loc.hostname;
}

var socket = io.connect(currentURL);

//get the room from URL param or from the zippie
var room = queryParam('roomNumber');
if (room == '') {
    room = location.hash.replace('#', '');
}

if (!room) {
    room = 'EmptyRoom' + Math.round(Math.random() * 100000)
}

room = room.toUpperCase();

var motionD, direction, sending;

$(function() {

    $('#accelerate').on('touchstart', function() {
        createjs.Sound.play("eng1", {
            loop: -1
        });
        direction = "forward"
        sendMove();
    });

    $('#reverse').on('touchstart', function() {
        direction = "back"
        sendMove();
    });

    $('button').on('touchend', function() {
        createjs.Sound.stop();
        clearInterval(sending);

        socket.emit('move', {
            direction: 'stop',
            room: room,
            player: cartChosenNumber
        });
    });

    $('#multiplayer-overlay button').on('click', function() {
        if (!$(this).hasClass('disables') && !cartChosen) {
            $(this).addClass('disabled');
            cartChosen = true;
            var buttonNumber = $(this).data('number');
            cartChosenNumber = buttonNumber;
            sendSync('join', buttonNumber)

            var color = 'red';
            switch(cartChosenNumber){
                case 1:
                    color = 'red';
                    break;
                case 2:
                    color = 'green';
                    break;
                case 3:
                    color = 'blue';
                    break;
                case 4:
                    color = 'black';
                    break;
            }
            $('.connect').html('You are the '+ color+' cart').css({
                color: color
            })
        };
    })

    joystick = new VirtualJoystick({
        container: document.getElementById('steeringWheel'),
        mouseSupport: true,
        // strokeStyle: '#1f7350'
        strokeStyle: '#696969',
    });


    socket.on('connect', function() {
        // Connected, let's sign-up for to receive messages for this room
        socket.emit('room', room);
        socket.emit('message', {
            msg: 'mobile joined room with ID ' + room,
            room: room
        });

        $('.connect').html("Connected to " + room);
    });

    socket.on('message', function(data) {
        console.log('Incoming message:', data.msg);
        console.log('Incoming message command:', data.command);

        if (data.room == room && data.command == 'start') {
            $('#multiplayer-overlay').fadeOut();

            socket.emit('move', {
                direction: 'stop',
                room: room,
                player: cartChosenNumber
            });
        }
    });

    socket.on('sync', function(data) {
        if (data.room == room) {
            handleSync(data);
        }
    })

    initSound();
    sendStatus();
})

function initSound() {

    console.log('test');

    if (!createjs.Sound.initializeDefaultPlugins()) {
        return;
    }

    var audioPath = "/../sound/";
    var manifest = [{
        id: "eng1",
        src: "eng1.wav"
    }, {
        id: "eng2",
        src: "eng2.wav"
    }];

    createjs.Sound.addEventListener("fileload", handleLoad);
    createjs.Sound.registerManifest(manifest, audioPath);
}

function handleLoad(event) {

}

var sendMove = function() {
    console.log(direction)
    sending = setInterval(function() {
        socket.emit('move', {
            direction: direction,
            room: room,
            player: cartChosenNumber
        });
    }, 125);
}

    function sendSync(type, value) {
        socket.emit('sync', {
            type: type,
            value: value,
            room: room
        });
    }

    function handleSync(data) {
        switch (data.type) {
            case 'join':

                $('button[data-number=' + data.value + ']').addClass('disabled');

                console.log('player ' + data.value + ' joined');

                break;
            case 'status':
                for (var i = 0; i < data.value.length; i++) {
                    $('button[data-number=' + data.value[i] + ']').addClass('disabled');
                };
                break;
        }
    }

    function sendStatus() {

        if (!playing) {
            setTimeout(function() {
                var cartsTaken = [];
                $('#multiplayer-overlay button.disabled').each(function() {
                    cartsTaken.push($(this).data('number'));
                })
                socket.emit('sync', {
                    type: 'status',
                    value: cartsTaken,
                    room: room
                });

                sendStatus();
            }, 500)
        }
    }

    function sendCommand(command) {

    }


setInterval(function() {

    if (cartChosen) {
        socket.emit('joystickMove', {
            room: room,
            up: joystick.up(),
            down: joystick.down(),
            left: joystick.left(),
            right: joystick.right(),
            player: cartChosenNumber
        })

    }

}, 1000 / 20)

/////// to get room from URL //////////

function queryParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return "";
    else return results[1];
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}
