File.contentUpdated=function(){

	this.updateThumbnail();
	
}

File.justCreated=function(){
	if (!this.getAttribute("hasContent")) {
		this.execute();
	}
}


File.openFile=function(){
	
	window.open(this.getContentURL(), "_blank");
	
}

File.isPreviewable=function(){
	
	return GUI.mimeTypeIsPreviewable(this.getAttribute("mimeType"));
	
}