// This is the client side ObjectManager

"use strict";

var Modules = false;

/**
 * Object providing functions for object management
 * @class ObjectManager
 */
var ObjectManager = {
	get user(){
		return this._user || {};
	},
	set user(val){
		this._user = val;
		try {
			if(val.preferredLanguage && val.preferredLanguage != 'undefined') {
				GUI.currentLanguage = val.preferredLanguage;
			}
		}
		catch(ex){} // Pokemon exception handling
		Object.defineProperty(this._user, 'preferredLanguage', (function(){
			var _preferredLanguage = val.preferredLanguage;
			return {
				set: function(val2) {
					_preferredLanguage = val2;
					GUI.currentLanguage = val2;
					Modules.Dispatcher.query('setUserPreferredLanguage', val2);
				},
				get: function() {
					return _preferredLanguage || GUI.currentLanguage;
				},
			};
		})());
	},
};

ObjectManager.isServer = false;
ObjectManager.objects = {'left': {}, 'right': {}};
ObjectManager.objectsRight = {'left': {}, 'right': {}};
ObjectManager.currentRoomID = {'left': false, 'right': false};
ObjectManager.currentRoom = {'left': false, 'right': false};
ObjectManager.clientID = new Date().getTime() - 1296055327011;
ObjectManager.prototypes = {};
//ObjectManager.user = {};
ObjectManager.clipBoard = {};

/**
 * Registers an object type, so an object of that type can be created using the ObjectManager
 * @function registerType
 * @param type
 * @param constr
 */
ObjectManager.registerType = function(type, constr) {
  this.prototypes[type] = constr;
};

/**
 * @function getTypes
 * @returns {Array} array of prototypes
 */
ObjectManager.getTypes = function() {
  return ObjectManager.prototypes;
};

/**
 * @function getPrototype
 * @param objType
 * @returns	The prototype of the object
 */
ObjectManager.getPrototype = function(objType) {
  var prototypes = this.prototypes;
  if (prototypes[objType])
    return prototypes[objType];
  if (prototypes['UnknownObject'])
    return prototypes['UnknownObject'];
  if (prototypes['GeneralObject'])
    return prototypes['GeneralObject'];
  return;
}

/**
 * @function getIndexOfObject
 * @param {String} objectID
 * @returns {string} Returns the index of an object (important in coupling mode) otherwise it always returns default value 'left'
 */
ObjectManager.getIndexOfObject = function(objectID) {
    
  // room?
  for (var index in this.currentRoomID) {
    if (this.currentRoomID[index] === objectID) {
      return index;
    }
  }

  for (var index in this.currentRoomID) {
    if (ObjectManager.objects[index][objectID] != undefined) {
      return index;
    }
  }
  
  return 'left';
}

/**
 *  @function getObject
 *  @param  {string} objectID    The ID of the object that should be returned  
 *  @return {object}    The object having the specified ID
 */
ObjectManager.getObject = function(objectID) {
  //room?
  for (var index in this.currentRoomID) {
    if (objectID == this.currentRoomID[index]) {
      return this.currentRoom[index];
    }
  }

  for (var index in this.currentRoomID) {
    if (ObjectManager.objects[index][objectID] != undefined) {
      return ObjectManager.objects[index][objectID];
    }
  }
}


/**
 * 
 *  Creates an object of a type 'type' with attributes specified by 'attributes'
 * @function buildObject
 *  @param  {string} type    
 *  @param  {object} attributes    
 *  @return {object}    the created object
 */
ObjectManager.buildObject = function(type, attributes) {

  if (!type)
    console.trace();

  var proto = this.getPrototype(type);
  var object = Object.create(proto);

  object.setLanguage(GUI.currentLanguage);

  object.init(attributes.id);

  object.setAll(attributes);
  object.type = proto.type;
  object.set('type', proto.type);

  var isRoom = false;
  for (var currentRoomIndex in this.currentRoomID) {
    if (object.get('id') == this.currentRoomID[currentRoomIndex]) {
      isRoom = true;
      this.currentRoom[currentRoomIndex] = object;
      this.currentRoom[currentRoomIndex].isGraphical = false; // the current room cannot be positioned
    }
  }
  if (!isRoom) {
    var index = ObjectManager.getIndexOfObject(attributes.inRoom);
    this.objects[index][object.id] = object;
  }

  if (typeof object.afterCreation == "function") {
    object.afterCreation();
  }


  return object;

}


