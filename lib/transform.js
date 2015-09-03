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

var md = require('../lib/markdown-generator.js'),
    url = require('url'),
    marked = require('marked'),
    fs = require('fs');

var resultsCache = [];

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
            
    // cache the results            
    resultsCache.push({
        domain: domain,
        summary: summary,
        result: result
    });
    
    return summary;
    
}

function GenerateMarkdownReport() {
    var result;
    md.clear();
    
    md.appendLine("# Report")
    
    md.appendLine("## Summary");
    md.appendLine();
    md.appendTableHeader([
        "Sites Tested",
        "Sites Passed",
        "Sites Failed",
        "Actual Points",
        "Total Points"
    ]);
    md.appendTableRow([
        globalSummary.summary.totalSites,
        globalSummary.summary.totalPassed,
        globalSummary.summary.totalFailed,
        globalSummary.summary.totalPoints,
        globalSummary.summary.availablePoints
    ]);
    md.appendLine();
    
    var passString = "&#x2713;";
    var failString = "**&#x2717;**";
     
    if (globalSummary.summary.totalPassed>0) {
        md.appendLine("## Sites That Passed")
        md.appendTableHeader([
            "Site",
            "Score",
            "Edge",
            "Plugin Free",
            "JavaScript Libraries",
            "CSS Prefixes",
            "Browser Detection"
        ]);
        for (var i = 0; i < resultsCache.length; i++) {
            result = resultsCache[i];
            if (result.summary.passed) {
                md.appendTableRow([
                    "[**" + result.domain + "**](details/" + result.domain + ".html)",
                    result.summary.score,
                    result.summary.tests["Edge"].passed ?  passString : failString,
                    result.summary.tests["PluginFree"].passed ?  passString : failString,
                    result.summary.tests["JavaScriptLibraries"].passed ?  passString : failString,
                    result.summary.tests["CSSPrefixes"].passed ?  passString : failString,
                    result.summary.tests["BrowserDetection"].passed ?  passString : failString,
                ]);
            }
        }        
    }
    
    if (globalSummary.summary.totalFailed>0) {
        md.appendLine();
        
        md.appendLine("## Sites That Failed")
        md.appendTableHeader([
            "Site",
            "Score",
            "Edge",
            "Plugin Free",
            "JavaScript Libraries",
            "CSS Prefixes",
            "Browser Detection"
        ]);
        for (var i = 0; i < resultsCache.length; i++) {
            result = resultsCache[i];
            if (!result.summary.passed) {
                md.appendTableRow([
                    "[**" + result.domain + "**](details/" + result.domain + ".html)",
                    result.summary.score,
                    result.summary.tests["Edge"].passed ?  passString : failString,
                    result.summary.tests["PluginFree"].passed ?  passString : failString,
                    result.summary.tests["JavaScriptLibraries"].passed ?  passString : failString,
                    result.summary.tests["CSSPrefixes"].passed ?  passString : failString,
                    result.summary.tests["BrowserDetection"].passed ?  passString : failString,
                ]);
            }
        }
        md.appendLine();
    }    
    
    return md.getMarkdown(true);
}

