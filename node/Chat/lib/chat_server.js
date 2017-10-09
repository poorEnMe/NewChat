const socketio = require('socket.io');

let io;
let guestNumber = 1;
let nickname = {};
let nameUsed = [];
let currentRoom = {};


exports.listen= function (server) {
    io = socketio.listen(server);

    // io.set('log level',1);

    io.on('connection',function (socket) {

        console.log('connect');
        //分配昵称
        guestNumber = assignGusetName(socket,guestNumber,nickname,nameUsed);
        //默认放入大厅 lobby 休息室，理解为大厅
        joinRoom(socket,'Lobby');
        //处理信息
        handleMessageBroadcasting(socket,nickname);
        //更名尝试
        handleNameChangeAttemps(socket,nickname,nameUsed);
        //聊天室的创建和更名
        handleRoomJoining(socket);

        //用户请求已存在的rooms

        //过时代码
        //socket.on('rooms',()=>socket.emit('rooms',io.sockets.manager.rooms));
        socket.on('rooms',()=>socket.emit('rooms', io.of('/').adapter.rooms));

        handleClientDisconnection(socket,nickname,nameUsed);
    });
};

function assignGusetName(socket,guestNumber,nickname,nameUsed){
    let name = 'Guest' + guestNumber;
    nickname[socket.id] = name;
    socket.emit('nameResult',{
        success:true,
        name:name
    });

    nameUsed.push(name);
    return guestNumber+1;
}

function joinRoom(socket,room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});

    socket.broadcast.to(room).emit('message',{
        text:`${nickname[socket.id]} has joined ${room}.`
    });

    //原有old代码
    //let usersInRoom = io.sockets.clients();
    //let usersInRoom = io.of('/').in(room).clients();
    /*let usersInRoom = io.sockets.adapter.rooms[room];
    console.log(usersInRoom);
    let UsersSum = 'Users currently in '+room;
    console.log(usersInRoom.length);
    if(usersInRoom.length > 1){
        for(let socket in usersInRoom){
            //UserID
            let userSocketId = socket.id;
            console.log(111);
            console.log(userSocketId);
            // if(socket.id !== socket.id && index>0){
            //     UsersSum += ',';
            //     console.log(222);
            // }
            UsersSum += nickname[userSocketId];
        }
    }

    UsersSum += '.';
    socket.emit('message',{text:UsersSum});*/

    let usersInRoom = io.sockets.adapter.rooms[room];
    let length = Object.keys(usersInRoom).length;
    if(length > 1){
        let usersInRoomSummary = 'Users currently in ' + room + ':';
        let array = [];
        for(let index in usersInRoom){
            array.push(nickname[index]);
        }

        usersInRoomSummary += array.join(",") + '.';
        socket.emit('message',{text:usersInRoomSummary});
    }

}

function handleNameChangeAttemps(socket,nickNames,namesUsed) {
    socket.on('nameAttempt',(name)=>{
        if(name.search('/^Guest/') ===0){
            socket.emit('nameResult',{
                success:false,
                message:'NO "Guset" please'
            });
        }else{
            if(namesUsed.indexOf(name) === -1){
                let OldName = nickNames[socket.id];
                let OldNameIndex = namesUsed.indexOf(OldName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[OldNameIndex];

                socket.emit('nameResult',{
                    success:true,
                    name:name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:OldName+' Changes to'+name+'.'
                });
            }else {
                socket.emit('nameResult',{
                    success:false,
                    message:'Already in use'
                });
            }
        }
    });
}


function handleMessageBroadcasting(socket) {
    socket.on('message',function (message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickname[socket.id] + ':' + message.text
        });
    })
}

function handleRoomJoining(socket) {
    socket.on('join',(room)=>{
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}

function handleClientDisconnection(socket) {
    socket.on('disconnect',function () {
        let nameindex = nameUsed.indexOf(nickname[socket.id]);
        delete nameUsed[nameindex];
        delete nickname[socket.id];
    });
}