/**
 *  Gets an array of all objects in the room
 * @function getObjects
 *  @param  {string} index  
 *  @returns {Array}    array of objects
 */

ObjectManager.getObjects = function(index) {
  if (!index)
    index = 'left';
  return this.objects[index];
}
ObjectManager.getInventory = ObjectManager.getObjects;

/**
 *  Gets an array of all objects ordered in ascending layer order (highest layer first)
 *  @function getObjectsByLayer
 *  @param  {string} index  
 *  @returns {Array}    array of objects
 */
ObjectManager.getObjectsByLayer = function(index) {

  var objects = this.getObjects(index);

  var objectsArray = [];

  for (var i in objects) {
    var obj = objects[i];
    objectsArray.push(obj);
  }

  objectsArray.sort(function(a, b) {

    if (a.alwaysOnTop() === true) {
      return 1;
    }

    if (b.alwaysOnTop() === true) {
      return -1;
    }

    if (a.getAttribute("layer") > b.getAttribute("layer")) {
      return 1;
    } else {
      return -1;
    }

  });

  return objectsArray;

}

/**
 *  Gets an array of all objects ordered in descending layer order (lowest layer first)     
 *  @function getObjectsByLayerInverted
 *  @param  {string} index
 *  @returns {Array}    array of objects
 */

ObjectManager.getObjectsByLayerInverted = function(index) {

  var objects = ObjectManager.getObjectsByLayer(index);
  objects.reverse();

  return objects;

}


/**
 *  Checks whether an object is in the current inventory
 *  @function hasObject
 *  @param  {object} obj
 *  @returns {Boolean}    array of objects
 */
ObjectManager.hasObject = function(obj) {
  return !!this.getObject(obj.getAttribute('id'));
}


/**
 *  Updates the old object attributes with the new ones specified in 'data'
 *  @function objectUpdate
 *  @param  {object} data    new attribute values of the object
 */
ObjectManager.objectUpdate = function(data) {
  var object = ObjectManager.getObject(data.id);

  if (object) {

    if (object.moving) {
      return;
    }

    var oldData = object.get();
    object.setAll(data);

    /**
     TODO Room updated come with no object type. Why?
     
     if (!data.type){
     console.log('No type');
     console.log(data);
     console.trace();
     }
     **/

    for (var key in oldData) {
      var oldValue = oldData[key];
      var newValue = data[key];
      
      if (oldValue != newValue) {
        this.attributeChanged(object, key, newValue);
      }
    }

    object.refreshDelayed();
  } else {
    object = ObjectManager.buildObject(data.type, data);

    if (GUI.couplingModeActive) {
        
      // to enable smooth dragging of objects between rooms display new objects immediately 
      // exceptions: SimpleText and Textarea need to load their content first else they are invisible or empty
      if (data.type !== "SimpleText" && data.type !== "Textarea") {
        object.refresh();
      } else {
        object.refreshDelayed();
      }
    } else {
      object.refreshDelayed();
    }
  }

}
/**
 *  @function attributeChanged
 *  @param  {type} object
 *  @param  {type} key
 *  @param  {type} newValue
 *  @param  {type} local
 */
ObjectManager.attributeChanged = function(object, key, newValue, local) {

  if (!object.attributeManager.getAttributes()[key])
    return;

  var changedFunction = object.attributeManager.getAttributes()[key].changedFunction;

  if (changedFunction)
    changedFunction(object, newValue, local);

  if (this.informGUI)
    this.informGUI(object, key, newValue, local)
  else
    console.log('GUI is not listening to attribute changes. (use Modules.ObjectManager.registerAttributeChangedFunction)');

}

ObjectManager.informGUI = false;


/**
 *  @function registerAttributeChangedFunction
 *  @param  {function} theFunction
 */
