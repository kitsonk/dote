define([
	"./util",
	"dojo/promise/all",
	"dojo/when",
	"compose",
	"dojo/node!perstore/store/redis"
], function(util, all, when, compose, stores){
	return compose(function(collection){
		var options = {
			collection: collection
		};
		if(process.env.REDISTOGO_URL){
			options.url = process.env.REDISTOGO_URL;
		}
		this.store = stores.Redis({
			collection: collection
		});
	},{
		store: null,

		get: function(id){
			return this.store.get(id);
		},

		put: function(object, directives){
			directives = directives || {};
			directives.overwrite = directives.overwrite || true;
			var self = this;
			return when(this.store.put(object, directives)).then(function(id){
				return self.store.get(id);
			});
		},

		add: function(object, directives){
			if(object && !object.id){
				object.id = util.getUUID();
			}
			var self = this;
			return when(this.store.put(object, directives)).then(function(id){
				return self.store.get(id);
			});
		},

		remove: function(id){
			return this.store["delete"](id);
		},

		query: function(query, options){
			return this.store.query(query, options);
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