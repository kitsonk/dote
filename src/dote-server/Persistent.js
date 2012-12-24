define([
	"dojo/_base/lang",
	"dojo/when",
	"compose"
], function(lang, when, compose){

	return compose({
		item: null,
		id: null,
		_store: null,
		_hash: null,
		_defaults: null,

		get: function(){
			var self = this;
			return when(this.item || this._store.get(this.id)).then(function(item){
				self.emit("get", { item: item });
				return self.item = item;
			});
		},

		_put: function(original, item){
			var self = this;
			return this._store.put(item).then(function(item){
				self.emit("put", { item: item, original: original });
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
				return self._put(original, data);
			});
		},

		_add: function(item){
			var self = this;
			return when(this._store.add(item)).then(function(item){
				if(item && item.id){
					self._hash[item.id] = self;
					self.id = item.id;
				}
				self.emit("add", { item: item });
				return self.item = item;
			});
		},

		add: function(data){
			var self = this,
				item = lang.mixin(lang.clone(this._defaults), data || {});
			return this._add(item);
		},

		remove: function(){
			var self = this;
			return this._store.remove(this.id).then(function(id){
				self._hash[self.id] = undefined;
				self.emit("remove", { id: id });
				self.id = null;
				self.item = null;
			});
		}
	});
});