ObjectManager.registerAttributeChangedFunction = function(theFunction) {
  this.informGUI = theFunction;
}

/**
 *  @function contentUpdate
 *  @param  {object} data    new attribute values of the object
 */
ObjectManager.contentUpdate = function(data) {
  var object = ObjectManager.getObject(data.id);
  object.contentUpdated();
}

/**
 *  @function remove
 *  @param  {type} object
 */
ObjectManager.remove = function(object) {
  var that = this;
  if (!this.transactionId) {
    that.transactionId = new Date().getTime();
  } else {
    window.transactionTimer = window.setTimeout(function() {
      //calculate new transactionId
      //TODO: isn't safe - concurrent users may result in same timestamp
      that.transactionId = new Date().getTime();
    }, this.transactionTimeout);
  }


  Modules.SocketClient.serverCall('umDeleteObjectFromTabs',{
    'objectID' : object.getID()
  });

  Modules.SocketClient.serverCall('deleteObject', {
    'roomID': object.getRoomID(),
    'objectID': object.getID(),
    'transactionId': that.transactionId,
    'userId': GUI.userid
  });
};
/**
 *  @function removeLocally
 *  @param  {object} data
 */
ObjectManager.removeLocally = function(data) {
  var object = ObjectManager.getObject(data.id);

  //remove representation
  if (object.removeRepresentation) {
    object.removeRepresentation();
  }

  delete(ObjectManager.objects[ObjectManager.getIndexOfObject(data.id)][data.id]);
};

/**
 *  @function login
 *  @param  {String} username
 *  @param  {String} password
 *  @param  {type} externalSession
 */
ObjectManager.login = function(username, password, externalSession) {
  if (!username)
    username = 'guest';
  if (!password)
    password = '';
  Modules.SocketClient.serverCall('login', {
    'username': username,
    'password': password,
    'externalSession': externalSession
  });
};

/**
 *  @function goParent
 */
ObjectManager.goParent = function() {
  var parent = ObjectManager.getCurrentRoom().getAttribute('parent');
  if (parent) {
    ObjectManager.loadRoom(ObjectManager.getCurrentRoom().getAttribute('parent'));
  } else {
    alert(GUI.translate('This room has no parent.'));
  }
};

/**
 *  @function goHome
 */
ObjectManager.goHome = function() {
  ObjectManager.loadRoom(ObjectManager.user.home);
};

/**
 *  @function loadRoom
 *  @param  {type} roomid
 *  @param  {type} byBrowserNav
 *  @param  {type} index
 *  @param  {function} callback
 */
ObjectManager.loadRoom = function(roomid, byBrowserNav, index, callback) {
  var self = this;

  if(!index)
    var index = 'left';
  
  // in coupling mode: do not load room on both sides
  var proceed = true;
  if (GUI.couplingModeActive && (ObjectManager.getRoomID('left') == roomid || ObjectManager.getRoomID('right') == roomid)) {
    proceed = false;
  }

  if (proceed) {
    Modules.Dispatcher.query('enter', {'roomID': roomid, 'index': index}, function(error) {

      if (error !== true) {
        var objects = self.getObjects(index);
        for (var i in objects) {
          var obj = objects[i];
          ObjectManager.removeLocally(obj);
        }

        if (!roomid)
          roomid = 'public';
        self.currentRoomID[index] = roomid;

        if (!byBrowserNav && index === 'left') {
          history.pushState({'room': roomid}, roomid, '/room/' + roomid);
        }

        if (GUI.couplingModeActive) {
          GUI.defaultZoomPanState(index, true);
        }

        if (callback)
          setTimeout(callback, 1200);

      }

    });
  } else {
    alert(GUI.translate("Room already displayed"));
  }

}

/**
 *  @function loadPaperWriter
 *  @param {type} roomid
 *  @param {type} byBrowserNav
 *  @param {type} index
 *  @param {Function} callback
 */
