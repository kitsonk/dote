define([
	"./Storage",
	"setten/dfs",
	"dojo/promise/all"
], function(Storage, dfs, all){

	function run(){

		function initTopics(){
			var topics = new Storage("store", "topics.json");
			topics.add({
				id: "3af990e5-036a-4e01-80a4-0a46d158038c",
				title: "Convert Dijit Buttons Background to be Pink",
				description: "I think we should make the default theme for Dojo.  We have had blue for a long time with claro and Pink is such a much more attractive colour.",
				action: "rejected",
				owner: "wildbill",
				author: "kitsonk",
				created: 1349113392,
				actioned: 1349199792,
				tags: ["dijit", "css", "themes", "ui"],
				voters: [
					{ name: "kitsonk", vote: 1 },
					{ name: "neonstalwart", vote: -1 },
					{ name: "wildbill", vote: -1 },
					{ name: "ttrenka", vote: -1 }
				],
				commentsCount: 2
			});
			topics.add({
				id: "797329f3-f559-4a58-988d-cd6753dbd894",
				title: "Eliminate Core and Adopt TypeScript as the New Dojo Standard",
				description: "We should really consider eliminating the Dojo core wholly and instead adopt Microsoft's TypeScript as the standard.",
				action: "open",
				owner: "kriszyp",
				author: "kitsonk",
				created: 1349199792,
				tags: [ "dojo", "core", "alternatives" ],
				voters: [
					{ name: "kitsonk", vote: 1 },
					{ name: "dylanks", vote: -1 },
					{ name: "csnover", vote: 0 }
				],
				commentsCount: 1
			});
			return topics.query();
		}

		function initComments(){
			var comments = new Storage("store", "comments.json");
			comments.add({
				author: "kitsonk",
				text: "I really like this idea, pink **RULZ** and other inine lexing: ``dojo/has``.\n\nNow another paragraph.",
				created: 1349113392,
				topicId: "3af990e5-036a-4e01-80a4-0a46d158038c"
			});
			comments.add({
				author: "wildbill",
				text: "I am not too sure about this",
				created: 1349135392,
				topicId: "3af990e5-036a-4e01-80a4-0a46d158038c"
			});
			comments.add({
				author: "kitsonk",
				text: "TypeScript **RULEZ**",
				created: 1349145392,
				topicId: "797329f3-f559-4a58-988d-cd6753dbd894"
			});
			return comments.query();
		}

		function initOwners(){
			var owners = new Storage("store", "owners.json");
			owners.add({
				value: "__unassigned",
				label: "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
			});
			owners.add({
				value: "dylanks",
				label: "dylanks"
			});
			owners.add({
				value: "kriszyp",
				label: "kriszyp"
			});
			owners.add({
				value: "wildbill",
				label: "wildbill"
			});
			owners.add({
				value: "kistonk",
				label: "kitsonk"
			});
			return owners.query();
		}

		if(!dfs.existsSync("store")){
			dfs.mkdirSync("store");
		}

		var dfds = [];

		dfds.push(dfs.exists("store/topics.json").then(function(exists){
			if(exists){
				return dfs.unlink("store/topics.json").then(function(){
					return initTopics();
				});
			}
		}));

		dfds.push(dfs.exists("store/comments.json").then(function(exists){
			if(exists){
				return dfs.unlink("store/comments.json").then(function(){
					return initComments();
				});
			}
		}));

		dfds.push(dfs.exists("store/owners.json").then(function(exists){
			if(exists){
				return dfs.unlink("store/owners.json").then(function(){
					return initOwners();
				});
			}
		}));

		return all(dfds);

	}

	return {
		run: run
	};
});