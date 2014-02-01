/**
 * Simple Token module. Parses specified authTokenFile.
 * Provides method to check if requested auth token is valid
 *
 * Auth token could be designed using uuid.v4()
 *
 *  @requires fs
 */

"use strict";

var fs = require('fs');
var tokens = [];
var tokenMap = {};

var authTokenFilePath = "auth_tokens";

/**
 * init
 *
 * initializes the token checker and reads the auth_token file
 *
 */
var init = function(){
  if(fs.existsSync(authTokenFilePath)){
    tokens = fs.readFileSync(authTokenFilePath).toString().split("\n");
    tokens.forEach(function(t){
      tokenMap[t] = true;
    })
  } else {
    console.log("WARNING: auth_tokens file is missing");
  }
}
init();

/**
 *  check
 *
 *  checks if a given token is included in the auth_token file
 *
 *  @param  token the chosen token that should be checked
 *  @return {boolean} true, if token is included in the auth_token file
 */
var check = function(token){
  if(tokenMap[token]) return true
  else return false
};

module.exports = {
  "check" :  check
}