/**
 * Stellt seitenübergreifende JavaScript-Funktionen zur Verfügung
 * 
 * @author bauer & bauer medienbuero <contact@headwork.de>
 * @copyright bauer & bauer medienbuero | www.headwork.de
 * @version SVN: $Id: content.js 224 2011-11-30 09:29:28Z sas65195 $
 *
 * Modifiziert durch UR
 */
 
 jQuery.support.transition = (function(){
	var thisBody = document.body || document.documentElement,
	thisStyle = thisBody.style,
	support = thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined;

	return support;
})();
 
(function(jQuery) {
'use strict';


/************************************************************/
/*															*/
/*					Allgemeine Funktionen					*/
/*															*/
/************************************************************/

if ( window.ur == null || typeof(window.ur) == 'undefined' )
			window.ur = new Object();
		
window.ur.init = function() {
	this.initTabs();
	this.initSearch();
	this.initLightbox();
	this.initBackButton();
	
	if (! jQuery.support.transition) {
			this.navigation.init();
	}
	
}
	
window.ur.initSearch = function() {
	var input = jQuery('#quicksearch-input'),
		defaultVal = input.val();
	
	// Legacy: Maybe this attribute is still set in some old pages
	jQuery('#quicksearch-form').removeAttr('onsubmit');

	input.bind({
		'focus': function() {
			if (this.value === defaultVal) { this.value = ''; }
		},
		'blur': function() {
			if (this.value === '') { this.value = defaultVal; }
		}
	});
}
	
window.ur.initTabs = function() {
	var tabs = jQuery('.tabs');
	if (tabs.length && jQuery.isFunction(tabs.accessibleTabs)) {
		tabs = tabs.accessibleTabs({
			tabhead: 'h2.tab',
			fx: 'fadeIn',
			fxspeed: 'fast',
			autoAnchor: true,
			currentInfoText: 'Ausgewählter Tab: '
		});

		jQuery('a[href^="#tab_"]').click(function(e) {
			e.preventDefault();
			tabs.showAccessibleTabSelector(jQuery(this).attr('href'));
			location.hash = jQuery(this).attr("href"); // eds: Verweis auf Tab der gleichen Seite --> Scrolle zum Anker
		});

		// eds: Link auf Tab einer anderen Seite --> Scrolle zum Anker
		var anchor = window.location.href.match(/#tab_\d+_\d+$/);
		if (anchor)
			location.hash = anchor;
	}
}
	
window.ur.initLightbox = function() {
	var boxes = jQuery('a[rel*=lightbox]');
	if (boxes.length) {
		boxes.lightBox({
			toggleNavigation: false,
			imageLoading: '/res/lightbox/images/loading.gif',
			imageBtnClose: '/res/lightbox/images/close.gif',
			imageBlank: '/res/lightbox/images/blank.gif'
		});
	}
}
	
window.ur.initBackButton = function() {
	if (jQuery('div.menu-left').length) {
	    
	    var match = navigator.userAgent.match('MSIE (.)');
        if (!match || match.length <= 1 || match[1] >= 8)
        {
    		var page = this.storage.getItem('page'),
    			path = this.storage.getItem('path'),
    			title = this.storage.getItem('title');
    			
    		if (page && path && title) {
    			jQuery('a.link-back')
    				.attr('href', page + '#' + path)
    				.addClass('orientation')
    				.text(title);
    		}
	    }
	}
}

/************************************************************/
/*															*/
/*				Funktionen für die Navigation				*/
/*															*/
/************************************************************/

if ( window.ur.navigation == null || typeof(window.ur.navigation) == 'undefined' )
			window.ur.navigation = new Object();
			
window.ur.navigation.init = function() {
	var container = jQuery('.exported_imperia_footer').length ? jQuery('.exported_imperia_footer') : jQuery('.navigation');
	container.addClass('no-transition'); // var container = $('.navigation').addClass('no-transition'); 
	if (container.length) {
		this.content = jQuery('#navigation-content');
		this.headerLink = jQuery('#navigation-header a');
		
		this.initialContentHeight = this.content.height();
		this.content.height(0);
		
		container.bind({
			'mouseenter focusin': jQuery.proxy(this.onShow, this),
			'mouseleave focusout': jQuery.proxy(this.onHide, this)
		});
		
		this.headerLink.click(jQuery.proxy(this.onToggle, this));
	}
}

window.ur.navigation.onShow = function() {
	var self = this;
	this.content
		.stop(true)
		.animate({'height': this.initialContentHeight}, 400, function() {
			self.headerLink.addClass('active');
		});
}

window.ur.navigation.onHide = function() {
	var self = this;
	this.content
		.stop(true)
		.animate({'height': 0}, 200, function() {
			self.headerLink.removeClass('active');
		});
}

window.ur.navigation.onToggle = function() {
	if (this.content.height()) {
		this.onHide();
	} else {
		this.onShow();
	}
	return false;
}

/************************************************************/
/*															*/
/*					Klasse Storage							*/
/*															*/
/************************************************************/
		
window.ur.storage = (function() {
	var windowName = function() {
	
		// Private Members //
		
		var dataContainer = {},
			encode = encodeURIComponent,
			decode = decodeURIComponent;

		function linearize() {
			var encodedData = jQuery.map(dataContainer, function(value, key) {
				return encode(key) + '=' + encode(value);
			});
			return encodedData.join('&');
		}

		function read() {
			if (window.name === '' || window.name.indexOf('=') === -1) { return; }
			var encodedData = window.name.split('&');
			
			jQuery.each(encodedData, function(i, val) {
				if (val === '') { return true; }
				var pair = val.split('='),
					key = decode(pair[0]),
					value = decode(pair[1]);
				dataContainer[key] = value;
			});
		}

		function write() {
			window.name = linearize();
		}

		// Public Members //
		// Missing length prop and key method because we don't use them
		
		this.setItem = function(key, value) {
			dataContainer[key] = value;
			write();
		};

		this.getItem = function(key) {
			return dataContainer[key];
		};

		this.removeItem = function(key) {
			if (typeof dataContainer[key] !== 'undefined') {
				delete dataContainer[key];
			}
			write();
		};

		this.clear = function() {
			dataContainer = {};
			write();
		};

		// Construction //
		
		read();
	};		
	
	return typeof sessionStorage !== 'undefined'
		 ? sessionStorage
	     : windowName;
})()


/************************************************************/
/*															*/
/*					eds: Einbinden von Piwik				*/
/*															*/
/************************************************************/

if ( window.ur.webanalyse == null || typeof(window.ur.webanalyse) == 'undefined' )
			window.ur.webanalyse = new Object();
			
window.ur.webanalyse.init = function() {
	this.initPiwik();	// init Piwik
}

// init Piwik
window.ur.webanalyse.initPiwik = function() {
	var pkBaseURL = "https://homepages.uni-regensburg.de/~tei59608/piwik/";
	
	jQuery.ajax(
	{ 
		url: pkBaseURL + 'ur/url_id_table.php', // Seiten-IDs ermitteln
		type: 'GET',
		data: { 'url': document.URL },
		dataType: 'jsonp',
		jsonp: 'piwikIdsCallback',
		success: function (data) {

		    if (data.status == true) // Ist Domain in Piwik eingetragen?
		    {
		        // Alle Piwik-Tracker einbinden
		        ur.webanalyse.loadPiwikTracker(pkBaseURL, data.domains);
				// init ClickHeat
				ur.webanalyse.initClickHeat(pkBaseURL, data.click_heat_url);
		    }
		}
	});
}
	
// Alle Piwik-Tracker einbinden
window.ur.webanalyse.loadPiwikTracker = function(pkBaseURL, idsites) {
	jQuery.getScript(pkBaseURL + 'piwik.js', function() {

		for(var nr in idsites)
		{
			try {
				var piwikTracker = Piwik.getTracker(pkBaseURL + "piwik.php", idsites[nr]);
				
				// disable cookies


				piwikTracker.disableCookies();
				piwikTracker.trackPageView();
				piwikTracker.enableLinkTracking();
				//alert('piwik called');
			} 
			catch( err )
			{
				//alert(err);
			}
		}
	});
}

// init ClickHeat
window.ur.webanalyse.initClickHeat = function(pkBaseURL, idsite) {	
	jQuery.getScript(pkBaseURL + 'plugins/ClickHeat/libs/js/clickheat.js', function() {

		try {
			clickHeatSite = idsite;
			clickHeatGroup = encodeURIComponent(window.location.pathname + window.location.search);
			clickHeatServer = pkBaseURL + 'plugins/ClickHeat/libs/click.php?url=' + document.URL; // Achtung: Hierfür wurde /libs/click.php und /libs/js/clickheat.js modifiziert
			if ( clickHeatServer.search(/\.html\.en$/) < 0 && 
					 clickHeatServer.search(/\.html$/) < 0 && 
				   clickHeatServer.search(/.php$/) < 0 && 
				   clickHeatServer.search(/\.htms$/) < 0 )
			{
				//if(clickHeatServer.search(/\.de$/) < 0 ) clickHeatServer += '/';
				clickHeatServer += 'index.html';	// "index.html" ans Ende anhängen, wenn die Webseite ohne Dateinamen aufgerufen wurde (Achtung: Weitere Änderung in click.php)
			}
			initClickHeat();
		}
		catch( err )
		{
		}
	});		
}
/************************************************************/
/*															*/
/*		eds: einbinden von Resourcen (z.B. Sprachdatei)		*/
/*															*/
/************************************************************/

if ( window.ur.resources == null || typeof(window.ur.resources) == 'undefined' )
	window.ur.resources = new Object();
			
// Laden von sprachabhängigen Resourcen --> Darf nicht innerhalb einer Ajax-Abfrage aufgerufen werden!!!
window.ur.resources.loadLanguageFile = function() {
	if(typeof(window.ur.resources.language) == "undefined")
	{
		window.ur.resources.language = new Object();
		
		var language = jQuery("meta[http-equiv=language]").attr("content");	// Sprache der Webseite ermitteln
		
		jQuery.ajaxSetup({async:false});
		jQuery.ajax(
		{ 
			url: '/res/ur_modules/resources/get_resources.php',
			type: 'GET',
			data: { 
					'language' : language
				  },
			dataType: 'html',
			
			success: function(data) {
				window.ur.resources.language = jQuery.parseJSON(data);
				window.ur.resources.language.status =  1;	// Status OK
			},
			error:function(x,e){
				var fehler = "";
				if(x.status==0){
					fehler = 'Fehler: Sie sind nicht mehr mit dem Netzwerk verbunden.';
				}else if(x.status==404){
					fehler = 'Requested URL not found.';
				}else if(x.status==500){
					fehler = 'Internel Server Error.';
				}else if(e=='parsererror'){
					fehler = 'Fehler:\nServerantwort fehlerhaft: Parsing JSON Request failed:' + x.responseText;
				}else if(e=='timeout'){
					fehler = 'Fehler:\nVerbindungs Time out. Bitte versuchen Sie es erneut.';
				}else {
					fehler = 'Fehlernachricht:\n' + x.responseText;
				}
				window.ur.resources.language.status =  0;	// Fehlerstatus
			}
		});
		jQuery.ajaxSetup({async:true});
	}
}

// Gibt einen Text in der jeweiligen Sprache zurück
// @params	string value 	Werte für den Zugriff auf den gewünschten Text (z.B. "Embedpdf:AltTxt")
// @params[optional]	string defaultValue		Default-Text, wird zurückgegeben, falls gewünschte Resource nicht gefunden wurde 
// @return	string 	Text in der jeweiligen Sprache	
window.ur.resources.loadLanguageText = function(value, defaultValue) {
	
	var defaultReturn = typeof(defaultValue) == 'undefined' ? "Resource not available." : defaultValue;	// Rückgabe, falls Fehler beim Laden der Resourcen auftritt
	
	if(!window.ur.resources.language.status)
		return defaultReturn;	// Fehler beim Laden der Sprachdatei
	
	// Text aus geladenen Resourcen holen
	var resource_values = value.split(":");	// Werte für den Zugriff auf die Resource in Array speichern
	var resource = window.ur.resources.language;	// Objekt mit Resourcen zwischenspeichern
	for (var elem in resource_values)
	{
		if( typeof(resource[resource_values[elem]]) != 'undefined' )
			resource = resource[resource_values[elem]];
		else
			return defaultReturn;	// Der gewünsche Text existiert nicht
	}
	
	return resource;	// Text aus geladenen Resourcen zurückgeben
}


/************************************************************/
/*															*/
/*		eds: Sortierfunktion für Tabellen initialisieren	*/
/*															*/
/************************************************************/

if ( window.ur.tablesorter == null || typeof(window.ur.tablesorter) == 'undefined' )
	window.ur.tablesorter = new Object();

window.ur.tablesorter.init = function() {
	if ( jQuery('table[class~=tablesorter]').length > 0 )
		jQuery.getScript('/res/ur_modules/tablesorter/tablesorter.js');
}


jQuery(function() { 
	window.ur.init(); 
	window.ur.webanalyse.init();
	window.ur.tablesorter.init();
	});
})(jQuery);