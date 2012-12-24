define([
	"dojo/node!mongodb",
	"compose",
	"dojo/Deferred",
	"dojo/promise/all",
	"dojo/when",
	"setten/util",
	"./Storage",
	"../util"
], function(mongodb, compose, Deferred, all, when, utilSetten, Storage, util){

	return compose(Storage, function(/*Object*/ options){
		options = options || {};
		var ready = new Deferred();
		this.ready = ready.promise;
		var self = this;

		function getCollection(db){
			utilSetten.asDeferred(db.collection, db)(options.collection).then(function(collection){
				self.collection = collection;
				self._dfn = {
					findOne: utilSetten.asDeferred(collection.findOne, collection),
					insert: utilSetten.asDeferred(collection.insert, collection),
					update: utilSetten.asDeferred(collection.update, collection),
					remove: utilSetten.asDeferred(collection.remove, collection),
					count: utilSetten.asDeferred(collection.count, collection),
					find: utilSetten.asDeferred(collection.find, collection)
				};
				ready.resolve(collection);
			}, function(err){
				ready.reject(err);
			});
		}

		if(options.url){
			utilSetten.asDeferred(mongodb.connect, mongodb)(options.url).then(function(db){
				getCollection(db);
			}, function(err){
				ready.reject(err);
			});
		}else{
			var db = options.db || new mongodb.Db(options.name || "test",
				new mongodb.Server(options.host || "localhost", options.port || 27017, {}), { w: 0 });
			utilSetten.asDeferred(db.open, db)().then(function(db){
				getCollection(db);
			}, function(err){
				ready.reject(err);
			});
		}
	}, {

		type: "mongodb",
		collection: null,

		get: function(id){
			return this._dfn.findOne({ id: id }).then(function(item){
				if(item) delete item._id;
				if(item === null) item = undefined;
				return item;
			});
		},

		put: function(item, options){
			options = options || {};
			var id = options.id || item.id;
			if(!item.id) item.id = id;
			var search = {
				id: id
			};
			var self = this;
			if(options.overwrite === false || !id){
				return this._dfn.findOne(search).then(function(found){
					if(found === null){
						if(!item.id) item.id = util.uuid();
						return self._dfn.insert(item).then(function(result){
							result = result && result[0];
							if(result) delete result._id;
							return result;
						});
					}else{
						throw new Error("Duplicate ID. Overwrite == false.");
					}
				});
			}else{
				return this._dfn.update(search, item, { upsert: options.overwrite }).then(function(result){
					if(result) delete result._id;
					return result;
				});
			}
		},

		add: function(item, options){
			options = options || {};
			options.overwrite = false;
			return this.put(item, options);
		},

		remove: function(id, options){
			var search = { id: id };
			return this._dfn.remove(search);
		},

		query: function(query, options){
			query = query || {};
			options = options || {};
			var self = this;
			if(options.limit <= 0){
				var results = [];
				results.totalCount = 0;
				return when(results);
			}
			var totalCountPromise = options.limit ? this._dfn.count(query) : when(undefined);
			return this._dfn.find(query, options).then(function(cursor){
				return utilSetten.asDeferred(cursor.toArray, cursor)().then(function(results){
					if(results && results[0] && results[0].$err !== undefined && results[0]._id === undefined){
						throw new Error(results[0].$err);
					}
					var len = results.length;
					for(var i = 0; i < len; i++){
						delete results[i]._id;
					}
					return totalCountPromise.then(function(tc){
						results.count = results.length;
						results.start = options.skip;
						results.end = options.skip + results.count;
						results.totalCount = tc;
						return results;
					});
				});
			});
		}
	});

});