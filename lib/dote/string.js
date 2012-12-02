define("dote/string", [
	"dojo/string"
], function(string){

	string.capitaliseFirst = function(string){
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	return string;
});