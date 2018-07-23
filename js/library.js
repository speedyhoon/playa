var ajaxRequest = new XMLHttpRequest();

//executes when an ajax response is received
ajaxRequest.onreadystatechange = function(){
    if(ajaxRequest.readyState === 4 && ajaxRequest.status === 200) {
        var lib = JSON.parse(ajaxRequest.responseText);
        var list = document.querySelector(".playlist");
        // var list = document.querySelector("tbody");
        for(var i =0; i< lib.length; i++){

           /* var tbody = document.createElement('tbody');
            tbody.innerHTML = "<tr><td>${lib[i].Artist}<td>lib[i].Album<td>lib[i].Title";
            var tr = tbody.children[0];
            tr.onclick = function(event){
                trackClick(event.target);
            };
            list.appendChild(tr);
            */

            var li = document.createElement('li');

            li.textContent = lib[i].Artist+', '+lib[i].Album+', '+lib[i].Title;
            li.setAttribute('audiourl', 'library/'+lib[i].Dir +'/'+ lib[i].File);
            li.setAttribute('artist', lib[i].Artist);
            li.setAttribute('album', lib[i].Album);
            li.setAttribute('cover', 'library/'+lib[i].Artist + '/'+lib[i].Album+'/cover.jpg');
            li.onclick = function(event){
                trackClick(event.target);
            };
            list.appendChild(li);

            initAudio(document.querySelector('.playlist li:first-child'));
        }
    }
};

ajaxRequest.open("GET", "library2", true);
ajaxRequest.send(null);

const repeatAll = 1, repeatOne = 2, repeatOff = 0;
var song, repeat = repeatAll, repeatUpTo = 0;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var panNde = audioCtx.createStereoPanner();

var countUp = false, volZeroPause = false;
var $playlist = document.querySelector('.playlist');
var $tracker = document.querySelector('.tracker');
var $volume = document.querySelector('.volume');
var $title = document.querySelector('.player .title');
var $artist = document.querySelector('.player .artist');
var $cover = document.querySelector('.player .cover');
var $stop = document.querySelector('.stop');
var $repeat = document.querySelector('.repeat');
var $play = document.querySelector('.play');
var $pause = document.querySelector('.pause');
var $fwd = document.querySelector('.fwd');
var $rew = document.querySelector('.rew');
var $lapsed = document.querySelector('.lapsed');



var lGain = audioCtx.createGain();
var mGain = audioCtx.createGain();
var hGain = audioCtx.createGain();
// var gainDb = -1.0;
var gainDb = 0;
var bandSplit = [360,3600];
var hBand = audioCtx.createBiquadFilter();
hBand.type = "lowshelf";
hBand.frequency.value = bandSplit[0];
hBand.gain.value = gainDb;

var hInvert = audioCtx.createGain();
// hInvert.gain.value = -1.0;
hInvert.gain.value = 0;

var mBand = audioCtx.createGain();

var lBand = audioCtx.createBiquadFilter();
lBand.type = "highshelf";
lBand.frequency.value = bandSplit[1];
lBand.gain.value = gainDb;

var lInvert = audioCtx.createGain();
lInvert.gain.value = 0;

function initAudio($elem) {
    $title.textContent = $elem.textContent;
    $artist.textContent = $elem.getAttribute('artist');
    $cover.setAttribute('src', $elem.getAttribute('cover'));

    song = new Audio($elem.getAttribute('audiourl'));
    song.volume = $volume.value/100;
    //song.preload = "auto"; //chrome sets this by default

    song.addEventListener('timeupdate',function (){
        $tracker.value = (song.currentTime / song.duration * 100)||0;
        if (countUp) {
            showTime(song.currentTime);
        }else{
            showTime(song.duration - song.currentTime);
        }
    });

    song.addEventListener('ended',function (){
        forward('ended');
    });

    removeClass(document.querySelector('.playlist .active'), 'active');
    addClass($elem, 'active');

    var sourceNode = audioCtx.createMediaElementSource(song);

    // var context = new AudioContext();
    // var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // var mediaElement = document.getElementById('player');
    // var sourceNode = audioCtx.createMediaElementSource(mediaElement);
    // var sourceNode = audioCtx.createMediaElementSource(song);

    // EQ Properties
    //


    sourceNode.connect(lBand);
    sourceNode.connect(mBand);
    sourceNode.connect(hBand);

    hBand.connect(hInvert);
    lBand.connect(lInvert);

    hInvert.connect(mBand);
    lInvert.connect(mBand);


    lBand.connect(lGain);
    mBand.connect(mGain);
    hBand.connect(hGain);

    var sum = audioCtx.createGain();
    sourceNode.connect(panNde);
    lGain.connect(sum);
    mGain.connect(sum);
    hGain.connect(sum);

    // sum.connect(panNde)
    // sum.connect(audioCtx.destination);

    panNde.connect(audioCtx.destination);
    sum.connect(panNde);
}

