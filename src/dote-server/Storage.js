define([
	"./util",
	"compose",
	"dojo/node!perstore/stores"
], function(util, compose, stores){
	return compose(function(path, filename){
		this.store = stores.DefaultStore({
			path: path,
			filename: filename
		});
		this.store.setPath(path);
	},{
		store: null,

		get: function(id){
			return this.store.get(id);
		},

		put: function(object, directives){
			directives = directives || {};
			directives.overwrite = directives.overwrite || true;
			return this.store.get(this.store.put(object, directives));
		},

		add: function(object, directives){
			if(object && !object.id){
				object.id = util.getUUID();
			}
			return this.store.get(this.store.add(object, directives));
		},

		remove: function(id){
			return this.store["delete"](id);
		},

		query: function(query, options){
			console.log("query", query, options);
			return this.store.query(query, options);
		}
	});
});