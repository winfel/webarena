/**
 * @namespace Holding methods and variables for displaying a sidebar
 */
 /**
 * @file 2.sidebar.js
 */
GUI.sidebar = {};

/**
 * True if the sidebar is shown
 */
GUI.sidebar.open = false;

/**
 * Currently shown element
 */
GUI.sidebar.currentElement = undefined;

/**
 * A saved state of the sidebar
 */
GUI.sidebar.savedState = undefined;

/**
 * Available sidebar pages
 */
GUI.sidebar.elementConfig = {
  "inspector": {
    order: 0,
    title: GUI.translate("Object inspector"),
  },
  "rightmanager": {
    order: 1,
    title: GUI.translate("Right Manager"),
  },
  "search": {
    order: 2,
    title: GUI.translate("Filter"),
  },
  "chat": {
    order: 3,
    title: GUI.translate("Chat"),
    onOpen: GUI.chat.opened
  },
  "bug": {
    order: 4,
    title: GUI.translate("Bugreport"),
  },

};

/** 
 * Moves (scrolls) the sidebar to x position
 * @function transformX
 * @param {DomElement} target The targets DOM element
 * @param {int} x The x position to move the sidebar to
 */
GUI.sidebar.transformX = function(target, x) {

  var trans = "translate3d(" + x + "px,0,0)";

  target.css("-webkit-transform", trans);
  target.css("-moz-transform", trans);
  target.css("-o-transform", trans);

}

/**
 * Opens a sidebar page
 * @function openPage
 * @param {string} element The name of the page to open (see GUI.sidebar.elementConfig)
 * @param {DomElement} [button] The button which triggered the opening
 */
GUI.sidebar.openPage = function(element, button) {

  /* check if the given element name exists */
  if (GUI.sidebar.elementConfig[element] == undefined) {
    //console.error("Open Sidebar: Unknown element ID");
    return;
  }

  /* check if the page is already open */
  if (GUI.sidebar.currentElement == element && GUI.sidebar.open) {
    GUI.sidebar.closeSidebar();
    return;
  }

  /* set currently opened element/page */
  GUI.sidebar.currentElement = element;

  var left = GUI.sidebar.elementConfig[element]['order'] * $("#sidebar").width() * (-1);

  /* check if sidebar is shown */
  if (!GUI.sidebar.open) {
    /* disable page flip animation and open sidebar (prevent multiple animations at once) */

    //disable animation for the next 500ms
    $("#sidebar_content>div").removeClass("animate");

    window.setTimeout(function() {
      $("#sidebar_content>div").addClass("animate");
    }, 500);

    GUI.sidebar.openSidebar();

  }

  GUI.sidebar.transformX($("#sidebar_content").children("div"), left);

  // Change the sidebar title
  $("#sidebar_title").children("span").html(GUI.sidebar.elementConfig[element]['title']);

  $(".sidebar_button").removeClass("active");

  if (GUI.sidebar.elementConfig[element]['onOpen'] !== undefined) {
    GUI.sidebar.elementConfig[element]['onOpen']();
  }


  if (button !== undefined) {
    GUI.sidebar.elementConfig[element]['button'] = button;
  }

  if (GUI.sidebar.elementConfig[element]['button'] !== undefined) {
    $(GUI.sidebar.elementConfig[element]['button']).addClass("active");
  }

  $("#sidebar_content").scrollTop(0);

}

/**
 * Opens the sidebar using animation
 * @function openSidebar
 */
GUI.sidebar.openSidebar = function() {

  GUI.sidebar.transformX($("#sidebar"), 0);
  GUI.sidebar.transformX($("#header>.header_right"), -250);
  GUI.sidebar.transformX($("#header>.header_tabs_sidebar"), 0);

  GUI.sidebar.open = true;

  $("#header_toggle_sidebar_hide").show();
  $("#header_toggle_sidebar_show").hide();
};
/**
 * Closes the sidebar
 * @function closeSidebar
 * @param {bool} noReset True if the current element should not be reset (used by GUI.sidebar.saveStateAndHide)
 */
GUI.sidebar.closeSidebar = function(noReset) {

  GUI.sidebar.transformX($("#sidebar"), 230);
  GUI.sidebar.transformX($("#header>.header_right"), -20);
  GUI.sidebar.transformX($("#header>.header_tabs_sidebar"), 230);

  GUI.sidebar.open = false;

  if (noReset !== true) {
    GUI.sidebar.currentElement = undefined;
  }

  $(".sidebar_button").removeClass("active");

  $("#header_toggle_sidebar_hide").hide();
  $("#header_toggle_sidebar_show").show();
};

/**
 * Shows the sidebar
 * @function show
 */
GUI.sidebar.show = function() {
  $("#sidebar").show();
  $('.header_tabs_sidebar').show();
}

/**
 * Hide the sidebar
 * @function show
 */
GUI.sidebar.hide = function() {
  $("#sidebar").hide();
  $('.header_tabs_sidebar').hide();
}

/**
 * Saves the current sidebar state and hides it
 * @function saveStateAndHide
 */
GUI.sidebar.saveStateAndHide = function() {

  GUI.sidebar.savedState = {
    "open": GUI.sidebar.open,
    "currentElement": GUI.sidebar.currentElement
  };

  GUI.sidebar.closeSidebar(true);

}

/**
 * Restores the sidebar from the saved state and shows it
 * @function restoreFromSavedState
 */
GUI.sidebar.restoreFromSavedState = function() {

  if (GUI.sidebar.savedState.open) {

    GUI.sidebar.openSidebar();

    if (GUI.sidebar.elementConfig[GUI.sidebar.savedState.currentElement]['button'] !== undefined) {
      $(GUI.sidebar.elementConfig[GUI.sidebar.savedState.currentElement]['button']).addClass("active");
    }

  }

}

/**
 * Initializes the sidebar
 * @function init
 */
GUI.sidebar.init = function() {
  $("#sidebar_content>div").addClass("animate");
  $("#sidebar_content").dontScrollParent();
}