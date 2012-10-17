
var loadModule = "dote-server/test";

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
		name: "setten",
		location: "setten"
	},{
		name: "compose",
		location: "compose"
	},{
		name: "dote-server",
		location: "dote-server"
	}],

	deps: [loadModule]
};

require("./src/dojo/dojo.js");