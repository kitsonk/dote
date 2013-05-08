define("dote/limit", [
], function () {

	var limit = function (delay, fn, resultOnCall) {
		var fired,
			handle;

		return function () {
			if (!fired && handle) {
				clearTimeout(handle);
				handle = null;
			}
			handle = setTimeout(function () {
				fired = true;
				fn.apply(this, arguments);
			}, delay);
			fired = false;
			return resultOnCall;
		};
	};

	return limit;

});