define("dote-client/userControls", [
	"dojo/_base/window",
	"dojo/dom",
	"dojo/on",
	"./displayHelp"
], function(win, dom, on, displayHelp){

	function help(e){
		e.preventDefault();
		displayHelp.display();
	}

	function start(){
		on(dom.byId("help"), "click", help);
	}

	return {
		start: start
	};
});