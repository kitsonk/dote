var profile = (function(){

	return {
		releaseDir: "../lib",
		basePath: "src",
		action: "release",
		mini: true,
		selectorEngine: "lite",
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
			"dojo-firebug": 0
		},

		layers: {
			"dojo/dojo": {
				include: [ "dojo/dojo" ],
				customBase: true,
				boot: true
			},
			"dote-client/viewTopic": {
				include: []
			},
			"dote-client/viewTopicList": {
				include: []
			},
			"dote-client/login": {
				include: []
			},
			"dote-client/addTopic": {
				include: []
			}
		}
	};
})();