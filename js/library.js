const active = 'active';
var ajaxRequest = new XMLHttpRequest();

//executes when an ajax response is received
ajaxRequest.onreadystatechange = function(){
    if(ajaxRequest.readyState === 4 && ajaxRequest.status === 200) {
        var lib = JSON.parse(ajaxRequest.responseText);
        var list = document.querySelector("tbody");
        for(var i =0; i< lib.length; i++){

            var tbody = document.createElement('tbody');
            tbody.innerHTML = `<tr><td>${lib[i].Artist}<td>${lib[i].Album}<td>${lib[i].Title}`;
            var tr = tbody.children[0];
            tr.onclick = function(event){
                trackClick(event.target.parentElement);
            };
            list.appendChild(tr);
        }
        initAudio(document.querySelector('tbody tr:first-child'));
    }
};

ajaxRequest.open("GET", "library2", true);
ajaxRequest.send(null);

const repeatAll = 1, repeatOne = 2, repeatOff = 0;
var song = new Audio(), repeat = repeatAll;

var audioCtx = new AudioContext();

var countUp = false, volZeroPause = false;
var $playlist = document.querySelector('.playlist');
var $tracker = document.querySelector('.tracker');
var $volume = document.querySelector('.volume');
var $title = document.querySelector('.title');
var $artist = document.querySelector('.artist');
var $cover = document.querySelector('.cover');
var $stop = document.querySelector('.stop');
var $repeat = document.querySelector('.repeat');
var $play = document.querySelector('.play');
var $pause = document.querySelector('.pause');
var $mute = document.querySelector('.mute');
var $prv = document.querySelector('.prv');
var $nxt = document.querySelector('.nxt');
var $rwd = document.querySelector('.rwd');
var $lapsed = document.querySelector('.lapsed');

// EQ Properties
var gainDb = -40.0;
var bandSplit = [360,3600];
var hBand = audioCtx.createBiquadFilter();
hBand.type = "lowshelf";
hBand.frequency.value = bandSplit[0];
hBand.gain.value = gainDb;

var hInvert = audioCtx.createGain();
hInvert.gain.value = -1.0;

var mBand = audioCtx.createGain();

var lBand = audioCtx.createBiquadFilter();
lBand.type = "highshelf";
lBand.frequency.value = bandSplit[1];
lBand.gain.value = gainDb;

var lInvert = audioCtx.createGain();
lInvert.gain.value = -1.0;

function initAudio($elem) {
    song.pause();

    $title.textContent = $elem.children[2].textContent;
    $artist.textContent = $elem.children[0].textContent;

    var url = ['library'];
    if( $elem.children[0].textContent){
        url.push($elem.children[0].textContent);
    }
    if( $elem.children[1].textContent){
        url.push($elem.children[1].textContent);
    }
    url = url.join('/');
    $cover.setAttribute('src', url +  `/cover.jpg`);

    song.src = url+  '/'+$elem.children[2].textContent+'.mp3';
    song.volume = $volume.value;

    song.addEventListener('timeupdate',function (){
        $tracker.value = (song.currentTime / song.duration * 100)||0;
        if(countUp) {
            showTime(song.currentTime);
        }else{
            showTime(song.duration - song.currentTime);
        }
    });

    song.addEventListener('ended',function (){
        forward('ended');
    });

    removeClass(document.querySelector('tbody .active'), active);
    addClass($elem, active);
}

    var sourceNode = audioCtx.createMediaElementSource(song);

    sourceNode.connect(lBand);
    sourceNode.connect(mBand);
    sourceNode.connect(hBand);

    hBand.connect(hInvert);
    lBand.connect(lInvert);

    hInvert.connect(mBand);
    lInvert.connect(mBand);

    var lGain = audioCtx.createGain();
    var mGain = audioCtx.createGain();
    var hGain = audioCtx.createGain();

    lBand.connect(lGain);
    mBand.connect(mGain);
    hBand.connect(hGain);

    var sum = audioCtx.createGain();
    lGain.connect(sum);
    mGain.connect(sum);
    hGain.connect(sum);

    var panNde = audioCtx.createStereoPanner();
    sum.connect(panNde);

    panNde.connect(audioCtx.destination);

