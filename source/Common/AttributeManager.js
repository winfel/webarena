/**
*    Webarena - A webclient for responsive graphical knowledge work
*
*    @author Felix Winkelnkemper, University of Paderborn, 2010
*
*/


/**
*	Each object type get its attribute manager. Attributes must be registred
*   in the attribute manager before they can be set or got. This is necessary
*   for GUIs to implement an object inspector as well as for channelling data
*   access to the server.
*
*   Note: There is no data stored in the attribute manager. These data, which
*   is unique for every single object, is saved in the data member of the
*   respective object
*/
var AttributeManager=Object.create(Object);

AttributeManager.proto=false;
AttributeManager.attributes=false;

AttributeManager.init=function(proto){
	
	// The attribute manager is initialized during the registration of object
	// types so we create the datastructure for the prototype
	
	this.proto=proto;
	this.attributes={};
	
}

AttributeManager.toString=function(){
	return 'AttributeManager for '+this.proto;
}

/**
*	register an attribute for a prototype
*
*	data: 	type - 'text','number','color',...
*			unit - '%','°',...
*			min - integer
*			max - integer
*			standard
*			setter - function
*			getter - function
*			readonly - true, false
*			hidden - true, false
*			category - a block or tab this attribute should be displayed in
*
*
*/
AttributeManager.registerAttribute=function(attribute,data){
	
	if (!attribute) return;
	var manager=this;
	

	// fill in old properties, if the attribute has yet been registred.
	var oldData=this.attributes[attribute] || {};
	
	//if (oldData) debug('Attribute '+attribute+' for '+this.proto+' type '+data.type+' has already been specified.');
	
	for (var key in oldData){
		var oldValue=oldData[key];
		if (!data[key]) data[key]=oldValue;
	}

	
	//debug('Registering attribute '+attribute+' for '+this.proto+' type '+data.type);
	
	if (!data.type) data.type='text';
	data.description=attribute;
	if (!data.unit) data.unit='';
	if (!data.min) data.min=-50000;
	if (!data.max) data.max=50000;
	if (data.standard==undefined) data.standard=0;
	if (data.category==undefined) data.category='Basic';
	
	data.setterInt=data.setter;
	data.getterInt=data.getter;
	
	data.setter=function(object,value){
		if (value===undefined) value=data.standard;
		if (data.type=='number' || data.type=='fontsize'){
			value=parseInt(value,10);
			if (isNaN(value)) value=data.standard;
			if (value<data.min) value=data.min;
			if (value>data.max) value=data.max;
		}
		if (data.setterInt) {
			data.setterInt(object,value);
		}
		else {
			object.data[attribute]=value;
		}
	}

	data.getter=function(object){
		if (!data.getterInt) {
			var result=object.data[attribute];
		} else {
			var result=data.getterInt(object);
		}
		if (result===undefined) {
			result=data.standard;
		}

		if (data.type=='number' && attribute!='id'){
			result=parseInt(result,10);
			if (isNaN(result)) result=data.standard;
			if (result<data.min) {
				result=data.min;
			}
			
			if (result>data.max) {
				result=data.max;
			}
		
		}
			
		
		return result;
	}

	
	this.attributes[attribute]=data;
	
	return data;

}

var saveDelays={};

/**
*	set an attribute to a value on a specified object
*/
AttributeManager.setAttribute=function(object,attribute,value,forced){
	
	var time=new Date().getTime()-1328721558003;;
	
	// Check, if the attribute is registred
	
	if (this.attributes[attribute]==undefined){
		console.log('Attribute '+attribute+' is not registred for '+this.proto);
		return undefined;
	}
	
	// do nothing, if value has not changed
	
	if (object.data[attribute]===value) return false;
	
	var setter=this.attributes[attribute].setter;
	
	// check if the attribute is read only
	
	if (this.attributes[attribute].readonly) {
		console.log('Attribute '+attribute+' is read only for '+this.proto);
		return undefined;
	}
	
	// call the setter function
	
	setter(object,value);
	
	// persist the results
	
	if (object.ObjectManager.isServer){
		object.persist();
	} else {

		var identifier=object.id+'#'+attribute;
		
		if (saveDelays[identifier]){
			window.clearTimeout(saveDelays[identifier]);
			delete(saveDelays[identifier]);
		}
		
		
		var data={'roomID':object.data.inRoom, 'objectID':object.id, 'key':attribute, 'value':value};
		
		if (forced) {
			Modules.SocketClient.serverCall('setAttribute',data);
		} else {
			saveDelays[identifier]=window.setTimeout(function(){
				Modules.SocketClient.serverCall('setAttribute',data);
			},1000);
		}
		
	}
	
	if (object.ObjectManager.attributeChanged) object.ObjectManager.attributeChanged(object,attribute,this.getAttribute(object, attribute),true);
	
	return true;
}

/**
*	get an attribute of a specified object
*/
AttributeManager.getAttribute=function(object,attribute){
	
	// Check, if the attribute is registred
	
	if (this.attributes[attribute]==undefined){
		return object.data[attribute];
	}
	
	var getter=this.attributes[attribute].getter;
	
	// call the getter function
	
	return getter(object);
}


AttributeManager.hasAttribute=function(object,attribute) {
	return (this.attributes[attribute]!=undefined);
}

/**
*	get the attributes (e.g. for GUI)
*/
AttributeManager.getAttributes=function(){
	return this.attributes;
}

module.exports=AttributeManager;