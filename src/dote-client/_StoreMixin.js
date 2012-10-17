define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.delegate
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

		refresh: function(){
			var results = this._results = this.store.query(this.query, this.queryOptions),
				self = this;
			return when(results.total, function(total){
				self._set("total", total);
				when(results, function(items){
					array.forEach(items, function(item){
						self.emit("item", { item: item });
					});
				});
			});
		}
	});
});