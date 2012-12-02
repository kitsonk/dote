define("dote-client/userControls", [
	"dojo/_base/window",
	"dojo/dom",
	"dojo/on",
	"./displayHelp"
], function(win, dom, on, displayHelp){

	function newTopic(e){
		e.preventDefault();
		win.global.location.href = "/add";
	}

	function help(e){
		e.preventDefault();
		displayHelp.display();
	}

	function logout(e){
		e.preventDefault();
		win.global.location.href = "/logout";
	}

	function start(){
		on(dom.byId("newTopic"), "click", newTopic);
		on(dom.byId("help"), "click", help);
		on(dom.byId("logout"), "click", logout);
	}

	return {
		start: start
	};
});