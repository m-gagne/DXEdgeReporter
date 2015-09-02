/**
 * Description: Reads and parses website list
 *
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

"use strict";

var fs = require("fs");

function loadWebsites(path) {
    var sites = [];
    var text = fs.readFileSync(path, 'utf8');
    text = text.toString('utf8').replace(/^\uFEFF/, '');
    if (path.indexOf(".json") > -1) {
        var jsonData = JSON.parse(text);
        for (var i = 0; i < jsonData.websites.length; i++) {
            var item = jsonData.websites[i];
            sites.push(item);
        }        
    }
    else { // text file, split by newline
        var urls = text.replace('\r', '').split('\n');
        for (var i = 0; i < urls.length; i++) {
            sites.push({url: urls[i]});
        }      
    }
    
    // sanatize list
    for (var i = 0; i < sites.length; i++) {
        var site = sites[i];
        if (site.url.indexOf("http://") == -1 && site.url.indexOf("https://") == -1) {
            site.url = "http://" + site.url;
        }
        
        site.url = site.url.toLowerCase().trim();
        
        sites[i] = site;
    }

    return sites;
}

module.exports.load = loadWebsites;