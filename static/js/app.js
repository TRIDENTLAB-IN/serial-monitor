"use strict"
var ws = new WebSocket('ws://127.0.0.1:8080');
var port_list=null;
ws.onmessage=function(event){
  console.log(event.data);
  if(event.data.length > 5){
  try{
      var data = JSON.parse(event.data); // to JSON object
      switch(data.type){
        case "portlist":
          port_list = data.ports;
          update_port_list();
        break;
        case "sd":
        $("#sd").append('-->'+data.sdata+'<br>');
        break;
      }

  }catch(e){
    console.error(e);
  }
}


}

ws.onopen = function (event) {
  console.log("<-ws->");
  ws.send(JSON.stringify({"type":"cmd","cmd":"portlist"}));
};



$(document).ready(function() {

    $('.ds-layout').on('mdl-componentupgraded', function(e) {
        if ($(e.target).hasClass('ds-layout')) {
          init();
        }
    });


});

function init(){
  //refresh ports
  $( "#refreshports" ).click(function() {
    $("#ports").html("");
    ws.send(JSON.stringify({"type":"cmd","cmd":"portlist"}));
  });


}

//refresh ports
function refresh_port(){
  $("#ports").html("");
    ws.send(JSON.stringify({"type":"cmd","cmd":"portlist"}));
}

function update_port_list(){

  port_list.forEach(function(item,index){
    $("#ports").append('<option value="'+index+'">'+item.manufacturer+'</option>');
  });
  //componentHandler.upgradeDom();
}

function portcon(){
  //get id
  var port_index = $("#ports").val();
  var baud_rate = $("#baudrate").val();
  ws.send(JSON.stringify({"type":"cmd","cmd":"portcon","pi":port_index,"br":baud_rate}));
}
