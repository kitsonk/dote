define("dote/array", [
	"dojo/_base/array"
], function(array){

	array.unique = function(a){
		var h = {}, r = [];
		for(var i = 0, l = a.length; i < l; i++){
			if(!h.hasOwnProperty(a[i])){
				h[a[i]] = true;
				r.push(a[i]);
			}
		}
		return r;
	};

	array.union = function(a, b){
		var h = {}, r = [];
		for(var i = 0, l = a.length; i < l; i++){
			h[a[i]] = true;
		}
		for(i = 0, l = b.length; i < l; i++){
			h[b[i]] = true;
		}
		for(var k in h){
			if(h.hasOwnProperty(k)){
				r.push(k);
			}
		}
		return r;
	};

	array.intersection = function(a, b){
		var i = 0, j = 0, r = [];
		while(i < a.length && j < b.length){
			if(a[i] < b[j]){
				i++;
			}else if(a[i] > b[j]){
				j++;
			}else{
				r.push(a[i]);
				i++;
				j++;
			}
		}
		return r;
	};

	return array;
});