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
		var r = range.match(/^items=(\d+)-(\d+)$/i),
			start = parseInt(r[1], 10),
			count = parseInt(r[2], 10) - start + 1;
		return {
			query: "limit(" + count + "," + start + ",Infinity)",
			start: start,
			count: count
		};
	}

	function isEmpty(o){
		for(var key in o){
			if(o.hasOwnProperty(key)){
				return false;
			}
		}
		return true;
	}

	function difference(original, changed){

		function isArrayLike(a){
			return typeof a == "object" && a.hasOwnProperty("length") && "forEach" in a;
		}

		function compare(a, b){
			if(a === null || b === null){
				if(a === b){
					return false;
				}else{
					return b;
				}
			}else if(isArrayLike(a)){
				var d = complexArrayDifference(a, b);
				if(d.length){
					return d;
				}
			}else if(typeof a == "object"){
				var e = difference(a, b);
				if(!isEmpty(e)){
					return e;
				}
			}else{
				if(a !== b){
					return b;
				}
			}
			return false;
		}

		function complexArrayDifference(a, b){
			var changes = [];
			a.forEach(function(item, idx){
				if(b[idx]){
					var c = compare(item, b[idx]);
					if(c !== false){
						changes.push(c);
					}
				}else{
					changes.push(null);
				}
			});
			if(b.length > a.length){
				changes = changes.concat(b.slice(a.length));
			}
			return changes;
		}

		var changes = {},
			key;
		if(original && changed){
			for(key in original){
				if(changed.hasOwnProperty(key)){
					var c = compare(original[key], changed[key]);
					if(c !== false){
						changes[key] = c;
					}
				}else{
					changes[key] = null;
				}
			}
			for(key in changed){
				if(!original.hasOwnProperty(key)){
					changes[key] = changed[key];
				}
			}
		}
		return changes;
	}

	return {
		getUUID: getUUID,
		getContentRange: getContentRange,
		parseRange: parseRange,
		isEmpty: isEmpty,
		difference: difference
	};
});