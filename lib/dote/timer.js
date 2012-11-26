define("dote/timer", [
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/Evented"
], function(declare, lang, Evented){

	var Timer = declare([Evented], {

		timer: null,

		count: 0,

		_interval: 0,

		constructor: function(milliseconds){
			this._setInterval(milliseconds);
		},

		interval: function(milliseconds){
			this._setInterval(milliseconds);
		},

		pause: function(){
			this._clearInterval();
		},

		resume: function(){
			this._setInterval(this._interval);
		},

		stop: function(){
			this.count = 0;
			this._clearInterval();
		},

		_clearInterval: function(){
			if(this.timer){
				clearInterval(this.timer);
			}
		},

		_setInterval: function(milliseconds){
			this._clearInterval();
			this.timer = setInterval(lang.hitch(this, this._onTick), milliseconds);
			this._interval = milliseconds;
		},

		_onTick: function(){
			this.count++;
			this.emit("tick", { count: this.count, interval: this._interval });
		}
	});

	var timer = function(milliseconds){
		return new Timer(milliseconds);
	};

	return timer;
});