ObjectManager.loadPaperWriter = function(roomid, byBrowserNav, index, callback) {
  var self = this;

  // in coupling mode: do not load room on both sides
  var proceed = true;
  if (GUI.couplingModeActive && (ObjectManager.getRoomID('left') == roomid || ObjectManager.getRoomID('right') == roomid)) {
    proceed = false;
  }

  if (proceed) {
    Modules.Dispatcher.query('enterPaperWriter', {'roomID': roomid, 'index': index}, function(error) {

      if (error !== true) {
        var objects = self.getObjects(index);
        for (var i in objects) {
          var obj = objects[i];
          ObjectManager.removeLocally(obj);
        }

        if (!roomid) roomid = 'public';
        
        self.currentRoomID[index] = roomid;

        if (!byBrowserNav && index === 'left') {
          history.pushState({'room': roomid}, roomid, '/room/' + roomid);
        }

        if (GUI.couplingModeActive) {
          GUI.defaultZoomPanState(index, true);
        }

        if (callback) setTimeout(callback, 1200);
      }

    });
  } else {
    alert(GUI.translate("Room already displayed"));
  }
}
/**
 *  @function loadSpecificSpace
 *  @param {type} roomid
 *  @param {type} byBrowserNav
 *  @param {type} index
 *  @param {type} space
 *  @param {Function} callback
 */
ObjectManager.loadSpecificSpace = function(roomid, byBrowserNav, index, space, callback) {
  var self = this;

  // in coupling mode: do not load room on both sides
  var proceed = true;
  if (GUI.couplingModeActive && (ObjectManager.getRoomID('left') == roomid || ObjectManager.getRoomID('right') == roomid)) {
    proceed = false;
  }

  if (proceed) {
    Modules.Dispatcher.query(space, {'roomID': roomid, 'index': index}, function(error) {

      if (error !== true) {
        var objects = self.getObjects(index);
        for (var i in objects) {
          var obj = objects[i];
          ObjectManager.removeLocally(obj);
        }

        if (!roomid)
          roomid = 'public';
        self.currentRoomID[index] = roomid;

        if (!byBrowserNav && index === 'left') {
          history.pushState({'room': roomid}, roomid, '/room/' + roomid);
        }

        if (GUI.couplingModeActive) {
          GUI.defaultZoomPanState(index, true);
        }

        if (callback)
          setTimeout(callback, 1200);
      }

    });
  } else {
    alert(GUI.translate("Room already displayed"));
  }
}

/**
 *  @function leaveRoom
 *  @param {type} roomid
 *  @param {type} index
 *  @param {type} serverCall
 */
ObjectManager.leaveRoom = function(roomid, index, serverCall) {
  var self = this;

  if (!index)
    var index = 'right';

  if (serverCall) {
    Modules.Dispatcher.query('leave', {'roomID': roomid, 'index': index, 'user': self.getUser()}, function(error) {

      if (error !== true) {

        var objects = self.getObjects(index);
        for (var i in objects) {
          var obj = objects[i];
          ObjectManager.removeLocally(obj);
        }

        self.currentRoomID[index] = false;
        self.currentRoom[index] = false;

      }

    });
  } else {
    var objects = self.getObjects(index);
    for (var i in objects) {
      var obj = objects[i];
      ObjectManager.removeLocally(obj);
    }

    self.currentRoomID[index] = false;
    self.currentRoom[index] = false;
  }
}

/**
 *  @function createObject
 *  @param {type} type
 *  @param {type} attributes
 *  @param {type} content
 *  @param {Function} callback
 *  @param {type} index
 */
ObjectManager.createObject = function(type, attributes, content, callback, index) {
  if (!index)
    var index = 'left';

  var data = {
    'roomID': this.currentRoomID[index],
    'type': type,
    'attributes': attributes,
    'content': content
  };

  Modules.Dispatcher.query('createObject', data, function(objectID) {
    
    // objectID is the id of the newly created object
    // the object may not yet be loaded so we wait for it
    var runs = 0;
    var object = false;
    var interval = setInterval(function() {
        
      if (runs == 50) {
        console.log('ERROR: Timeout while waiting for the object');
        clearTimeout(interval);
        return;
      }
      object = Modules.ObjectManager.getObject(objectID);
      if (object) {
        clearTimeout(interval);

        ObjectManager.renumberLayers(true);

        object.justCreated();
        if (callback != undefined) {
          callback(object);
        }
        
        return;
      }
      runs++;
    }, 100);

  });
}
/**
 *  @function init
 */
