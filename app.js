/* Earth Observatory — ES5 compatible. No libraries, no data stored remotely by this app. */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var SOURCES = {
    day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
    week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
    kp: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    weather: 'https://api.open-meteo.com/v1/forecast?latitude=45.764&longitude=4.8357&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FParis'
  };
  var mode = 'day', events = [], selected = null, lastOK = null, pending = 0;
  var connection = {quake: false, kp: false, weather: false};
  function el(id) { return document.getElementById(id); }
  function text(id, value) { el(id).textContent = value; }
  function trim(s, max) { return String(s || 'Location unavailable').substring(0,max); }
  function two(n) { return n < 10 ? '0' + n : String(n); }
  function when(t) {
    var d = new Date(t);
    if (isNaN(d.getTime())) return '—';
    return two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ' UTC';
  }
  function age(t) {
    var mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    if (mins < 1440) return Math.floor(mins / 60) + 'h ago';
    return Math.floor(mins / 1440) + 'd ago';
  }
  function doClock() {
    var d = new Date();
    text('utc-clock', two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ':' + two(d.getUTCSeconds()) + ' UTC');
  }
  function loadJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    var complete = false;
    try {
      xhr.open('GET', url, true);
      xhr.timeout = 16000;
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4 || complete) return;
        complete = true;
        if (xhr.status >= 200 && xhr.status < 300) {
          try { callback(null, JSON.parse(xhr.responseText)); }
          catch (e) { callback('Invalid JSON'); }
        } else { callback('Network or cross-origin error'); }
      };
      xhr.onerror = xhr.ontimeout = function () {
        if (!complete) { complete = true; callback('Network request failed'); }
      };
      xhr.send(null);
    } catch (e) { if (!complete) callback('Unsupported connection'); }
  }
  function setConnection(which, ok) {
    connection[which] = ok;
    var total = (connection.quake ? 1 : 0) + (connection.kp ? 1 : 0) + (connection.weather ? 1 : 0);
    var dot = el('overall-dot');
    dot.className = 'signal-dot ' + (total > 0 ? 'online' : 'error');
    text('connection-state', total === 3 ? 'ALL DATA FEEDS ONLINE' : (total ? total + ' / 3 DATA FEEDS ONLINE' : 'DATA FEEDS UNAVAILABLE'));
  }
  function magClass(m) { return m >= 5 ? 'high' : m >= 4 ? 'mid' : 'low'; }
  function formatMag(m) { return isFinite(m) ? Number(m).toFixed(1) : '—'; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function svgNode(tag, attrs) {
    var item = document.createElementNS(SVG_NS, tag);
    for (var p in attrs) if (attrs.hasOwnProperty(p)) item.setAttribute(p, attrs[p]);
    return item;
  }
  function setSelected(event, idx) {
    selected = idx;
    var p = event.properties;
    var m = Number(p.mag);
    var depth = event.geometry && event.geometry.coordinates ? Number(event.geometry.coordinates[2]).toFixed(1) : '?';
    // No untrusted HTML inserted — USGS text is assigned with textContent.
    var target = el('selection');
    clear(target);
    var big = document.createElement('strong');
    big.textContent = 'M ' + formatMag(m) + ' · ';
    target.appendChild(big);
    target.appendChild(document.createTextNode(trim(p.place,90)));
    var more = document.createElement('small');
    more.textContent = 'DEPTH ' + depth + ' KM  ·  ' + age(p.time) + '  ·  ' + when(p.time);
    target.appendChild(more);
    var pins = el('quake-pins').childNodes;
    for (var i = 0; i < pins.length; i++) {
      pins[i].setAttribute('class', pins[i].getAttribute('class').replace(/ active/g,''));
      if (pins[i].getAttribute('data-index') === String(idx)) pins[i].setAttribute('class', pins[i].getAttribute('class') + ' active');
    }
    var rows = el('events').getElementsByTagName('button');
    for (var j = 0; j < rows.length; j++) rows[j].className = j === idx ? 'event active' : 'event';
  }
  function paintMap() {
    var group = el('quake-pins'); clear(group);
    var frag = document.createDocumentFragment();
    for (var i = events.length - 1; i >= 0; i--) {
      var f = events[i];
      if (!f.geometry || !f.geometry.coordinates) continue;
      var coords = f.geometry.coordinates;
      var lon = Number(coords[0]), lat = Number(coords[1]), mag = Number(f.properties.mag);
      if (!isFinite(lon) || !isFinite(lat) || !isFinite(mag)) continue;
      var marker = svgNode('circle', {
        cx: ((lon + 180) * 960 / 360).toFixed(2),
        cy: ((90 - lat) * 480 / 180).toFixed(2),
        r: Math.max(4.0, Math.min(10.3, 3.1 + mag * 1.12)).toFixed(1),
        'class': 'quake-pin ' + magClass(mag),
        'data-index': i,
        'tabindex': '0',
        'aria-label': 'Magnitude ' + formatMag(mag) + ', ' + trim(f.properties.place,90)
      });
      var title = svgNode('title',{});
      title.textContent = 'M ' + formatMag(mag) + ' · ' + trim(f.properties.place,90);
      marker.appendChild(title);
      (function(index) {
        marker.addEventListener('click', function(){ setSelected(events[index],index); }, false);
        marker.addEventListener('keydown', function(e){ if (e.keyCode === 13 || e.keyCode === 32) { e.preventDefault(); setSelected(events[index],index); } }, false);
      })(i);
      frag.appendChild(marker);
    }
    group.appendChild(frag);
  }
  function renderEvents() {
    var target = el('events'); clear(target);
    if (!events.length) { var note = document.createElement('p');note.className='loading';note.textContent='No earthquakes in this feed window.';target.appendChild(note);return; }
    var maxRows = Math.min(5, events.length);
    for (var i = 0; i < maxRows; i++) {
      var f = events[i]; var mag = Number(f.properties.mag);
      var row = document.createElement('button');row.type='button';row.className='event';
      var number = document.createElement('span');number.className='magnitude ' + magClass(mag);number.textContent=formatMag(mag);
      var info = document.createElement('span');info.className='event-details';
      var place=document.createElement('span');place.className='event-place';place.style.display='block';place.textContent=trim(f.properties.place,100);
      var timing=document.createElement('span');timing.className='event-age';timing.style.display='block';timing.textContent=age(f.properties.time) + '  ·  ' + when(f.properties.time);
      info.appendChild(place);info.appendChild(timing);row.appendChild(number);row.appendChild(info);
      (function(index) { row.addEventListener('click', function(){ setSelected(events[index],index); }, false); })(i);
      target.appendChild(row);
    }
  }
  function loadQuakes() {
    var requestMode = mode;
    text('stat-count-foot','UPDATING USGS FEED…');
    loadJSON(SOURCES[requestMode], function(err, response) {
      if (requestMode !== mode) return;
      if (err || !response || !response.features) {
        setConnection('quake',false);
        text('stat-count-foot','UNABLE TO REACH USGS');
        if (!events.length) { text('stat-count','—');text('stat-largest','—');text('stat-recent','—');text('events','');
          var p=document.createElement('p');p.className='loading';p.textContent='USGS data unavailable. Check Wi-Fi and retry.';el('events').appendChild(p); }
        return;
      }
      events = response.features.filter(function(f) {
        return f && f.properties && f.properties.mag !== null && f.properties.mag !== '' && f.geometry && f.geometry.coordinates && isFinite(Number(f.properties.mag));
      }).sort(function(a,b){return Number(b.properties.time)-Number(a.properties.time);});
      setConnection('quake',true);
      text('stat-count',String(events.length));text('stat-count-foot','RECORDED EVENTS');
      var largest = null; for (var i=0;i<events.length;i++) if(!largest || Number(events[i].properties.mag) > Number(largest.properties.mag)) largest=events[i];
      text('stat-largest',largest ? formatMag(Number(largest.properties.mag)):'—');
      text('stat-largest-foot',largest ? trim(largest.properties.place,28).toUpperCase():'NO EVENTS');
      text('stat-recent',events.length ? age(events[0].properties.time):'—');
      text('stat-recent-foot',events.length ? 'LATEST REPORTED EVENT' : 'NO EVENTS');
      selected=null;text('selection','Tap a marker to inspect an earthquake.');
      paintMap();renderEvents();
      lastOK = Date.now();text('last-sync','USGS ' + when(lastOK));
    });
  }
  function loadSolar() {
    loadJSON(SOURCES.kp,function(err, response) {
      if (err || !response || !response.length) { setConnection('kp',false);text('solar-status','Feed unavailable');return; }
      var record=null;
      for(var i=response.length-1;i>=0;i--) {
        if(response[i] && !Array.isArray(response[i]) && response[i].Kp !== null && isFinite(Number(response[i].Kp))) {record=response[i];break;}
        if(response[i] && Array.isArray(response[i]) && response[i][1] !== null && isFinite(Number(response[i][1]))) {record={Kp:response[i][1],time_tag:response[i][0]};break;}
      }
      if (!record) {setConnection('kp',false);text('solar-status','No recent readings');return;}
      var kp=Number(record.Kp);
      text('stat-kp',kp.toFixed(1));text('stat-kp-foot','KP INDEX · 0–9');text('solar-kp',kp.toFixed(1));
      var label=kp>=5?'Geomagnetic storm':kp>=4?'Active conditions':kp>=3?'Unsettled conditions':'Quiet conditions';
      text('solar-status',label);
      text('solar-time','Interval start · ' + String(record.time_tag || '').replace('T',' ').slice(0,16) + ' UTC');
      var pointer=el('kp-pointer');pointer.style.left=(Math.max(0,Math.min(9,kp))/9*100)+'%';pointer.style.display='block';
      setConnection('kp',true);
    });
  }
  function weatherLabel(code) {
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 67) return 'Rain / drizzle';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Current conditions';
  }
  function loadWeather() {
    loadJSON(SOURCES.weather,function(err, response) {
      if (err || !response || !response.current || response.current.temperature_2m === null || !isFinite(Number(response.current.temperature_2m))) {
        setConnection('weather',false);text('weather-condition','Feed unavailable');return;
      }
      var d=response.current;
      text('stat-temp',Math.round(Number(d.temperature_2m))+'°');text('stat-temp-foot','CURRENT AIR TEMPERATURE');
      text('weather-temp',Math.round(Number(d.temperature_2m))+'°C');
      text('weather-condition',weatherLabel(Number(d.weather_code)));
      text('weather-wind','Wind ' + Math.round(Number(d.wind_speed_10m)) + ' km/h');
      text('weather-time',String(d.time||'').replace('T',' · '));
      setConnection('weather',true);
    });
  }
  function refreshAll() {
    if (document.hidden) return;
    doClock();loadQuakes();loadSolar();loadWeather();
  }
  function switchMode(newMode) {
    if (mode === newMode) return;
    mode=newMode;events=[];selected=null;clear(el('quake-pins'));
    text('window-label',mode==='day' ? '/ 24H · M2.5+' : '/ 7D · M4.5+');
    el('filter-day').className='filter ' + (mode==='day'?'active':'');
    el('filter-week').className='filter ' + (mode==='week'?'active':'');
    el('filter-day').setAttribute('aria-pressed',mode==='day'?'true':'false');
    el('filter-week').setAttribute('aria-pressed',mode==='week'?'true':'false');
    text('events','');var p=document.createElement('p');p.className='loading';p.textContent='Loading new earthquake window…';el('events').appendChild(p);
    loadQuakes();
  }
  el('filter-day').addEventListener('click',function(){switchMode('day');},false);
  el('filter-week').addEventListener('click',function(){switchMode('week');},false);
  el('manual-refresh').addEventListener('click',refreshAll,false);
  document.addEventListener('visibilitychange',function(){if(!document.hidden && (!lastOK || Date.now()-lastOK > 300000))refreshAll();},false);
  doClock();refreshAll();
  setInterval(doClock,30000);setInterval(refreshAll,600000);
})();
