/**
 * Description: Utility class to transform results from crawler.
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

var globalSummary = {
    summary: {
        totalSites: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalPoints: 0,
        availablePoints: 0,
        tests:{
            "BrowserDetection": {
               points: 10,
               passed: 0,
               failed: 0                  
            },
            "CSSPrefixes": {
               points: 10,
               passed: 0,
               failed: 0                
            },
            "Edge": {
               points: 30,
               passed: 0,
               failed: 0                   
            },
            "JavaScriptLibraries": {
               points: 20,
               passed: 0,
               failed: 0                
            },
            "PluginFree": {
               points: 30,
               passed: 0,
               failed: 0                 
            }           
        }
    },
    sites: {}
};


function JsonToResults(json) {
    return JSON.parse(json);   
}

function GetDomain(data) {
    return data.url.uri.replace("http://", "").replace("https://", "").replace("www.", "");
}

function Summarize(result) {
    
    var score = 0;
    
    score += result.results.browserDetection.passed ? 10 : 0;
    score += result.results.cssprefixes.passed ? 10 : 0;
    score += result.results.edge.passed ? 30 : 0;
    score += result.results.jslibs.passed ? 20 : 0;
    score += result.results.pluginfree.passed ? 30 : 0;
    
    var summary = {
        passed: score >= 90 ? true : false,
        score: score,
        tests: {
            "BrowserDetection": {
               passed: result.results.browserDetection.passed,
               points: 10
            },
            "CSSPrefixes": {
               passed: result.results.cssprefixes.passed,
               points: 10
            },
            "Edge": {
               passed: result.results.edge.passed,
               points: 30
            },
            "JavaScriptLibraries": {
               passed: result.results.jslibs.passed,
               points: 20
            },
            "PluginFree": {
               passed: result.results.pluginfree.passed,
               points: 30
            }      
        }
    };
        
    // record the per site summary
    var domain = GetDomain(result);
    globalSummary.sites[domain] = summary;

    // update the global summary results
    globalSummary.summary.availablePoints += 100;
    globalSummary.summary.totalPoints += score;    
    globalSummary.summary.totalPassed += summary.passed ? 1 : 0;
    globalSummary.summary.totalFailed += summary.passed ? 0 : 1;
    globalSummary.summary.totalSites++;
    globalSummary.summary.tests.BrowserDetection.passed += summary.tests.BrowserDetection.passed ? 1 : 0;
    globalSummary.summary.tests.BrowserDetection.failed += summary.tests.BrowserDetection.passed ? 0 : 1;    
    globalSummary.summary.tests.CSSPrefixes.passed += summary.tests.CSSPrefixes.passed ? 1 : 0;
    globalSummary.summary.tests.CSSPrefixes.failed += summary.tests.CSSPrefixes.passed ? 0 : 1;    
    globalSummary.summary.tests.Edge.passed += summary.tests.Edge.passed ? 1 : 0;
    globalSummary.summary.tests.Edge.failed += summary.tests.Edge.passed ? 0 : 1;    
    globalSummary.summary.tests.JavaScriptLibraries.passed += summary.tests.JavaScriptLibraries.passed ? 1 : 0;
    globalSummary.summary.tests.JavaScriptLibraries.failed += summary.tests.JavaScriptLibraries.passed ? 0 : 1;    
    globalSummary.summary.tests.PluginFree.passed += summary.tests.PluginFree.passed ? 1 : 0;
    globalSummary.summary.tests.PluginFree.failed += summary.tests.PluginFree.passed ? 0 : 1;
            
    return summary;
    
}

function GetGlobalSummary() {
    return globalSummary;
}

module.exports.jsonToResults = JsonToResults;
module.exports.summarize = Summarize;
module.exports.getDomain = GetDomain;
module.exports.getGlobalSummary = GetGlobalSummary;