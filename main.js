var LOGIN_URL = 'https://www.google.com/accounts/ClientLogin'
var LOGIN_ADDITIONAL_PARAMS = 'accountType=HOSTED_OR_GOOGLE&service=cal'
var TITLE_UNREAD_COUNT_RE = /\s+\((\d+)(\+?)\)$/; 
var CAL_URL = 'http://www.google.com/reader/view/';
var SINGLE_FEED_URL = 'https://www.google.com/calendar/feeds/default/private/embed';
var FEED_URL_SUFFIX = '?toolbar=true&max-results=';
var ALL_FEEDS_URL = 'https://www.google.com/calendar/feeds/default/allcalendars/full';
var OWN_FEEDS_URL = 'https://www.google.com/calendar/feeds/default/owncalendars/full';

var REQUEST_TIMEOUT_MS = 30 * 1000; // 30 seconds

var lastCountText = 'start';
var requestTimeout;
console={log:function(m){window.opera.postError(m)}}

function init() {
    updateCal();
    window.setInterval(updateCal, 10000);
    //window.setInterval(updateCal, getRefreshInterval());
}
/**
 * Add leading 0 to a single digit number
 */
function pad(s) {
	return s < 10 ? '0'+s : s;
}
function updateCal() {
	console.log("update calendar...");
	if (getUserAuth()) {
		if (getCalendarType() === 'all') {
			getFeed(ALL_FEEDS_URL, handleCalendars);
		} else if(getCalendarType() === 'own') {
			getFeed(OWN_FEEDS_URL, handleCalendars);
		
		} else {
			getFeed(SINGLE_FEED_URL + FEED_URL_SUFFIX + getMaxEntries(), handleFeed);
		}
		
	} else {
		console.log('no auth!!!');
		displayNoAuth();
	}
		//xhr.open("GET", REQUEST_URL_, true)
		//xhr.setRequestHeader("Authorization","GoogleLogin auth=" + getUserAuth())
		//xhr.send(null)
}
function displayNoAuth(){
	document.getElementById('cal').innerHTML = 'Please log in!';
}
function handleFeed(data) {
	var entries = parseFeed(data);
	displayData(entries);
		
}
function handleMultiFeeds(data) {
	//TODO merge entries with allEntries
	//var entries = parseFeed(data);
	displayData(entries);
}

function handleCalendars(data) {
	var calendars = parseCalendars(data);
	for (var i = 0; i < entries.length; i++) {
		getFeed(entries[i].url + FEED_URL_SUFFIX + getMaxEntries(), handleMultiFeeds);
	}
		
}
function onError() {
	document.getElementById('cal').innerHTML = 'Unknown Error!';
	
}
function getFeed(feedUrl, handler) {

	var xhr = new XMLHttpRequest()
	var abortTimerId = window.setTimeout(function() {
		xhr.abort();
		onError();
	}, REQUEST_TIMEOUT_MS);

	function handleError(is401) {
		window.clearTimeout(abortTimerId);
		var text = 'Error while updating calendar!';
		if (is401) {
			text = 'Please log in!';
		}
		document.getElementById('cal').innerHTML = text;
	}

	try{
		xhr.onreadystatechange = function() {
			if (xhr.readyState != 4)
				return

			if (xhr.status >= 400) {
				console.log('Error response code: ' + xhr.status + '/' + xhr.statusText);
				handleError(xhr.status == 401);
			} else if (xhr.responseXML) {
				console.log('responseXML: ' + xhr.responseText.substring(0, 200) + '...');
				handler(xhr.responseXML);
			} else {
				console.log('No responseText!');
				handleError();
			}
		}
		xhr.onerror = function(error) {
			console.log('XHR error\n' + error);
			handleError();
		}
		xhr.open("GET", feedUrl, true)
		xhr.setRequestHeader("Authorization","GoogleLogin auth=" + getUserAuth())
		xhr.send(null)
	} catch(e) {
		console.log('XHR exception: ' + e);
		handleError();
	}
}
function parseFeed(xml) {
	//var parser = new DOMParser();
	//xml = parser.parseFromString(feed,"text/xml");
	var xmlEntries = xml.getElementsByTagName("entry");
	var allEntries = new Array(xmlEntries.length);
	for (var i = 0; i < xmlEntries.length; i++) {
		var title = xmlEntries[i].getElementsByTagName('title')[0].childNodes[0].nodeValue;
		var start = xmlEntries[i].getElementsByTagName('when')[0].attributes["startTime"].nodeValue;
		var end = xmlEntries[i].getElementsByTagName('when')[0].attributes["endTime"].nodeValue;
		allEntries[i] = { 'title' : title, 'start' : new Date(start), 'end' : new Date(end) };
	}
	var entries = {};
	for (var i = 0; i < allEntries.length; i++) {
		var e = allEntries[i];
		var key = e.start.getFullYear() + '-' + pad(e.start.getMonth()) + '-' + pad(e.start.getDate());
		if (key in entries) {
			entries[key].push(e);
		} else {
			entries[key] = [e];
		}
	}
	console.log("All: "+ allEntries.length + " XML Entries: " + xmlEntries.length);
	return entries;
}
function parseCalendars(xml) {
	//var parser = new DOMParser();
	//var xml = parser.parseFromString(feed,"text/xml");
	var xmlEntries = xml.getElementsByTagName("entry");
	var entries = new Array(xmlEntries.length);

	for (var i = 0; i < xmlEntries.length; i++) {
		var title = xmlEntries[i].getElementsByTagName('title')[0].childNodes[0].nodeValue;
		var url = xmlEntries[i].getElementsByTagName('content')[0].attributes["src"].nodeValue;
		var color = xmlEntries[i].getElementsByTagName('color')[0].attributes["value"].nodeValue;
		entries[i] = { 'url' : url, 'title' : title, 'color' : color };
	}
	return entries;
}
function displayData(entries) {
	var today = new Date();
	var s = "<ul>";
	for (var i in entries) {
		for (var j = 0; j < entries[i].length; j++) {
			s += "<li>" + entries[i][j].title + "</li>";
		}
	};
	s += "</ul>";
	
	document.getElementById('cal').innerHTML = s; 
}