ObjectManager.init = function() {
  this.transactionId = false;
  this.transactionTimeout = 500;
  var that = this;

  Modules.Dispatcher.registerCall('infotext', function(text) {
    var translatedText = GUI.translate(text);
    //GUI.error("warning", text, false, false);
    $().toastmessage('showToast', {
      'text': translatedText,
      'sticky': false,
      'position': 'top-left'
    });
  });

  Modules.Dispatcher.registerCall('welcome', function(data) {

  });

  Modules.Dispatcher.registerCall('loggedIn', function(data) {
    GUI.loggedIn();
    ObjectManager.user = data.userData;
    ObjectManager.userHash = data.userhash;

    if (GUI.startRoom !== undefined && GUI.startRoom != '') {
      ObjectManager.loadRoom(GUI.startRoom);
    } else if (data.home !== undefined) {
      ObjectManager.loadRoom(data.home);
    } else {
      GUI.error("Unable to load room", "Unable to load room. (no room defined)", false, true);
    }

  });

  Modules.Dispatcher.registerCall('loginFailed', function(data) {
    GUI.loginFailed(data);
  });

  Modules.Dispatcher.registerCall('objectUpdate', function(data) {

    ObjectManager.objectUpdate(data);
  })

  Modules.Dispatcher.registerCall('paintingsUpdate', function(data) {
    ObjectManager.paintingUpdate(data);
  })

  Modules.Dispatcher.registerCall('objectDelete', function(data) {
    ObjectManager.removeLocally(data);
  });

  Modules.Dispatcher.registerCall('contentUpdate', function(data) {
    ObjectManager.contentUpdate(data);
  });

  Modules.Dispatcher.registerCall('entered', function(data) {
    GUI.entered();
  });

  Modules.Dispatcher.registerCall('error', function(data) {
    GUI.error("server error", data, false, true);
  });
  
  Modules.Dispatcher.registerCall('newObjectForContainer', function(data) {
  
    var con = ObjectManager.getObject(data.ContainerId);
	
	if(data.type == "custom"){
		con.newFile(data.objectId);
	}
	if(data.type == "favourite" || data.type == "reference"){
		con.upd();
	}
  });

  Modules.Dispatcher.registerCall('inform', function(data) {

    if (data.message.awareness !== undefined && data.message.awareness.present !== undefined) {
      //list of users
      var users = [];
      for (var i = 0; i < data.message.awareness.present.length; i++) {
        var d = data.message.awareness.present[i];
        users.push(d);
      }
      GUI.chat.setUsers(users);
      GUI.userMarker.removeOfflineUsers(users);
    }

    if (data.message.text !== undefined) {
      GUI.chat.addMessage(data.user, data.message.text, data.color, data.message.read);
    }

    if (data.message.textOne !== undefined) {
      GUI.chat.addMessageOne(data.user, data.message.textOne, data.color, data.message.read);
    }

    if (data.message.selection) {
      if (data.userId != ObjectManager.user.id) { //do not display own selections

        GUI.userMarker.select({
          "objectId": data.message.selection,
          "title": data.user,
          "identifier": data.userId,
          "color": data.color
        });

      }

    }

    if (data.message.deselection) {

      if (data.userId != ObjectManager.user.id) { //do not display own selections

        GUI.userMarker.deselect({
          "objectId": data.message.deselection,
          "identifier": data.userId,
        });

      }

    }

  });


  Modules.Dispatcher.registerCall('askForChoice', function(data) {

    var dialogTitle = data.title;
    var choices = data.choices;

    var onSave = function() {
      var responseEvent = 'response::askForChoice::' + data.responseID
      var choice = $(dialog).find('input:radio:checked').val();
      console.log(choice);
      Modules.Socket.emit(responseEvent, {choice: choice});
    }
    var onExit = function() {
      return false;
    };

    var dialogButtons = {
      "Antworten": onSave,
      "Abbrechen": onExit
    };

    var content = '<form>';
    content = _(choices).reduce(function(accum, choice) {
      //TODO perhaps need to escape whitesapces in choice
      return accum + "<input type='radio' name='some-choice' value='" + choice + "'>" + choice + "<br/>";
    }, content)
    content += "</form>";
    console.log(content);
    console.log(data);

    var dialog = GUI.dialog(dialogTitle, content, dialogButtons);


  });
}
/**
 *  @function getRoomID
 *  @param {type} index
 */
