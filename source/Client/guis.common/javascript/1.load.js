"use strict";

/**
 * indicated if the GUI is fully loaded
 */
GUI.loaded = false;

/**
 * called when a room is entered
 */
GUI.entered = function() {
	
	if (GUI.loaded) {
		//GUI was loaded before --> this is a room change
		GUI.progressBarManager.addProgress(GUI.translate('changing room'), "login");
	}
	
	GUI.loadGUI(2);
	
}

/**
 * Load of GUI (seperated in different steps to ensure working dependencies)
 * @param {int} step Loading step which should be performed
 */
GUI.loadGUI = function(step) {

	/* not logged in? */
	if (!GUI.username) {
		
		/* setup svg area */
		GUI.initSVG(); //build svg area using div #content //needs: nothing
		
		GUI.showLogin();
		return;
	}
	
	if (step == undefined || step == 1) {
		GUI.progressBarManager.updateProgress("login", 20);

		if (!GUI.loaded) GUI.chat.init();
		GUI.chat.clear(); //clear chats messages
		
		if (!GUI.loaded) GUI.sidebar.init(); //init sidebar

		/* login to server */
		ObjectManager.login(GUI.username, GUI.password, GUI.externalSession);
		GUI.externalSession = false;
		
	} else if (step == 2) {
		GUI.progressBarManager.updateProgress("login", 40);

		if (!GUI.loaded)
		GUI.loadListOfPreviewableMimeTypes();

		window.setTimeout(function() {
			GUI.loadGUI(3);
		}, 200);
		
	} else if (step == 3) {
		
		
		console.log('Step 3 - 1');
		
		GUI.progressBarManager.updateProgress("login", 60, GUI.translate('loading GUI'));
		
		console.log('Step 3 - 2');
		
		GUI.startNoAnimationTimer(); //timer to prevent "flying" objects when getting the new list of objects for the room
		
		console.log('Step 3 - 3');
		
		console.log('Step 3 - 10');

		if (!GUI.loaded) GUI.initInspectorAttributeUpdate(); //init updating of attributes in inspector
		
		/* key handling */
		if (!GUI.loaded) GUI.initObjectDeletionByKeyboard(); //handle delete key events to delete selected objects //needs: ObjectManager.getSelected on keydown
		
		console.log('Step 3 - 6');		
		
		if (!GUI.loaded) GUI.initShiftKeyHandling(); //handle shift key events //needs: nothing
		
		console.log('Step 3 - 7');

		if (!GUI.loaded) GUI.initMoveByKeyboard(); //handle arrow key events to move objects //needs: ObjectManager.getSelected on keydown		
		
		
		/* toolbar */
		if (!GUI.loaded) GUI.initToolbar(); //needs: ObjectManager

		console.log('Step 3 - 4');

		/* adjust svg area */
		GUI.adjustContent(); //first scaling of svg area (>= viewport) //needs: ObjectManager.getCurrentRoom

		console.log('Step 3 - 5');	

		console.log('Step 3 - 8');

		/* window resizing */
		if (!GUI.loaded) GUI.initResizeHandler(); //scale up room if it's too small //needs: ObjectManager.getCurrentRoom on document resize

		console.log('Step 3 - 9');

		/* inspector */
		if (!GUI.loaded) GUI.setupInspector(); //add inspector buttons, ...
		
		
		console.log('Step 3 - 11');

		window.setTimeout(function() {
			GUI.loadGUI(4);
		}, 200);
		
	} else if (step == 4) {
		
		console.log('Step 4');
		
		GUI.progressBarManager.updateProgress("login", 80, GUI.translate('rendering objects'));
		
		if (!GUI.loaded) GUI.initMouseHandler();
		
		window.setTimeout(function() {
			GUI.loadGUI(5);
		}, 200);
		
	} else if (step == 5) {
		
		console.log('Step 5');
		
		GUI.progressBarManager.updateProgress("login", 90, GUI.translate('aligning objects'));
		
		GUI.updateLayers(); //update z-order by layer-attribute
		
		GUI.updateInspector();
		
		GUI.loaded = true;
		
		GUI.hideLogin();
		
	} else {
		console.error("unknown load step");
	}

}

/**
 * start loading with step 1 when the document is ready
 */
$(function() {

	console.log('Load GUI');
	GUI.loadGUI(1);
	
});