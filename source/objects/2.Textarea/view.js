/**
*    Webarena - A webclient for responsive graphical knowledge work
*
*    @author Felix Winkelnkemper, University of Paderborn, 2011
*
*/

Textarea.draw=function(external){

	var rep=this.getRepresentation();
	
	this.drawDimensions(external);
	
	this.setViewWidth(this.getAttribute('width'));
	this.setViewHeight(this.getAttribute('height'));

	var linesize = this.getAttribute('linesize')-1+1;
	
	if (linesize > 0) {
		
		$(rep).find("body>div").css("border-color", this.getAttribute('linecolor'));
		$(rep).find("body>div").css("border-width", this.getAttribute('linesize'));
		$(rep).find("body>div").css("border-style", "solid");
		$(rep).find("body>div>div").css("padding", "5px");
		
	} else {
		
		$(rep).find("body>div").css("border-color", "none");
		$(rep).find("body>div").css("border-width", "0px");
		$(rep).find("body>div").css("border-style", "solid");
		$(rep).find("body>div>div").css("padding", "0px");
		
	}
	
	$(rep).find("body>div").css("background-color", this.getAttribute('fillcolor'));
	
	$(rep).find("body").css("font-size", this.getAttribute('font-size'));
	$(rep).find("body").css("font-family", this.getAttribute('font-family'));
	$(rep).find("body").css("color", this.getAttribute('font-color'));
	
	$(rep).attr("layer", this.getAttribute('layer'));
	
	if (!$(rep).hasClass("webarena_ghost")) {
		if (this.getAttribute("visible") || this.selected) {
			$(rep).css("visibility", "visible");
		} else {
			$(rep).css("visibility", "hidden");
		}
	}

	var that=this;
	
	this.getContentAsString(function(text){

		if(text!=that.oldContent){
			text = text.replace(/\n/g,"<br />")
			text = text.replace(/\s\s/g,"&nbsp; ")
			$(rep).find("body>div>div").html(text);
		}
		
		that.oldContent=text;
		
	});
	
	this.updateInnerHeight();

}


Textarea.updateInnerHeight = function() {
	
	var rep=this.getRepresentation();

	$(rep).find("body").css("height", ($(rep).attr("height"))+"px");
	$(rep).find("body>div").css("height", ($(rep).attr("height")-(2*parseInt(this.getAttribute('linesize'))))+"px");
	
}


Textarea.createRepresentation = function() {
	
	var rep = GUI.svg.other("foreignObject");

	rep.dataObject=this;
	
	var body = document.createElement("body");
	$(body).html('<div><div>TEXT</div></div>');

	$(rep).append(body);

	$(rep).attr("id", this.getAttribute('id'));

	this.initGUI(rep);
	
	return rep;
	
}



Textarea.editText = function() {
	
	GUI.editText(this, true, this.getViewWidth(), this.getViewHeight());
	
}


Textarea.adjustControls = function() {
	this.updateInnerHeight();
	GeneralObject.adjustControls.call(this);
}