ObjectManager.getRoomID = function(index) {
  if (!index)
    var index = 'left';
  return this.currentRoomID[index];
}
/**
 *  @function getCurrentRoom
 *  @param {type} index
 */
ObjectManager.getCurrentRoom = function(index) {
  if (!index)
    var index = 'left';
  return this.currentRoom[index];
}

/**
 *  @function getSelected
 */
ObjectManager.getSelected = function() {
  var result = [];

  for (var index in this.objects) {
    for (var i in this.objects[index]) {
      var obj = this.objects[index][i];

      if (obj.isSelected()) {
        result.push(obj);
      }

    }
  }

  return result;
}

/**
 *  @function getActionsForSelected
 */
ObjectManager.getActionsForSelected = function() {

  var selectedObjects = this.getSelected();

  var actions = new Array();

  for (var key in selectedObjects) {
    var object = selectedObjects[key];

    var objActions = new Array();

    var a = object.getActions();

    for (var actionName in a) {
      var actionData = a[actionName];

      if ((!actionData.single || selectedObjects.length == 1) && (!actionData.visibilityFunc || actionData.visibilityFunc())) {
        objActions.push(actionName);
      }

    }

    actions = Helper.getIntersectionOfArrays(actions, objActions);

  }

  return actions;

}

/**
 *  @function performActionForSelected
 *  @param {type} actionName
 *  @param {type} clickedObject
 */
ObjectManager.performActionForSelected = function(actionName, clickedObject) {

  var selectedObjects = this.getSelected();

  if (!selectedObjects)
    return;

  selectedObjects[0].performAction(actionName, clickedObject);

}

/**
 *  @function renumberLayers
 *  @param {type} noUpdate
 */
ObjectManager.renumberLayers = function(noUpdate) {

  /* get all objects and order by layer */
  var objects = ObjectManager.getObjects();

  var objectsArray = [];

  for (var i in objects) {
    var obj = objects[i];
    objectsArray.push(obj);
  }

  objectsArray.sort(function(a, b) {

    if (a.getAttribute("layer") > b.getAttribute("layer")) {
      return 1;
    } else {
      return -1;
    }

  });

  /* set new layers */
  var layer = 1;

  for (var i in objectsArray) {
    var obj = objectsArray[i];

    obj.setAttribute("layer", layer);
    layer++;

  }

  if (noUpdate === undefined) {
    GUI.updateLayers();
  }

}
/**
 *  @function getUser
 * @returns the user
 */
ObjectManager.getUser = function() {
  return this.user;
}
/**
 *  @function serverMemoryInfo
 */
ObjectManager.serverMemoryInfo = function() {
  ObjectManager.Modules.Dispatcher.query('memoryUsage', '', console.log);
}
/**
 *  @function inform
 *  @param {type} type
 *  @param {type} content
 *  @param {type} index
 */
ObjectManager.inform = function(type, content, index) {
  var data = {};
  data.message = {};
  data.message[type] = content;
  data.room = this.getRoomID(index);
  data.user = this.getUser().username;
  data.color = this.getUser().color;
  data.userId = this.getUser().id;
  ObjectManager.Modules.Dispatcher.query('inform', data);
}

/**
 *  @function tell
 *  @param {type} text
 */
ObjectManager.tell = function(text) {
  ObjectManager.inform('text', text);
}

/**
 *  @function tell
 *  @param {type} text
 */
ObjectManager.tellOne = function(text) {
    //data.message[type] = content;
    // text goes to content
    // 'textOne' goes to type
    ObjectManager.inform('textOne', text);
}

/**
 *  @function informAboutSelection
 *  @param {String} id
 */