function GenerateDetailedMarkdownReport(details) {
    var tests,
        test,
        length,
        i;
        
    md.clear()
    md.appendLine("[&#9668; Summary](../report.html)");
    md.appendLine();
    md.appendLine("# Report for " + details.domain);
    md.appendLine();
    md.appendLine("## Summary");
    md.appendLine();
    md.appendLine("* Score: " + details.summary.score) + " / 100";
    md.appendLine("* Edge (30 points): " + details.summary.tests["Edge"].passed);
    md.appendLine("* Plugin Free (30 points): " + details.summary.tests["PluginFree"].passed);
    md.appendLine("* JavaScript Libraries (20 points): " + details.summary.tests["JavaScriptLibraries"].passed);
    md.appendLine("* CSS Prefixes (10 points): " + details.summary.tests["CSSPrefixes"].passed);
    md.appendLine("* Browser Detection (10 points): " + details.summary.tests["BrowserDetection"].passed);
    
    md.appendLine();
    md.appendLine("## Failed Tests")
    
    var results = details.result.results;
    
    // EDGE TESTS    
    if (!details.summary.tests["Edge"].passed) {
        md.appendLine();        
        md.appendLine("### Edge")
        
        test = results.edge.data;
        if (test.lineNumber >= 0) {
            md.appendLine("* Line Number: " + test.lineNumber);            
        }
        if (test.source) {
            md.appendLine("* Source: " + test.source)
        }
        md.appendLine("* Mode: " + test.mode[0]);
    }
    
    // PLUGIN TESTS
    if (!details.summary.tests["PluginFree"].passed) {
        md.appendLine();        
        md.appendLine("### Plugins")
        
        test = results.pluginfree.data;
        md.appendLine("* Active-X: " + test.activex);
        md.appendLine("* CV List: " + test.cvlist);
        md.appendLine("* Silverlight: " + test.silverlight);
    }  
    
    // JAVASCRIPT LIBRARY TESTS
    if (!details.summary.tests["JavaScriptLibraries"].passed) {
        md.appendLine();
        md.appendLine("### JavaScript Libraries")
        
        tests = results.jslibs.data;
        for (var i = 0; i < tests.length; i++) {
            md.appendLine("* **Library: " + tests[i].name + "**");
            md.appendLine("    * Version detected: " + tests[i].version);
            md.appendLine("    * Minimum supported version: " + tests[i].minVersion);
            md.appendLine("    * File: [" + tests[i].url + "](http://" + details.domain + "/" + tests[i].url + ")");
            md.appendLine("    * Line Number: " + tests[i].lineNumber);
        }
    }          

    // CSS PREFIXES TESTS
    if (!details.summary.tests["CSSPrefixes"].passed) {
        md.appendLine();
        md.appendLine("### CSS Prefixes")
        
        tests = results.cssprefixes.data;
        for (var i = 0; i < tests.length; i++) {
            md.appendLine("* **File: [" + url.parse(tests[i].cssFile).path + "](" + tests[i].cssFile + ")**");
            
            var selectors = tests[i].selectors;
            for (var ii = 0; ii < selectors.length; ii++) {
                md.appendLine("    * Line Number: " + selectors[ii].lineNumber);
                md.appendLine("    * Selector: `" + selectors[ii].selector + "`");
                md.appendLine("    * Styles: ");
                for (var iii = 0; iii < selectors[ii].styles.length; iii++) {
                    md.appendLine("        *  " + selectors[ii].styles[iii]);
                }
            }            
        }
    } 
    
    // BROWSER DETECTION TESTS
    if (!details.summary.tests["BrowserDetection"].passed) {
        md.appendLine();
        md.appendLine("### Browser Detection");
        
        tests = results.browserDetection.data.javascript.data;
        for (var i = 0; i < tests.length; i++) {
            md.appendLine("* **Pattern: " + tests[i].pattern + "**");
            md.appendLine("    * File: [" + tests[i].url + "](http://" + details.domain + "/" + tests[i].url + ")");
            md.appendLine("    * Line Number: " + tests[i].lineNumber);
        }
    }              

    return md.getMarkdown(true);
}

function GetGlobalSummary() {
    return globalSummary;
}

function GetReportDetails() {
    return resultsCache;
}

function MarkdownToHtml(markdown) {
    var html = "<!DOCTYPE html>";
    html += "<html>";
    html += "<style>";  
    html += fs.readFileSync('./static/markdown.css');    
    html += "</style>";
    html += "<body>";
    html += marked(markdown);
    html += "</body>";
    html += "</html>";
    
    return html;
}

module.exports.jsonToResults = JsonToResults;
module.exports.summarize = Summarize;
module.exports.getDomain = GetDomain;
module.exports.getGlobalSummary = GetGlobalSummary;
module.exports.getReportDetails = GetReportDetails;
module.exports.generateMarkdownReport = GenerateMarkdownReport;
module.exports.generateDetailedMarkdownReport = GenerateDetailedMarkdownReport;
module.exports.markedownToHtml = MarkdownToHtml;