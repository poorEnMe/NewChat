const http = require('http');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const chatServer = require('./lib/chat_server');


//for cache
let cache = {};

//if not found
function send404(response) {
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Err404');
    response.end();
}

//response html
function sendFile(response,filepath,fileContents) {
    response.writeHead(
        200,
        //path.basename : /doc/music/tohebe.mps =>tohebe.mps
        {"Content-Type":mime.getType(path.basename(filepath))}
    );
    response.end(fileContents);
}

//first cache,else from fs.readFile
//Static 静态的
function serverStatic(response,cache,absPath) {
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);

    }else{
        //原案例采用fs.exists，查阅官网废弃exists，直接读取，如报错，直接err
        fs.readFile(absPath,"utf-8",function (err,data) {
            if(err){
                send404(response);
            }else {
                cache[absPath] = data;
                sendFile(response,absPath,data);
            }
        });
    }


}

let server = http.createServer(function (req,res) {
    let filePath = false;


    if(req.url === '/'){
        filePath = 'public/index.html'
    }else{
        filePath = 'public'+req.url;
    }

    let absPath = './'+filePath;
    serverStatic(res,cache,absPath);
});



server.listen(3000,()=>console.log("server listening 3000"));
chatServer.listen(server);