ObjectManager.informAboutSelection = function(id) {
  ObjectManager.inform('selection', id, ObjectManager.getIndexOfObject(id));
}
/**
 *  @function informAboutDeselection
 *  @param {String} id
 */
ObjectManager.informAboutDeselection = function(id) {
  ObjectManager.inform('deselection', id, ObjectManager.getIndexOfObject(id));
}
/**
 *  @function requestAttentionToObject
 *  @param {String} id
 */
ObjectManager.requestAttentionToObject = function(id) {
  ObjectManager.inform('requestAttention', id, ObjectManager.getIndexOfObject(id));
}
/**
 *  @function reportBug
 *  @param {object} data
 *  @param {Function} callback
 */
ObjectManager.reportBug = function(data, callback) {
  ObjectManager.Modules.Dispatcher.query('bugreport', data, callback);
}
/**
 *  @function showAll
 */
ObjectManager.showAll = function() {

  var objects = ObjectManager.getObjects();

  for (var i in objects) {
    var obj = objects[i];
    obj.setAttribute("visible", true);
  }

}
/**
 *  @function copyObjects
 *  @param {type} objects
 */
ObjectManager.copyObjects = function(objects) {
  if (objects != undefined && objects.length > 0) {
    ObjectManager.clipBoard.cut = false;

    var array = new Array();

    for (var key in objects) {
      var object = objects[key];
      array.push(object.getId());
    }

    ObjectManager.clipBoard.room = objects[0].getCurrentRoom();
    ObjectManager.clipBoard.objects = array;
  }
}
/**
 *  @function cutObjects
 *  @param {type} objects
 */
ObjectManager.cutObjects = function(objects) {
  if (objects != undefined && objects.length > 0) {
    ObjectManager.clipBoard.cut = true;

    var array = new Array();

    for (var key in objects) {
      var object = objects[key];
      array.push(object.getId());
    }

    ObjectManager.clipBoard.room = objects[0].getCurrentRoom();
    ObjectManager.clipBoard.objects = array;
  }
}
/**
 *  @function pasteObjects
 */
ObjectManager.pasteObjects = function() {

  if (ObjectManager.clipBoard.objects != undefined && ObjectManager.clipBoard.objects.length > 0) {

    var paste = false;
    if (ObjectManager.clipBoard.objects.length <= 5) {
      paste = true;
    } else {
      paste = GUI.confirm(GUI.translate('You are pasting') + ' ' + ObjectManager.clipBoard.objects.length + ' ' + GUI.translate('objects') + '.\n'
              + GUI.translate('Do you want to continue?'));
    }

    if (paste) {
      var requestData = {};

      requestData.fromRoom = ObjectManager.clipBoard.room;
      requestData.toRoom = this.getRoomID();
      requestData.objects = ObjectManager.clipBoard.objects;
      requestData.cut = ObjectManager.clipBoard.cut;
      requestData.attributes = {};

      // select new objects after duplication
      var newIDs = [];
      var minX = Number.MAX_VALUE;
      var minY = Number.MAX_VALUE;
      var selectNewObjects = function() {
        for (var key in newIDs) {
          var newObject = ObjectManager.getObject(newIDs[key]);
          newObject.select(true);

          // determine left most and top most coordinates of pasted objects in case of scrolling
          if (newObject.getAttribute('x') < minX) {
            minX = newObject.getAttribute('x');
          }
          if (newObject.getAttribute('y') < minY) {
            minY = newObject.getAttribute('y');
          }
        }

        // if objects were moved between rooms scroll to position of pasted objects
        if (requestData.fromRoom != requestData.toRoom) {
          if (!GUI.couplingModeActive) {
            if (minX - 30 < 0)
              minX = 30;
            if (minY - 30 < 0)
              minY = 30;

            $(document).scrollTo(
                    {
                      top: minY - 30,
                      left: minX - 30
                    },
            1000
                    );
          }
        }
      };

      Modules.Dispatcher.query('duplicateObjects', requestData, function(idList) {
        newIDs = idList;
        GUI.deselectAllObjects();
        setTimeout(selectNewObjects, 200);
      });

      if (ObjectManager.clipBoard.cut) {
        ObjectManager.clipBoard = {};
      }
    }
  }
}
/**
 *  @function duplicateObjects
 *  @param {type} objects
 */