function changeGain(string,type) {
    var value = parseFloat(string) / 100.0;

    switch(type)
    {
        case 'lowGain': lGain.gain.value = value; break;
        case 'midGain': mGain.gain.value = value; break;
        case 'highGain': hGain.gain.value = value; break;
    }
}

function showTime(seconds){
    seconds = ~~seconds;
    $lapsed.textContent = ~~(seconds/60) +':'+ pad(seconds%60);
}

function pad(num) {
    return num >= 10 ? num : '0'+num;
}

function playAudio() {
    var promise = song.play();
    if (promise !== undefined) {
        promise.catch(function() {
            //playback failed, so skip to the next track
            $fwd.click();
        });
    }
    $play.hidden = true;
    $pause.hidden = false;
}
function pauseAudio(stop) {
    song.pause();
    if (stop) {
        song.currentTime = 0;
    }
    $play.hidden = false;
    $pause.hidden = true;
}

$volume.ondblclick = function (e) {
    volZeroPause = !volZeroPause;
    if(!volZeroPause && song.volume <= 0 && song.currentTime > 0){
        song.volume = 0.1;
        $volume.value = 10;
        playAudio()
    }
};

$play.onclick = function (e) {
    e.preventDefault();
    if (!$play.hidden && $volume.value <= 0){
        song.volume = 0.1;
        $volume.value = 10;
    }
    playAudio();
};

$lapsed.onclick = function (e) {
    // e.preventDefault();
    countUp = !countUp;
    if (countUp) {
        $lapsed.title = "Elapsed"
    }else{
        $lapsed.title = "To Go"
    }
};

$pause.onclick = function (e) {
    e.preventDefault();
    pauseAudio();
};

$fwd.onclick = function (e) {
    e.preventDefault();
    forward();
};

function forward(hasEnded){
    pauseAudio();

    if (hasEnded) {
        if (repeat === repeatOff){
            return
        }
    }

    var $next = document.querySelector('.playlist .active').nextElementSibling;
    if (!$next) {
        $next = document.querySelector('.playlist :first-child');
    }

    initAudio($next);
    playAudio();
}

$rew.onclick = function (e) {
    e.preventDefault();

    //threshold to go to previous track
    if ($tracker.value >= 5){
        song.currentTime = 0;
        return
    }
    pauseAudio();

    var $prev = document.querySelector('.playlist .active').previousElementSibling;
    if (!$prev) {
        $prev = document.querySelector('.playlist :last-child');
    }

    initAudio($prev);
    playAudio();
};
$stop.onclick = function (e) {
    e.preventDefault();
    pauseAudio(true);
};
$repeat.onclick = function (e) {
    e.preventDefault();
    repeat++;
    song.loop = repeat === repeatOne;
    switch(repeat){
        case repeatAll:
            $repeat.className = 'repeat repeatAll';
            $repeat.title = 'Repeat One';
            return;
        case repeatOne:
            $repeat.className = "repeat";
            $repeat.title = 'Repeat Off';
            return;
        default:
            repeat = repeatOff;
            $repeat.className = "repeat pause";
            $repeat.title = 'Repeat All';
    }
};

// show playlist
$cover.onclick = function (e) {
    e.preventDefault();
    $playlist.hidden = !$playlist.hidden
};

// playlist elements - click
function trackClick($elm){
    console.log($elm);
    pauseAudio();
    initAudio($elm);
    playAudio();
}

$volume.oninput = function (event){
    song.volume = $volume.value/100;
    if (volZeroPause) {
        if (song.volume <= 0) {
            pauseAudio();
        } else if (song.paused) {
            playAudio()
        }
    }
};

$tracker.oninput = function(event){
    song.currentTime = song.duration / event.target.max * event.target.value;
};

function removeClass($elm, clss){
    if ($elm){
        $elm.classList.remove(clss);
    }
}
function addClass($elm, clss){
    if ($elm){
        $elm.classList.add(clss);
    }
}

//left/right panning
var $panCtrl = document.querySelector('.panCtrl');
var $panVal = document.querySelector('.panVal');
$panCtrl.oninput = function() {
    panNde.pan.value = $panCtrl.value;
    $panVal.innerHTML = $panCtrl.value;
};