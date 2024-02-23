'use strict';
const active = 'active', warning = 'warning',
	repeatAll = 1, repeatOne = 2, repeatOff = 0,
	ajaxRequest = new XMLHttpRequest();

//executes when an ajax response is received
ajaxRequest.onreadystatechange = function(){
	if(ajaxRequest.readyState === 4 && ajaxRequest.status === 200){
		let lib = JSON.parse(ajaxRequest.responseText);
		const list = document.querySelector("tbody");
		for(let i = 0; i < lib.length; i++){
			let tbody = document.createElement('tbody');
			tbody.innerHTML = `<tr><td>${lib[i].Artist}<td>${lib[i].Album}<td>${lib[i].Title}`;
			let tr = tbody.children[0];
			tr.onclick = function(event){
				trackClick(event.target.parentElement);
			};
			list.appendChild(tr);
		}
		initAudio(getFirstTrack());
		play();
	}
};

ajaxRequest.open("GET", "library2", true);
ajaxRequest.send(null);

let song = new Audio(), repeat = repeatAll;
song.addEventListener('timeupdate', function(){
	$tracker.value = (song.currentTime / song.duration * 100) || 0;
	if(countUp){
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

song.addEventListener('ended', function(){
	next(true);
});

song.addEventListener('error', function(e){
	e.preventDefault();
	handleMediaError(e);
});

function handleMediaError(e){
	//An error occurred or the user agent prevented playback
	if(e.target){
		console.warn(e.target.error);
		// return
	}else{
		console.warn(e);
	}

	let tr = getActiveTrack();
	addClass(tr, warning);
	if(tr && tr.nextElementSibling){
		next();
	}else{
		removeClass(tr, active);
	}
	return false;
}

function showTime(seconds){
	$lapsed.textContent = ~~(seconds / 60) + ':' + pad(~~seconds % 60);
}

function pad(num){
	return num >= 10 ? num : '0' + num;
}

//Equaliser properties
const resetEq = .5;
let audioCtx = new AudioContext(),
	gainDb = -40.0,
	bandSplit = [360, 3600],
	hBand = audioCtx.createBiquadFilter();
hBand.type = "lowshelf";
hBand.frequency.value = bandSplit[0];
hBand.gain.value = gainDb;

let hInvert = audioCtx.createGain();
hInvert.gain.value = -1.0;

let mBand = audioCtx.createGain();

let lBand = audioCtx.createBiquadFilter();
lBand.type = "highshelf";
lBand.frequency.value = bandSplit[1];
lBand.gain.value = gainDb;

let lInvert = audioCtx.createGain();
lInvert.gain.value = -1.0;

let sourceNode = audioCtx.createMediaElementSource(song);

sourceNode.connect(lBand);
sourceNode.connect(mBand);
sourceNode.connect(hBand);

hBand.connect(hInvert);
lBand.connect(lInvert);

hInvert.connect(mBand);
lInvert.connect(mBand);

let lGain = audioCtx.createGain();
let mGain = audioCtx.createGain();
let hGain = audioCtx.createGain();

lBand.connect(lGain);
mBand.connect(mGain);
hBand.connect(hGain);

let sum = audioCtx.createGain();
lGain.connect(sum);
mGain.connect(sum);
hGain.connect(sum);

let panNde = audioCtx.createStereoPanner();
sum.connect(panNde);

panNde.connect(audioCtx.destination);

let $low = document.getElementById('low');
let $mid = document.getElementById('mid');
let $high = document.getElementById('high');

lGain.gain.value = parseFloat($low.value);
mGain.gain.value = parseFloat($mid.value);
hGain.gain.value = parseFloat($high.value);

function changeGain($elem){
	$elem = $elem.target ? $elem.target : $elem;
	let value = parseFloat($elem.value);

	switch($elem.id){
		case 'low':
			lGain.gain.value = value;
			break;
		case 'mid':
			mGain.gain.value = value;
			break;
		case 'high':
			hGain.gain.value = value;
			break;
	}
}

//User Interface
let countUp = true, volZeroPause = false,
	$tracker = document.querySelector('.tracker'),
	$volume = document.querySelector('.volume'),
	$title = document.querySelector('.title'),
	$artist = document.querySelector('.artist'),
	$cover = document.querySelector('.cover'),
	$stop = document.querySelector('.stop'),
	$repeat = document.querySelector('.repeat'),
	$play = document.querySelector('.play'),
	$pause = document.querySelector('.pause'),
	$mute = document.querySelector('.mute'),
	$prv = document.querySelector('.prv'),
	$nxt = document.querySelector('.nxt'),
	$rwd = document.querySelector('.rwd'),
	$lapsed = document.querySelector('.lapsed');

function initAudio($elem){
	song.pause();

	$title.textContent = $elem.children[2].textContent;
	$artist.textContent = $elem.children[0].textContent;

	let url = ['library'];
	if($elem.children[0].textContent){
		url.push($elem.children[0].textContent);
	}
	if($elem.children[1].textContent){
		url.push($elem.children[1].textContent);
	}
	url = url.join('/');
	$cover.setAttribute('src', url + `/cover.jpg`);

	song.src = url + '/' + $elem.children[2].textContent + '.mp3';
	song.volume = $volume.value;

	removeClass(getActiveTrack(), active);
	addClass($elem, active);
}

$play.onclick = function(){
	if(!$play.hidden && $volume.value <= 0){
		volume(.1);
	}
	play();
};

function play(){
	song.play()
	.then(function(){
		removeClass(getActiveTrack(), warning);
		$play.hidden = true;
		$pause.hidden = false;
	})
	.catch(function(e){
		console.warn(e, song.src);
		// handleMediaError(e);
		return false;
	});
}

function getActiveTrack(){
	return document.querySelector('tbody .' + active);
}

function getFirstTrack(){
	return document.querySelector('tbody  tr:first-child');
}

function getLastTrack(){
	return document.querySelector('tbody tr:last-child');
}

$pause.onclick = function(){
	pause();
};

function pause(){
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
	if(countUp){
		$lapsed.title = "Elapsed"
	}else{
		$lapsed.title = "Remaining"
	}
};

$nxt.onclick = function(){
	next();
};

function next(hasEnded){
	if(hasEnded){
		if(repeat === repeatOff){
			return
		}
	}

	let $next = getActiveTrack();
	if($next && $next.nextElementSibling){
		$next = $next.nextElementSibling;
	}else{
		$next = getFirstTrack();
	}

	initAudio($next);
	play();
}

$rwd.onclick = function(){
	song.currentTime = 0;
};

$prv.onclick = function(){
	let $prev = getActiveTrack();
	if($prev && $prev.previousElementSibling){
		$prev = $prev.previousElementSibling;
	}else{
		$prev = getLastTrack();
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
	let $playlist = document.querySelector('table');
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

function removeClass($elm, className){
	if($elm){
		$elm.classList.remove(className);
	}
}

function addClass($elm, className){
	if($elm){
		$elm.classList.add(className);
	}
}

//left/right panning
let $panCtrl = document.querySelector('.panCtrl'),
	$panVal = document.querySelector('.panVal');
$panCtrl.oninput = function(){
	panNde.pan.value = $panCtrl.value;
	$panVal.innerHTML = $panCtrl.value;
};
$panCtrl.ondblclick = function(){
	panNde.pan.value = 0;
	$panVal.innerHTML = 0;
	$panCtrl.value = 0;
};

$mute.onclick = function(){
	song.muted = !song.muted;
	if($mute.classList.contains(active)){
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
	if(volZeroPause){
		if(song.volume <= 0){
			pause();
		}else if(song.paused){
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

document.querySelector('.shuffle').onclick = function(){
	let ul = document.querySelector('tbody'), i = ul.children.length;
	for(; i >= 0; i--){
		ul.appendChild(ul.children[Math.random() * i | 0]);
	}
};