ObjectManager.duplicateObjects = function(objects) {
  if (objects != undefined && objects.length > 0) {

    var duplicate = false;
    
    if (objects.length <= 5) {
      duplicate = true;
    } else {
      duplicate = GUI.confirm(GUI.translate('You are duplicating') + ' ' + objects.length + ' ' + GUI.translate('objects') + '.\n'
              + GUI.translate('Do you want to continue?'));
    }

    if (duplicate) {
      var array = new Array();

      for (var key in objects) {
        var object = objects[key];
        array.push(object.getId());
      }

      var requestData = {};
      requestData.fromRoom = objects[0].getCurrentRoom();
      requestData.toRoom = objects[0].getCurrentRoom();
      requestData.objects = array;
      requestData.cut = false;
      requestData.duplicate = true;
      requestData.attributes = {};

      // select new objects after duplication
      var newIDs = [];
      var selectNewObjects = function() {
        for (var key in newIDs) {
            
            var runs = 0;
            var newObject = false;
            
            var interval = setInterval(function() {
                
                if (runs == 50) {
                    console.log("selectNewObjects Object " + newIDs[key] + " was not found");
                    clearTimeout(interval);
                    return;
                }
                
                var newObject = ObjectManager.getObject(newIDs[key]);
                if (newObject) {
                    clearTimeout(interval);
                    newObject.select(true);
                    return
                }
                
                runs++;
                
            }, 100);
  
        }
      };

      Modules.Dispatcher.query('duplicateObjects', requestData, function(idList) {
        newIDs = idList;
        GUI.deselectAllObjects();
        
        setTimeout(selectNewObjects, 200 + (idList.length * 100));
      });
      
    }
  }
}
/**
 *  @function moveObjectBetweenRooms
 *  @param {type} fromRoom
 *  @param {type} toRoom
 *  @param {type} cut
 */
ObjectManager.moveObjectBetweenRooms = function(fromRoom, toRoom, cut) {
  var objects = ObjectManager.getSelected();

  if (objects != undefined && objects.length > 0) {

    var array = new Array();

    var positions = {};
    for (var key in objects) {
      var object = objects[key];
      array.push(object.getId());

      positions[object.getId()] = {};
      positions[object.getId()]['x'] = object.getViewX();
      positions[object.getId()]['y'] = object.getViewY();
    }

    var requestData = {};
    requestData.fromRoom = fromRoom;
    requestData.toRoom = toRoom;
    requestData.objects = array;
    requestData.cut = cut;
    requestData.attributes = positions;

    var newIDs = [];
    var selectNewObjects = function() {
      for (var key in newIDs) {
        var newObject = ObjectManager.getObject(newIDs[key]);
        newObject.select(true);
      }
    };

    Modules.Dispatcher.query('duplicateObjects', requestData, function(idList) {
      newIDs = idList;
      GUI.deselectAllObjects();
      setTimeout(selectNewObjects, 200);
    });
  }
}
/**
 *  @function paintingUpdate
 *  @param {object} data
 */
ObjectManager.paintingUpdate = function(data)
{
  if (!ObjectManager.getCurrentRoom().getAttribute("showUserPaintings"))
    return;

  ObjectManager.getCurrentRoom().getUserPaintings(function(paintings)
  {
    for (var n = 0; n < paintings.length; n++)
    {
      if ($("#userPainting_" + paintings[n]).length == 0)
      {
        var img = document.createElement("img");

        img.setAttribute("id", "userPainting_" + paintings[n]);
        img.style.pointerEvents = "none";
        img.style.position = "absolute";
        img.style.left = 0;
        img.style.top = 0;
        img.style.zIndex = n + 1;

        document.getElementById("content").appendChild(img);
      }

      $("#userPainting_" + paintings[n]).attr("src", ObjectManager.getCurrentRoom().getUserPaintingURL(paintings[n]));
    }
  });
}

