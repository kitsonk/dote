
var loadModule = process.argv[process.argv.length - 1];

console.log("Bootstrapping: '" + loadModule + "'...");

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
		name: "marked",
		location: "marked/lib"
	},{
		name: "dote",
		location: "dote"
	},{
		name: "hljs",
		location: "hljs",
	},{
		name: "dote-server",
		location: "dote-server"
	}],

	deps: [loadModule]
};

require("./src/dojo/dojo.js");
