/**
 * Description: Refreshes score & hints for supplied websites.
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

var request = require('request'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    dxResult = require('../lib/transform.js');
    
function getTestID() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + month + day + hour + min + sec;
} 

function run(siteList) {
    
    var length = siteList.length;
    var testId = getTestID();
    var completedRequests = 0;
    
    // create a dir for the reports
    var outputDir = "reports/" + testId + "/";
    mkdirp(outputDir);

    // Iterate and test sites
    
    var complete = function() { 
        completedRequests++;
        if (completedRequests != length) {
            return;
        }

        // Retrieve & store the global summary    
        var summary = dxResult.getGlobalSummary();
    
        var file = outputDir + "summary.json";
        fs.writeFile(file, JSON.stringify(summary, null, 4), function(error){
            if (error) {
                return console.error(error);
            }
        }); 
        
        // Retrieve & store the summary report as markdown  
        var markdown = dxResult.generateMarkdownReport();
    
        var markdownDir = "reports/" + testId + "/markdown/";
        mkdirp(markdownDir);    
        file = markdownDir + "report.md";
        fs.writeFile(file, markdown, function(error){
            if (error) {
                return console.error(error);
            }
        });
        
        // Retrieve & store the individual reports as markdown
        var markdownDetailsDir = "reports/" + testId + "/markdown/details/";
        mkdirp(markdownDetailsDir);
        var details = dxResult.getReportDetails();
        for (var i = 0; i < details.length; i++ ) {
            markdown = dxResult.generateDetailedMarkdownReport(details[i]);

            file = markdownDetailsDir + details[i].domain + ".md";
            fs.writeFile(file, markdown, function(error){
                if (error) {
                    return console.error(error);
                }
            });                          
        }
              
    }
         
    for (var i = 0; i < length; i++) {
        var site = siteList[i];
        console.log("Updating => " + site.url);
        var testUrl = "http://localhost:1337/api/v2/scan?url=" + site.url;
        // Production: var testUrl = "http://aka.ms/dxscan?url=" + site.url;
        request(testUrl, function (error, response, content) {
            if (error) {
                console.log(error);
                return;
            }
            
            processResults(content, outputDir);
            complete();
        });
    }
}

function processResults(result, outputDir) {
    var data = dxResult.jsonToResults(result);
    var domain = dxResult.getDomain(data);
    var summary = dxResult.summarize(data);
        
    // store the full report
    var file = outputDir + domain + ".detailed.json";
    console.log("Saving report => " + file);
    fs.writeFile(file, JSON.stringify(data, null, 4), function(error){
        if (error) {
            return console.error(error);
        }
    });
    
    // store the summary report
    var file = outputDir + domain + ".summary.json";
    fs.writeFile(file, JSON.stringify(summary, null, 4), function(error){
        if (error) {
            return console.error(error);
        }
    });   
}

module.exports.run = run;