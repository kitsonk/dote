define([
	"dojo/when",
	"compose",
	"./Evented",
	"./Persistent",
	"./stores"
], function(when, compose, Evented, Persistent, stores){

	var emailHash = {},
		emailDefaults = {};

	var EMail = compose(function(id){
		if(id) this.id = id;
		this._store = stores.emails;
		this._hash = emailHash;
		this._defaults = emailDefaults;
	}, Evented, Persistent);

	var email = function(id){
		return id ? emailHash[id] || (emailHash[id] = new EMail(id)) : new EMail();
	};

	email.query = function(query, options){
		var self = this;
		return when(stores.emails.query(query, options)).then(function(results){
			results.forEach(function(item){
				var e = self(item.id);
				e.item = item;
			});
			return results;
		});
	};

	email.all = function(){
		return this.query();
	};

	email.clear = function(){
		emailHash = {};
	};

	return email;

});