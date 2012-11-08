/**
*    Webarena - A webclient for responsive graphical knowledge work
*
*    @author Felix Winkelnkemper, University of Paderborn, 2011
*
*/
	
Line.draw=function(external){

	var rep=this.getRepresentation();
	
	GeneralObject.draw.call(this, external);

	if (!$(rep).hasClass("selected")) {
		$(rep).children("line").attr("stroke", this.getAttribute('linecolor'));
	}
	
	$(rep).children("line").attr("stroke-width", this.getAttribute('linesize'));

	if (this.getAttribute("direction") == 1 || this.getAttribute("direction") == 3) {
		$(rep).children("line").attr("x1", 0);
		$(rep).children("line").attr("y1", 0);
		$(rep).children("line").attr("x2", this.getViewWidth());
		$(rep).children("line").attr("y2", this.getViewHeight());
	} else {
		$(rep).children("line").attr("x1", 0);
		$(rep).children("line").attr("y1", this.getViewHeight());
		$(rep).children("line").attr("x2", this.getViewWidth());
		$(rep).children("line").attr("y2", 0);
	}

}


Line.createRepresentation = function() {

	var rep = GUI.svg.group(this.getAttribute('id'));

 	GUI.svg.line(rep, 0, 0, 20, 20, {});

	rep.dataObject=this;

	$(rep).attr("id", this.getAttribute('id'));
	$(rep).children("line").addClass("borderRect");

	this.initGUI(rep);
	
	return rep;
	
}


Line.determineDirection = function(widthChanged, heightChanged) {
	
	if (this.getAttribute("direction") == 1) {
		
		if (widthChanged && heightChanged) {
			var direction = 3;
		} else if (widthChanged) {
			var direction = 2;
		} else if (heightChanged) {
			var direction = 4;
		}
		
	} else if (this.getAttribute("direction") == 2) {

		if (widthChanged && heightChanged) {
			var direction = 4;
		} else if (widthChanged) {
			var direction = 1;
		} else if (heightChanged) {
			var direction = 3;
		}

	} else if (this.getAttribute("direction") == 3) {

		if (widthChanged && heightChanged) {
			var direction = 1;
		} else if (widthChanged) {
			var direction = 4;
		} else if (heightChanged) {
			var direction = 2;
		}

	} else if (this.getAttribute("direction") == 4) {

		if (widthChanged && heightChanged) {
			var direction = 2;
		} else if (widthChanged) {
			var direction = 3;
		} else if (heightChanged) {
			var direction = 1;
		}

	}
	
	if (direction !== undefined) {
		this.setAttribute("direction", direction);
	}
	
}


Line.resizeHandler = function() {
	var self = this;
	
	self.determineDirection(self.getViewWidth() < 0, self.getViewHeight() < 0);
	
	if (self.getViewHeight() < 0) {
		self.setViewY(self.getViewY()+self.getViewHeight());
		self.setViewHeight(Math.abs(self.getViewHeight()));
	}
	
	if (self.getViewWidth() < 0) {
		self.setViewX(self.getViewX()+self.getViewWidth());
		self.setViewWidth(Math.abs(self.getViewWidth()));
	}
	
	self.removeControls();
	self.addControls();
	
	GeneralObject.resizeHandler.call(this);
}



Line.setViewWidth = function(value) {
	
	$(this.getRepresentation()).attr("width", value);
	$(this.getRepresentation()).children("line").attr("x2", value);
	
	GUI.adjustContent(this);
}

Line.setViewHeight = function(value) {
	
	$(this.getRepresentation()).attr("height", value);
	
	if (this.getAttribute("direction") == 1 || this.getAttribute("direction") == 3) {
		$(this.getRepresentation()).children("line").attr("y2", value);
	} else {
		$(this.getRepresentation()).children("line").attr("y1", value);
	}

	GUI.adjustContent(this);
}