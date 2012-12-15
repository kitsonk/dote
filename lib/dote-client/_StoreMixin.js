define("dote-client/_StoreMixin", [
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.delegate lang.mixin
	"dojo/when" // when
], function(array, declare, lang, when){
	return declare(null, {

		store: null,
		_setStoreAttr: function(value){
			this._set("store", value);
			this.dirty = {};
		},

		query: null,
		_setQueryAttr: function(value){
			this._set("query", value !== undefined ? value : this.query);
		},
		_getQueryAttr: function(){
			return ((typeof this.query == "object") && (this.query !== null)) ? lang.delegate(this.query, {}) : this.query;
		},

		queryOptions: null,
		_setQueryOptionsAttr: function(value){
			var sort = value && value.sort;
			this._set("queryOptions", value || this.queryOptions);
		},
		_getQueryOptionsAttr: function(){
			return lang.delegate(this.queryOptions, {});
		},

		start: 0,
		count: 10,
		maxCount: Infinity,

		total: null,

		getBeforePut: true,
		noDataMessage: "",
		loadingMessage: "",

		constructor: function(){
			this.query = {};
			this.queryOptions = {};
			this.dirty = {};
			this.sort = [];
			this._updating = {};
		},

		_results: null,
		_querying: false,

		fetch: function(){
			if(!this._querying){
				this._querying = true;
				var queryOptions = lang.mixin({
					start: this.start,
					count: this.count
				}, this.queryOptions || {});
				console.log(queryOptions);
				var results = this._results = this.store.query(this.query, queryOptions),
					self = this;
				return when(results.total, function(total){
					self._set("total", total);
					return when(results, function(items){
						self._set("start", self.start + items.length);
						self.emit("results", { items: items });
						self._querying = false;
					});
				});
			}
		},

		refresh: function(){
			var results = this._results = this.store.query(this.query, this.queryOptions),
				self = this;
			return when(results.total, function(total){
				self._set("total", total);
				return when(results, function(items){
					self.emit("results", { items: items });
				});
			});
		}
	});
});