lGain.gain.value = parseFloat(document.querySelector('.low').value);
mGain.gain.value = parseFloat(document.querySelector('.mid').value);
hGain.gain.value = parseFloat(document.querySelector('.high').value);

function changeGain(string,type) {
    var value = parseFloat(string);

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
	if(promise !== undefined) {
			promise.catch(function() {
			//playback failed, so skip to the next track
			//$nxt.click();
			debugger;
			return
		});
	}
	$play.hidden = true;
	$pause.hidden = false;
}
function pauseAudio() {
    song.pause();
    $play.hidden = false;
    $pause.hidden = true;
}

$play.onclick = function () {
    if(!$play.hidden && $volume.value <= 0){
        song.volume = 0.1;
        $volume.value = 10;
    }
    playAudio();
};

$lapsed.onclick = function () {
    countUp = !countUp;
    if(countUp) {
        $lapsed.title = "Elapsed"
    }else{
        $lapsed.title = "To Go"
    }
};

$pause.onclick = function () {
    pauseAudio();
};

$nxt.onclick = function () {
    forward();
};

function forward(hasEnded){
    pauseAudio();

    if(hasEnded) {
        if(repeat === repeatOff){
            return
        }
    }

    var $next = document.querySelector('tbody .active').nextElementSibling;
    if(!$next) {
        $next = document.querySelector('tbody :first-child');
    }

    initAudio($next);
    playAudio();
}

$rwd.onclick = function () {
    //threshold to go to previous track
    if($tracker.value >= 5){
        song.currentTime = 0;
        return
    }
    pauseAudio();

    var $prev = document.querySelector('tbody .active').previousElementSibling;
    if(!$prev) {
        $prev = document.querySelector('tbody :last-child');
    }

    initAudio($prev);
    playAudio();
};
$stop.onclick = function () {
    pauseAudio();
 	song.currentTime = 0;
};
$repeat.onclick = function () {
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

$prv.onclick = function (e) {
    //threshold to go to previous track
    // if($tracker.value >= 5){
    //  song.currentTime = 0;
    //  return
    // }
    // pauseAudio();
    // mediaElement.pause();

    var $prev = document.querySelector('tbody tr.active').previousElementSibling;
    if(!$prev) {
        $prev = document.querySelector('tbody tr:last-child');
    }

    initAudio($prev);
    playAudio()
};

// show playlist
$cover.onclick = function () {
    $playlist.hidden = !$playlist.hidden
};

// playlist elements - click
function trackClick($elm){
    initAudio($elm);
    playAudio();
}

$tracker.oninput = function(event){
    song.currentTime = song.duration / event.target.max * event.target.value;
};

function removeClass($elm, clss){
    if($elm){
        $elm.classList.remove(clss);
    }
}
function addClass($elm, clss){
    if($elm){
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
$panCtrl.ondblclick = function() {
    panNde.pan.value = 0;
    $panVal.innerHTML = 0;
    $panCtrl.value = 0;
};

var muteVol;
$mute.onclick = function(){
	if($mute.classList.contains(active)) {
		song.volume = muteVol;
		removeClass($mute, active);
	}else{
		muteVol = song.volume;
		song.volume = 0;
		addClass($mute, active);
	}
};

$volume.ondblclick = function(){
	volZeroPause = !volZeroPause;
	if(!volZeroPause && song.volume <= 0 && song.currentTime > 0){
		song.volume = 0.1;
		$volume.value = 10;
		playAudio()
	}
};

$volume.oninput = function(){
	song.volume = $volume.value;
	if(volZeroPause) {
		if(song.volume <= 0) {
			pauseAudio();
		} else if(song.paused) {
			playAudio()
		}
	}
};