/////////////////////////////////////
/////   Socket Stuff
////////////////////////////////////
var room = generateRoomId();
var playersJoined = [false, false, false, false];

var socketController = {
    currentURL: window.location.href,
    loc: window.location,
    room: '',
    socket: io.connect(this.currentURL),
    phoneObj: {
        rotX: 0,
        rotY: 0,
        rotZ: 0
    },
    init: function() {


        //To catch when there is a port in the url, mainly for testing
        if (this.loc.port != undefined && this.loc.port > 1) {
            this.currentURL = this.loc.protocol + '//' + this.loc.hostname + ':' + this.loc.port;
        } else {
            this.currentURL = this.loc.protocol + '//' + this.loc.hostname;
        }

        if (debug) {
            console.log(window.location);
        };
    },
    connect: function() {
        socketController.socket.on('connect', this.socketConnected);
        socketController.socket.on('message', this.socketMessage);
        socketController.socket.on('moved', this.command);
        socketController.socket.on('motionDataOut', this.socketMotionDataOut);
        socketController.socket.on('sync', this.handleSync);

        this.updateInstructions();
    },
    socketConnected: function() {
        // Connected, let's sign-up for to receive messages for this room
        socketController.socket.emit('room', room);
        socketController.socket.emit('message', {
            msg: 'client joined room with ID ' + room,
            room: room
        });

        if (debug) {
            console.log('joined room ' + room);
        }
    },
    sendStartSignal: function(){
        socketController.socket.emit('message', {
            command: 'start',
            room: room
        })
    },
    socketMessage: function(data) {
        // console.log('Incoming message:', data);
        // console.log(data.command)
        if(data.command == 'stop'){
            // playing = false;
        }else if(data.command == 'start'){
            // playing = true;
        }
    },
    command: function(data) {
        console.log(data.player);
        if (cars[0] && playingWithPhone && data.room == room && data.player) {
            playerIndex = data.player - 1;
            carController.moveCar(cars[playerIndex], data.direction)
        }
        // console.log(data.direction)
    },
    socketMotionDataOut: function(data) {
        // console.log('Incoming motionData:', data);
        // Tilt Left/Right [gamma]
        // Tilt Front/Back [beta]
        // Direction [alpha]

        if (cars[0] && data && playingWithPhone && data.room == room) {
            playerIndex = data.player - 1;
            carController.rotateCar(cars[playerIndex], data.beta || 0)

        }
    },
    updateInstructions: function() {
        $('.urlFounded').html(this.currentURL);
        $('.instruct').fadeIn('fast')

        var genURL = this.currentURL + '/mobile/#' + room;

        console.log(genURL)

        // <span class="go_to_site">http://c.kerm.is/</span>
        //             <br>
        //              and enter <span class="room_id"></span>
        $('.room_id').html(room);

        $('.instruct').qrcode({
            text: genURL,
            render: "canvas", // 'canvas' or 'table'. Default value is 'canvas'
            background: "#000000",
            foreground: "#FFFFFF",
            width: 200,
            height: 200
        });

    },
    handleSync: function(data){
        if(data.room == room)
            switch(data.type){
                case 'status':
                    for (var i = 0; i < data.value.length; i++) {
                        $('.number-'+data.value[i]).css({color: 'red'});
                        playersJoined[data.value[i]-1] = true;
                    };
                    break;
                case 'sync':
                    console.log('player '+ data.value + ' joined');
                    break;
            }
    }

}

socketController.init();
socketController.connect();
