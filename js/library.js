var ajaxRequest = new XMLHttpRequest();

//executes when an ajax response is received
ajaxRequest.onreadystatechange = function(){
    if(ajaxRequest.readyState === 4){
        // var response = ajaxRequest.responseText;
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

function initAudio($elem) {
    $title.textContent = $elem.textContent;
    $artist.textContent = $elem.getAttribute('artist');
    $cover.setAttribute('src', $elem.getAttribute('cover'));

    song = new Audio($elem.getAttribute('audiourl'));
    song.volume = $volume.value/100;

    song.addEventListener('timeupdate',function (){
        $tracker.value = (song.currentTime / song.duration * 100)||0;
    });

    song.addEventListener('ended',function (){
        forward('ended');
    });

    removeClass(document.querySelector('.playlist .active'), 'active');
    addClass($elem, 'active');
}
function playAudio() {
    song.play();
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

$play.onclick = function (e) {
    e.preventDefault();
    playAudio();
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

        //continue playing this track
        if (repeat === repeatOne) {
            song.currentTime = 0;
            playAudio();
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
    switch(repeat){
        case repeatAll:
            $repeat.className = 'repeat repeatAll';
            return;
        case repeatOne:
            $repeat.className = "repeat";
            return;
        default:
            repeat = repeatOff;
            $repeat.className = "repeat pause";
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
    if (event.target.value/100 <= 0){
        pauseAudio();
    }else if (song.paused){
        playAudio()
    }

    song.volume = event.target.value/100;
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