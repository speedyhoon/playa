const active = 'active',
	repeatAll = 1, repeatOne = 2, repeatOff = 0;
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
		play();
	}
};

ajaxRequest.open("GET", "library2", true);
ajaxRequest.send(null);

var song = new Audio(), repeat = repeatAll;
song.addEventListener('timeupdate',function(){
	$tracker.value = (song.currentTime / song.duration * 100)||0;
	if(countUp) {
		showTime(song.currentTime);
	}else{
		showTime(song.duration - song.currentTime);
	}

	//toggle previous & rewind buttons when media reaches 5 seconds
	if(song.currentTime >= 5){
		$rwd.hidden = false;
		$prv.hidden = true;
	}else{
		$rwd.hidden = true;
		$prv.hidden = false;
	}
});

song.addEventListener('ended',function(){
	next(true);
});

function showTime(seconds){
	$lapsed.textContent = ~~(seconds/60) +':'+ pad(~~seconds%60);
}

function pad(num) {
	return num >= 10 ? num : '0'+num;
}

//Equaliser properties
const resetEq = .5;
var audioCtx = new AudioContext();
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

var $low = document.getElementById('low');
var $mid = document.getElementById('mid');
var $high = document.getElementById('high');

lGain.gain.value = parseFloat($low.value);
mGain.gain.value = parseFloat($mid.value);
hGain.gain.value = parseFloat($high.value);

function changeGain($elem) {
	$elem = $elem.target ? $elem.target : $elem;
	var value = parseFloat($elem.value);

	switch($elem.id){
		case 'low': lGain.gain.value = value; break;
		case 'mid': mGain.gain.value = value; break;
		case 'high': hGain.gain.value = value; break;
	}
}

//User Interface
var countUp = true, volZeroPause = false;
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

	removeClass(document.querySelector('tbody .'+active), active);
	addClass($elem, active);
}

$play.onclick = function(){
	if(!$play.hidden && $volume.value <= 0){
		volume(.1);
	}
	play();
};
function play() {
	song.play()
	.catch(function(err) {
		//An error occurred or the user agent prevented playback
		var tr = document.querySelector('tbody .'+active);
		addClass(tr.querySelector('td:first-child'), 'warning');

		console.warn(err, song && song.src);
		if(tr.nextElementSibling){
			next();
		}
	});

	$play.hidden = true;
	$pause.hidden = false;
}

$pause.onclick = function(){
	pause();
};
function pause() {
	song.pause();
	$play.hidden = false;
	$pause.hidden = true;
}

$stop.onclick = function(){
	pause();
	song.currentTime = 0;
};

$lapsed.onclick = function(){
	countUp = !countUp;
	if(countUp) {
		$lapsed.title = "Elapsed"
	}else{
		$lapsed.title = "Remaining"
	}
};

$nxt.onclick = function(){
	next();
};
function next(hasEnded){
	if(hasEnded) {
		if(repeat === repeatOff){
			return
		}
	}

	var $next = document.querySelector('tbody .'+active).nextElementSibling;
	if(!$next) {
		$next = document.querySelector('tbody :first-child');
	}

	initAudio($next);
	play();
}

$rwd.onclick = function(){
	song.currentTime = 0;
};

$prv.onclick = function(){
	var $prev = document.querySelector('tbody .'+active).previousElementSibling;
	if(!$prev) {
		$prev = document.querySelector('tbody tr:last-child');
	}

	initAudio($prev);
	play();
};

$repeat.onclick = function(){
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
$cover.onclick = function(){
	var $playlist = document.querySelector('table');
	$playlist.hidden = !$playlist.hidden;
};

// playlist elements - click
function trackClick($elm){
	initAudio($elm);
	play();
}

$tracker.oninput = function(event){
	song.currentTime = (song.duration || 0) / event.target.max * event.target.value;
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

$mute.onclick = function(){
	song.muted = !song.muted;
	if($mute.classList.contains(active)) {
		removeClass($mute, active);
	}else{
		addClass($mute, active);
	}
};

$volume.ondblclick = function(){
	volZeroPause = !volZeroPause;
	if(!volZeroPause && song.volume <= 0 && song.currentTime > 0){
		volume(.1);
		play();
	}
};

$volume.oninput = function(){
	song.volume = $volume.value;
	if(volZeroPause) {
		if(song.volume <= 0) {
			pause();
		} else if(song.paused) {
			play();
		}
	}
};
function volume(value){
	song.volume = value;
	$volume.value = value;
}

function reset(event){
	event.target.value = resetEq;
	changeGain(event.target);
}

document.getElementById('resetEq').onclick = function(){
	$low.value = resetEq;
	$mid.value = resetEq;
	$high.value = resetEq;
	changeGain($low);
	changeGain($mid);
	changeGain($high);
};

$low.oninput = changeGain;
$low.ondblclick = reset;

$mid.oninput = changeGain;
$mid.ondblclick = reset;

$high.oninput = changeGain;
$high.ondblclick = reset;