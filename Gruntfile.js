/*
 * Copyright (c) Microsoft Corporation; All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS
 * OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
 *
 * See the Apache Version 2.0 License for specific language governing permissions
 * and limitations under the License.
 */
module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });
    
    // Refresh task
    grunt.registerTask('refresh', "Refresh website scores & recomendations", function() {
        
        // The task uses async calls (request-promise), tell Grunt that this is async.
        this.async();
        
        var siteList = [];        
        var website = grunt.option("u") || grunt.option("url");
        if (website) {
            siteList.push({ url: website});         
        }
        else {
            var inputFile = grunt.option('l') || grunt.option('list');
            if (inputFile) {
                siteList = require('./lib/loadwebsites.js').load(inputFile);                
            } 
        }
        
        if (siteList.length == 0) {
            console.log("Usage: grunt refresh [options]")
            console.log("");
            console.log("Options:")
            console.log("-u, --url [value]          Url to validate")
            console.log("-l, --list [value]         Path to json containing sites to validate");
            return;
        }
        
        require('./task/refresh.js').run(siteList);
    });
    
    // Default task.
    grunt.registerTask('default', ['refresh']);
};
