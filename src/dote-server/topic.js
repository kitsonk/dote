define([
	"dojo/node!rql/parser", //parser
	"dojo/_base/lang", // lang.mixin
	"dojo/promise/all",
	"dojo/when",
	"compose",
	"dote/array",
	"./Evented",
	"./stores"
], function(parser, lang, all, when, compose, array, Evented, stores){

	var topicHash = {};

	var topicDefaults = {
			title: "",
			summary: "",
			description: "",
			action: "open",
			author: "",
			created: null,
			actioned: null,
			tags: [ ],
			voters: [ ],
			commentsCount: 0
		},
		commentDefaults = {
			author: "",
			text: "",
			created: null,
			topicId: ""
		};

	var sortFieldRe = /^[+\-](.+)$/,
		selectRe = /^select\(.+\)$/;

	function parseSort(queryString){
		var fields = [],
			query = parser.parseQuery(queryString);
		if(query && query.args && query.args.length){
			query.args.forEach(function(arg){
				if(arg.name === "sort"){
					arg.args.forEach(function(field){
						var s = sortFieldRe.exec(field);
						if(s && s.length && s[1]) fields.push(s[1]);
					});
				}
			});
		}
		return fields;
	}

	function parseSelect(queryString){
		var fields = [],
			query = parser.parseQuery(queryString);
		if(query && query.args && query.args.length){
			query.args.forEach(function(arg){
				if(arg.name === "select"){
					fields = arg.args;
				}
			});
		}
		return fields;
	}

	function fixQuery(queryString, addSelectFields){
		addSelectFields = addSelectFields || [];
		var	selectFields = array.union(array.union(parseSelect(queryString), parseSort(queryString)), addSelectFields),
			args = queryString ? queryString.split("&") : [],
			a = [];
		if(selectFields.length) a.push("select(" + selectFields.join(",") + ")");
		args.forEach(function(arg){
			if(!selectRe.test(arg)){
				a.push(arg);
			}
		});
		return a.join("&");
	}

	var Comment = compose(function(topicId, id){
		this.id = id;
		this.topicId = topicId;
	}, Evented, {
		id: null,
		topicId: null,
		item: null,

		get: function(){
			var self = this;
			return when(this.item || stores.comments.get(this.id)).then(function(item){
				self.emit("get", { item: item });
				return self.item = item;
			});
		},

		put: function(data){
			var self = this,
				original;
			data = lang.mixin(lang.clone(this.item), data || {});
			data.id = this.id;
			data.topicId = this.topicId;
			return stores.comments.get(data.id).then(function(item){
				original = item;
				return stores.comments.put(data);
			}).then(function(item){
				self.emit("put", { item: item, original: original });
				return self.item = item;
			});
		},

		add: function(data){
			var self = this,
				item = lang.mixin(lang.clone(commentDefaults), data || {});
			item.created = Math.round((new Date()).getTime() / 1000);
			item.topicId = this.topicId;
			return when(stores.comments.add(item)).then(function(item){
				if(item && item.topicId && item.id && topicHash[item.topicId]){
					topicHash[item.topicId].item.commentsCount++;
					topicHash[item.topicId].put();
					topicHash[item.topicId]._commentHash[item.id] = self;
					self.id = item.id;
				}
				self.emit("add", { item: item });
				return self.item = item;
			});
		},

		remove: function(){
			var self = this;
			return stores.comments.remove(this.id).then(function(){
				if(topicHash[self.topicId]){
					topicHash[self.topicId].item.commentsCount--;
					topicHash[self.topicId].put();
					topicHash[self.topicId]._commentHash[self.id] = undefined;
				}
				self.emit("remove", { id: id });
				self.id = null;
				self.topicId = null;
				self.item = null;
				return true;
			});
		}
	});

	var CommentObj = compose(function(self){
		this.self = self;
	},{
		totalCount: null,
		self: null,

		query: function(query, options){
			var self = this.self;
			options = options || {};
			query = query ? query.split("&") : [];
			query.push("topicId=" + self.id);
			return when(stores.comments.query(query.join("&"), options)).then(function(results){
				self.comment.totalCount = results.totalCount || results.length;
				results.forEach(function(item){
					var comment = self.comment(item.id);
					comment.item = item;
				});
				return results;
			});
		},

		all: function(){
			return this.self.comment.query();
		},

		removeAll: function(){
			var self = this.self;
			return self.comment.all().then(function(results){
				var requests = [];
				results.forEach(function(comment){
					requests.push(self.comment(comment.id).remove());
				});
				return all(requests);
			});
		}
	});

	var Topic = compose(function(id){
		if(id){
			this.id = id;
		}
		this._commentHash = {};
		this.comment = lang.mixin(function(id){
			return id ? this._commentHash[id] || (this._commentHash[id] = new Comment(this.id, id)) : new Comment(this.id);
		}, new CommentObj(this));
	}, Evented, {
		id: null,
		item: null,
		_commentHash: null,

		comment: null,

		get: function(){
			var self = this;
			return when(this.item || stores.topics.get(this.id)).then(function(item){
				self.emit("get", { item: item });
				return self.item = item;
			});
		},

		put: function(data){
			var self = this,
				original;
			data = lang.mixin(lang.clone(this.item), data || {});
			if(this.id) data.id = this.id;
			return this.get().then(function(item){
				original = item;
				if(original.action !== data.action){
					data.actioned = Math.round((new Date()).getTime() / 1000);
				}
				return stores.topics.put(data);
			}).then(function(item){
				self.emit("put", { item: item, original: original });
				return self.item = item;
			});
		},

		add: function(data){
			var self = this,
				item = lang.mixin(lang.clone(topicDefaults), data || {});
			item.created = Math.round((new Date()).getTime() / 1000);
			if(item.owner === "__undefined") delete item.owner;
			return when(stores.topics.add(item)).then(function(item){
				if(item && item.id){
					topicHash[item.id] = self;
					self.id = item.id;
				}
				self.emit("add", { item: item });
				return self.item = item;
			});
		},

		remove: function(){
			var self = this;
			return this.comment.removeAll().then(function(){
				return stores.topics.remove(self.id).then(function(){
					topicHash[self.id] = undefined;
					self.emit("remove", { id: id });
					self.id = null;
					self.item = null;
					return true;
				});
			});
		}
	});

	var topic = function(id){
		return id ? topicHash[id] || (topicHash[id] = new Topic(id)) : new Topic();
	};

	topic.query = function(query, options){
		var self = this;
		return when(stores.topics.query(query, options)).then(function(results){
			results.forEach(function(item){
				var t = self(item.id);
				t.item = item;
			});
			return results;
		});
	};

	topic.all = function(){
		return this.query();
	};

	topic.clear = function(){
		topicHash = {};
	};

	return topic;
});