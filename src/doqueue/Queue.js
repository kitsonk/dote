define([
	"compose",
	"dojo/_base/lang",
	"dojo/when",
	"./Evented",
	"./storage/MongoDB",
	"./timer",
	"./util"
], function(compose, lang, when, Evented, MongoDB, timer, util){

	var priorities = {
		top: 100,
		high: 80,
		normal: 50,
		low: 10
	};

	var QueryItem = compose(function(item){
		this.item = item;
		this.id = item.id;
	}, Evented);
	
	return compose(function(options){
		var Store = options.Store || MongoDB;
		this.store = new Store(options.storeOptions || {});
		this._timer = timer(options.interval || 1000);
		this._timerHandle = this._timer.on("tick", lang.hitch(this, this._onTick));
		this._itemHash = {};
		this._listenerHash = {};
	}, {
		store: null,

		ready: function(){
			return this.store.ready;
		},

		on: function(type, listener, options){
			options = options || {};
			if(!(type in this._listenerHash)){
				this._listenerHash[type] = [];
			}
			this._listenerHash[type].push(listener);
			var idx = this._listenerHash[type].length - 1,
				self = this;
			return {
				remove: function(){
					return self._listenerHash[type].splice(idx, 1)[0];
				}
			};
		},

		create: function(type, item, options){
			options = options || {};
			var priority;
			if(options.priority){
				if(typeof options.priority == "string"){
					if(options.priority in priorities){
						priority = priorities[options.priority];
					}else{
						priority = parseInt(options.priority, 10);
					}
				}else{
					priority = parseInt(options.priority, 10);
				}
			}
			priority = priority || priorities.normal;
			var record = {
				id: util.uuid(),
				type: type,
				item: item,
				created: Math.round((new Date()).getTime() / 1000),
				priority: priority,
				status: "new",
				attempts: options.attempts || 1
			};
			this.store.put(record, { overwrite: false });
			return this._itemHash[record.id] = new QueryItem(record);
		},

		start: function(){
			this._timer.resume();
		},

		stop: function(){
			this._timer.pause();
		},

		query: function(options){

		},

		_onTick: function(){

			var self = this;

			function processItems(items){
				if(items && items.length){
					var item = items.shift(),
						type = item.type,
						fn = self._listenerHash[type].shift();
					item.status = "processing";
					item.updated = Math.round((new Date()).getTime() / 1000);
					self.store.put(item).then(function(){
						when(fn.call(self, item.item)).then(function(result){
							if(result && typeof result == "string"){
								item.status = result;
							}else{
								item.status = "finished";
							}
							item.updated = Math.round((new Date()).getTime() / 1000);
							self.store.put(item).then(function(){
								self._listenerHash[type].push(fn);
							});
						}, function(err){
							item.status = "error";
							item.error = err;
							item.updated = Math.round((new Date()).getTime() / 1000);
							self.store.put(item).then(function(){
								self._listenerHash[type].push(fn);
							});
						}, function(progress){
							item.status = "progress";
							item.progress = progress;
							item.updated = Math.round((new Date()).getTime() / 1000);
							self.store.put(item);
						});
					});
				}
			}

			for(var type in this._listenerHash){
				if(this._listenerHash[type].length){
					this.store.query({ type: type, status: "new" }).then(processItems);
				}
			}
		}
	});

});