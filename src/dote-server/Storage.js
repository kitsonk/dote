define([
	"./util",
	"dojo/Deferred",
	"dojo/promise/all",
	"dojo/when",
	"compose",
	"dojo/node!perstore/store/mongodb"
], function(util, Deferred, all, when, compose, stores){
	return compose(function(options){
		options = options || {};
		if(process.env.MONGOLAB_URI){
			console.log("Detected MongoLab. URL: '" + process.env.MONGOLAB_URI + "'");
			options.url = process.env.MONGOLAB_URI;
		}
		this.store = stores.MongoDB(options);
	},{
		store: null,

		get: function(id){
			return this.store.get(id);
		},

		put: function(object, directives){
			directives = directives || {};
			directives.overwrite = directives.overwrite || true;
			object = object || {};
			var self = this;
			return when(this.store.put(object, directives)).then(function(id){
				object.id = id;
				return object;
			});
		},

		add: function(object, directives){
			directives = directives || {};
			directives.overwrite = directives.overwrite || false;
			object = object || {};
			if(!("id" in object)){
				object.id = util.getUUID();
			}
			var self = this;
			return when(this.store.put(object, directives)).then(function(id){
				// sometimes node is too fast, I used to do a "get" after the "put" but
				// sometimes MongoDB fails to find the item because the record has yet
				// to be written
				object.id = id;
				return object;
			});
		},

		remove: function(id){
			return this.store["delete"](id);
		},

		query: function(query, options){
			return this.store.query(query, options);
		},

		aggregate: function(){
			var dfd = new Deferred(),
				pipeline = Array.prototype.slice.call(arguments);
			this.store.collection().aggregate(pipeline, function(err, results){
				if(err) dfd.reject(err);
				dfd.resolve(results);
			});
			return dfd.promise;
		},

		empty: function(){
			var self = this,
				dfds = [];
			return this.store.query().then(function(items){
				items.forEach(function(item){
					dfds.push(self.store["delete"](item.id));
				});
				return all(dfds);
			});
		},

		ready: function(){
			return when(this.store.ready ? this.store.ready() : true);
		}
	});
});