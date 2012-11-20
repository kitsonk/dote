define("dote-client/wait", [
	"dojo/Deferred"
], function(Deferred){
	var wait = function(milliseconds){
		var timeout;
		var dfd = new Deferred(function(reason){
			if(timeout){
				clearTimeout(timeout);
			}
		});
		timeout = setTimeout(function(){
			dfd.resolve();
		}, milliseconds);
		return dfd.promise;
	};

	return wait;
});