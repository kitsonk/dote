var profile = (function(){

	var generalModules = [
		"dijit/_base/manager",
		"dijit/form/Button",
		"dijit/form/TextBox",
		"dijit/layout/ContentPane",
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
		"dojo/i18n",
		"dojo/request"
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
			"dote-client/viewTopic": {
				exclude: generalModules
			},
			"dote-client/viewTopicList": {
				exclude: generalModules
			},
			"dote-client/viewSettings": {
				exclude: generalModules
			},
			"dote-client/viewWelcome": {
				exclude: generalModules
			},
			"dote-client/login": {
				exclude: generalModules
			},
			"dote-client/addTopic": {
				exclude: generalModules
			}
		}
	};
})();
