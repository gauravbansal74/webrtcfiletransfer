'use strict';

/**
 * @ngdoc function
 * @name publicApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the publicApp
 */

ArrayBuffer.prototype.name ="";
ArrayBuffer.prototype.lengthfile = "";
angular.module('publicApp')
  .controller('RoomCtrl', function ($sce, VideoStream, $location, $routeParams, $scope, Room) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    var stream,mypeerid;

    VideoStream.get()
    .then(function (s) {
      stream = s;
      Room.init(stream);
      stream = URL.createObjectURL(stream);
      if (!$routeParams.roomId) {
        Room.createRoom()
        .then(function (roomId) {
          $location.path('/room/' + roomId);
        });
      } else {
        Room.joinRoom($routeParams.roomId);
      }
    }, function () {
      $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
    });
    $scope.peers = [];
    Room.on('peer.stream', function (peer) {
      mypeerid = peer.id;
      console.log('Client connected, adding new stream');
      $scope.peers.push({
        id: peer.id,
        stream: URL.createObjectURL(peer.stream)
      });
    });
    Room.on('peer.disconnected', function (peer) {
      console.log('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
    };


    $scope.sendMessage = function(text){
      var data =  { msg:text,type:"text"};
      Room.sendtextmsg(JSON.stringify(data));
    };



    $scope.fileupload = function(){
        console.log("in");
      //console.log(changeEvent.target.files[0]);
    }

  }).directive("fileread", function (Room) {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var file = changeEvent.target.files[0];
                var filedetails =  { name:file.name, size:file.size,type:"file"};
                Room.sendtextmsg(JSON.stringify(filedetails));
                if(file.size == 0){
                  alert();
                  return;
                }
               //var data =Room.sendfiledetails(filedetails);
               //console.log("confirmation in controller",data);
                var chunkSize = 16384;
                var sliceFile = function(offset) {
                    var reader = new window.FileReader();
                    reader.onloadend = (function() {
                      return function(e) {
                        ArrayBuffer.prototype.name =file.name;
                        ArrayBuffer.prototype.lengthfile = file.size;
                        // var data = e.target.result;
                        // data.name = file.name;
                        // data.size = file.size;
                        Room.sendmsg(e.target.result);
                        if (file.size > offset + e.target.result.byteLength) {
                          window.setTimeout(sliceFile, 0, offset + chunkSize);
                        }
                       // sendProgress.value = offset + e.target.result.byteLength;
                      };
                    })(file);
                    var slice = file.slice(offset, offset + chunkSize);
                    reader.readAsArrayBuffer(slice);
                  };
                  sliceFile(0);
            });
        }
    }
});
