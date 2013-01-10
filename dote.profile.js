var profile = (function(){

	var generalModules = [
		"dojo/_base/array",
		"dojo/_base/Color",
		"dojo/_base/config",
		"dojo/_base/connect",
		"dojo/_base/declare",
		"dojo/_base/Deferred",
		"dojo/_base/event",
		"dojo/_base/fx",
		"dojo/_base/html",
		"dojo/_base/json",
		"dojo/_base/kernel",
		"dojo/_base/lang",
		"dojo/_base/sniff",
		"dojo/_base/unload",
		"dojo/_base/url",
		"dojo/_base/window",
		"dojo/_base/xhr",
		"dijit/_CssStateMixin",
		"dijit/_FocusMixin",
		"dijit/_OnDijitClickMixin",
		"dijit/_TemplatedMixin",
		"dijit/_Widget",
		"dijit/a11y",
		"dijit/a11yclick",
		"dijit/Destroyable",
		"dijit/focus"
	];

	var widgetModules = [
		"dote-client/store/JsonRest",
		"dote-client/userControls"
	];

	return {
		releaseDir: "../lib",
		basePath: "src",
		action: "release",
		mini: true,
		selectorEngine: "lite",
		layerOptimize: "closure",
		cssOptimize: "comments",

		packages: [{
			name: "dojo",
			location: "dojo"
		},{
			name: "dijit",
			location: "dijit"
		},{
			name: "dojox",
			location: "dojox"
		},{
			name: "dgrid",
			location: "dgrid"
		},{
			name: "put-selector",
			location: "put-selector"
		},{
			name: "xstyle",
			location: "xstyle"
		},{
			name: "hljs",
			location: "hljs"
		},{
			name: "marked",
			location: "marked/lib"
		},{
			name: "moment",
			location: "moment"
		},{
			name: "dote",
			location: "dote"
		},{
			name: "dote-client",
			location: "dote-client"
		}],

		defaultConfig: {
			hasCache:{
				"dojo-built": 1,
				"dojo-loader": 1,
				"dom": 1,
				"host-browser": 1,
				"config-selectorEngine": "lite"
			},
			locale: "en-us",
			async: 1
		},

		staticHasFeatures: {
			"config-dojo-loader-catches": 0,
			"config-tlmSiblingOfDojo": 0,
			"dojo-log-api": 0,
			"dojo-sync-loader": 0,
			"dojo-timeout-api": 0,
			"dojo-sniff": 0,
			"dojo-cdn": 0,
			"config-strip-strict": 0,
			"dojo-loader-eval-hint-url": 1,
			"dojo-firebug": 0,
			"native-xhr": 1,
			"dojo-debug-messages": 0,
			"quirks": 0,
			"dijit-legacy-requires": 0,
			"opera": 0
		},

		layers: {
			"dojo/dojo": {
				include: [ "dojo/dojo" ].concat(generalModules),
				customBase: true,
				boot: true
			},
			"dote-client/widgetModules": {
				include: widgetModules,
				exclude: generalModules
			},
			"dote-client/viewTopic": {
				exclude: generalModules.concat("dote-client/widgetModules")
			},
			"dote-client/viewTopicList": {
				exclude: generalModules.concat("dote-client/widgetModules")
			},
			"dote-client/viewSettings": {
				exclude: generalModules.concat("dote-client/widgetModules")
			},
			"dote-client/viewWelcome": {
				exclude: generalModules.concat("dote-client/widgetModules")
			},
			"dote-client/viewAdmin": {
				exclude: generalModules.concat("dote-client/widgetModules")
			},
			"dote-client/login": {
				exclude: generalModules
			},
			"dote-client/addTopic": {
				exclude: generalModules.concat("dote-client/widgetModules")
			}
		}
	};
})();
