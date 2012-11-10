
var loadModule = "dote-server/genkeys";

dojoConfig = {
	baseUrl: "src/",
	async: 1,

	hasCache: {
		"host-node": 1,
		"dom": 0
	},

	packages: [{
		name: "dojo",
		location: "dojo"
	},{
		name: "dojox",
		location: "dojox"
	},{
		name: "setten",
		location: "setten"
	},{
		name: "compose",
		location: "compose"
	},{
		name: "dote",
		location: "dote"
	},{
		name: "dote-server",
		location: "dote-server"
	}],

	deps: [loadModule]
};

require("./src/dojo/dojo.js");
