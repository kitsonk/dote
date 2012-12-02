define([
	"./Storage",
	"dojo/promise/all",
	"dojo/when",
	"setten/dfs"
], function(Storage, all, when, dfs){

	return {
		topics: null,
		comments: null,
		users: null,
		emails: null,

		defaultUser: function(id){
			return {
				id: id,
				admin: false,
				owner: false,
				settings: {}
			};
		},
		
		init: function(){

			function initTopics(){
				var topics = self.topics,
					dfds = [];
				dfds.push(topics.add({
					id: "3af990e5-036a-4e01-80a4-0a46d158038c",
					title: "Convert Dijit Buttons Background to be Pink",
					summary: "I think we should make the default theme for Dojo.  We have had blue for a long time with claro and Pink is such a much more attractive colour.",
					description: "I think we should make the default theme for Dojo.\n\nWe have had blue for a long time with ``claro`` and Pink is such a much more attractive colour.",
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
				}));
				dfds.push(topics.add({
					id: "797329f3-f559-4a58-988d-cd6753dbd894",
					title: "Eliminate Core and Adopt TypeScript as the New Dojo Standard",
					summary: "We should really consider eliminating the Dojo core wholly and instead adopt Microsoft's TypeScript as the standard.",
					description: "We should **really** consider eliminating the Dojo core wholly and instead adopt Microsoft's *TypeScript* as the standard.",
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
				}));
				return all(dfds).then(function(){
					return topics.query();
				});
			}

			function initComments(){
				var comments = self.comments;
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

			function initUsers(){
				var users = self.users;
				users.add({
					id: "dylanks",
					admin: false,
					owner: true
				});
				users.add({
					id: "kriszyp",
					admin: false,
					owner: true
				});
				users.add({
					id: "wildbill",
					admin: false,
					owner: true,
					settings: {
						email: "wildbill@kitsonkelly.com",
						fromaddress: "",
						onnew:false,
						onwatched:false,
						onparticipate:true,
						onown:false,
						onassigned:false,
						ontags:[],
						excreated: true,
						optout:false
					}
				});
				users.add({
					id: "ttrenka",
					admin: false,
					owner: false,
					settings: {
						email: "ttrenka@kitsonkelly.com",
						fromaddress: "",
						onnew:false,
						onwatched:false,
						onparticipate:true,
						onown:false,
						onassigned:false,
						ontags:[],
						excreated: true,
						optout:false
					}
				});
				users.add({
					id: "kitsonk",
					admin: true,
					owner: true,
					settings: {
						email: "dojo@kitsonkelly.com",
						fromaddress: "me@kitsonkelly.com",
						onnew:false,
						onwatched:false,
						onparticipate:true,
						onown:false,
						onassigned:false,
						ontags:[],
						excreated: false,
						optout:false
					}
				});
				return users.query();
			}

			var dfds = [],
				self = this;

			dfds.push(this.topics.empty().then(function(){
				return initTopics();
			}));
			dfds.push(this.comments.empty().then(function(){
				return initComments();
			}));
			dfds.push(this.comments.empty().then(function(){
				return initUsers();
			}));

			return all(dfds);
		},

		open: function(init){
			var dfds = [],
				self = this;
			this.topics = new Storage("topics");
			dfds.push(this.topics.ready());
			this.comments = new Storage("comments");
			dfds.push(this.comments.ready());
			this.users = new Storage("users");
			dfds.push(this.users.ready());
			this.emails = new Storage("emails");
			dfds.push(this.users.ready());
			return init ? all(dfds).then(function(){
				return self.init();
			}) : all(dfds);
		}
	};

});