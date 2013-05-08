define([
	"./config",
	"./Storage",
	"dojo/promise/all",
	"dojo/when",
	"setten/dfs"
], function(config, Storage, all, when, dfs){

	return {
		topics: null,
		comments: null,
		users: null,
		emails: null,
		logins: null,
		signups: null,

		defaultUser: function(id){
			return {
				id: id,
				admin: false,
				committer: false,
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
						{ user: { id: "kitsonk", committer: true }, vote: 1 },
						{ user: { id: "neonstalwart", committer: true }, vote: -1 },
						{ user: { id: "bill", committer: true }, vote: -1 },
						{ user: { id: "ttrenka", committer: true }, vote: -1 }
					],
					watchers: [ ],
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
						{ user: { id: "kitsonk", committer: true }, vote: 1 },
						{ user: { id: "dylanks", committer: true }, vote: -1 },
						{ user: { id: "csnover", committer: true }, vote: 0 },
						{ user: { id: "other", committer: false }, vote: 1 }
					],
					watchers: [ ],
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
					committer: true,
					owner: true
				});
				users.add({
					id: "kriszyp",
					admin: false,
					committer: true,
					owner: true
				});
				users.add({
					id: "wildbill",
					admin: false,
					committer: true,
					owner: true
				});
				users.add({
					id: "ttrenka",
					admin: false,
					committer: true,
					owner: true
				});
				users.add({
					id: "csnover",
					admin: false,
					committer: true,
					owner: true
				});
				users.add({
					id: "kitsonk",
					admin: true,
					committer: true,
					owner: true
				});
				users.add({
					id: "neonstalwart",
					admin: false,
					committer: true,
					owner: true
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
			dfds.push(this.users.empty().then(function(){
				return initUsers();
			}));

			return all(dfds);
		},

		open: function(init){
			var dfds = [],
				self = this;
			this.topics = new Storage({
				collection: "topics",
				url: config.db.url
			});
			dfds.push(this.topics.ready());
			this.comments = new Storage({
				collection: "comments",
				url: config.db.url
			});
			dfds.push(this.comments.ready());
			this.users = new Storage({
				collection: "users",
				url: config.db.url
			});
			dfds.push(this.users.ready());
			this.emails = new Storage({
				collection: "emails",
				url: config.db.url
			});
			dfds.push(this.emails.ready());
			this.logins = new Storage({
				collection: "logins",
				url: config.db.url
			});
			dfds.push(this.logins.ready());
			this.signups = new Storage({
				collection: 'signups',
				url: config.db.url
			});
			dfds.push(this.signups.ready());
			return init ? all(dfds).then(function(){
				return self.init();
			}) : all(dfds);
		}
	};

});