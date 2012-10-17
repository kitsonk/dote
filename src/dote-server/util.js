define([
], function(){

	function getUUID(){
		// Returns a compliant UUID
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	function getContentRange(start, count, total){
		return "items " + (count ? (start + "-" + (parseInt(start, 10) + parseInt(count, 10) - 1)) : "") + "/" + total;
	}

	function parseRange(range){
		var r = range.match(/^items=(\d+)-(\d+)$/i);
		return {
			start: parseInt(r[1], 10),
			end: parseInt(r[2], 10)
		};
	}

	return {
		getUUID: getUUID,
		getContentRange: getContentRange,
		parseRange: parseRange
	};
});