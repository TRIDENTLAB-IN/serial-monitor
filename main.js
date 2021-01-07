const electron = require('electron')
    // Module to control application life.
const app = electron.app
    // Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')


let mainWindow

function createWindow() {
    // Create the browser window.
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
    mainWindow = new BrowserWindow({
        width: (width-500),
        height: (height-200),
        icon:'static/images/SM-512.png',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,

        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}
// This is required to be set to false beginning in Electron v9 otherwise
// the SerialPort module can not be loaded in Renderer processes like we are doing
// in this example. The linked Github issues says this will be deprecated starting in v10,
// however it appears to still be changed and working in v11.2.0
// Relevant discussion: https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse=false

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})
/////////////////////////////////////////CREATE WS server//////

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let pws = null;
wss.on('connection', function connection(ws) {
  pws=ws;
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    handlemsg(message,function(res){ws.send(res)})
  });
});

////////////////////////PORT SECTION //////////////
var portlist=[];
var port_lock=false;
var serial_port=null;


const SerialPort = require('serialport')
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const Readline = require('@serialport/parser-readline')
//const port = new SerialPort("/dev/ttyACM0", {
//    baudRate:115200,
//    databits: 8,
//    parity: 'none',
//    stopBits: 1})

//const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
//parser.on('data', console.log)

async function handlemsg(msg,callback){
  var result = "";
  var obj =JSON.parse(msg);
  switch(obj.type){
    case "cmd":
    handlecmd(obj.cmd,obj,function(cmdout){

      callback(cmdout);
    })

    break;

  }


  callback(result);

}

//handel cmds
async function handlecmd(cmd,obj,callback){

  switch(cmd){
    case "portlist":
    // list all ports
    portlist=[];
    await SerialPort.list().then((ports, err) => {
      //cleanup

      ports.forEach(function(item){
        if(item.manufacturer != undefined){
          portlist.push(item);
        }
      });
      var response = {"type":"portlist","ports":portlist};
      callback(JSON.stringify(response));
    });
    break;

    case "portcon":
    if(port_lock){

      //disconnect
      serial_port.close();
      port_lock= false;
      serial_port = null;
    }else{
      port_lock = true;

      var port_path =portlist[parseInt(obj.pi)].path;
      var baud_rate =parseInt(obj.br);

      serial_port = new SerialPort(port_path, {
          baudRate:baud_rate,
          databits: 8,
          parity: 'none',
          stopBits: 1})

      const parser = serial_port.pipe(new Readline({ delimiter: '\r\n' }))
      parser.on('data',function(data){
        pws.send(JSON.stringify({"type":"sd","sdata":data}));
      })
    }

    break;
  }
}
