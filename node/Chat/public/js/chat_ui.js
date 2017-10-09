
function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
    return $('<div></div>').html(`<i>${message}</i>`);
}

function processUserInput(chatApp,socket) {
    let message = $('#send-message').val();
    let systemMessage;

    if(message.charAt(0) === '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $('#message').append(divSystemContentElement(systemMessage));
        }
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#message').append(divEscapedContentElement(message));
        $('#message').scrollTop($('#message').prop('scrollHeight'));


    }
    $('#send-message').val('');
}

const socket = io();


$(document).ready(function () {
    let chatApp = new Chat(socket);

    socket.on('nameResult',function (result) {
        let message;

        if(result.success){
            message = `Your are known as ${result.name}.`;
        }else{
            message = result.message;
        }
        $('#message').append(divSystemContentElement(message));
    });

    socket.on('joinResult',function (result) {
        $('#room').text(result.room);
        $('#message').append(divSystemContentElement('Room changed'));

    });

    socket.on('message',function (message) {
        let newElement = $('<div></div>').text((message.text));
        $('#message').append(newElement);
    });



    socket.on('rooms',function (rooms) {
        $('#room-list').empty();

        //console.log(rooms);

        for(let room in rooms){
            // room = room.substring(1,room.length);
            //console.log(room);
            if(room !== ''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }
        $('#room-list div').click(function () {
            chatApp.processCommand('/join '+$(this).text());

            $('#send-message').focus();
        });
    });

    setInterval(()=>socket.emit('rooms'),5000);

    $('#send-message').focus();

    $('#send-form').submit(function () {
        processUserInput(chatApp,socket);
        return false;
    })


});
