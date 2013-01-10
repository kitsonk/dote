define("dote-client/displayHelp", [
	"dijit/Dialog"
], function(Dialog){

	var helpDialog;

	return {
		display: function(){
			if(!helpDialog){
				helpDialog = new Dialog({
					title: "Help",
					href: "/views/help",
					style: {
						width: "900px"
					}
				});
			}
			helpDialog.show();
		}
	};
});