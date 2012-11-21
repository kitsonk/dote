define([
	"dojo/ready",
	"dojo/store/JsonRest",
	"dote-client/userControls"
], function(ready, JsonRest, userControls){

	var userStore = new JsonRest({
		target: "/users/"
	});

	ready(function(){
		userControls.start();
	});
	
	return {};
});