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

var resultsCache = [],
    passString = "&#x2713;",
    failString = "**&#x2717;**";

var globalSummary = {
    summary: {
        totalSites: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalPoints: 0,
        totalRequestErrors: 0,
        requestFailed: [],
        availablePoints: 0,
        tests:{
            "BrowserDetection": {
               points: 10,
               passed: 0,
               failed: 0,
               patterns: {},
               files: {}
            },
            "CSSPrefixes": {
               points: 10,
               passed: 0,
               failed: 0,
               styles: {}              
            },
            "Edge": {
               points: 30,
               passed: 0,
               failed: 0,
               modes: {}               
            },
            "JavaScriptLibraries": {
               points: 20,
               passed: 0,
               failed: 0,
               libraries: {}            
            },
            "PluginFree": {
               points: 30,
               passed: 0,
               failed: 0,
               plugins: {
                   "Active-X": { count: 0, domains: [] },
                   "CV List": { count: 0, domains: [] },
                   "Silverlight": { count: 0, domains: [] }
                   
               }                
            }           
        }
    },
    sites: {}
};

function SortObjectByProperty(object, property) {
    var sortable = [];
    
    for (var prop in object) {
        sortable.push({
            key: prop,
            value: object[prop]
        });
    }
    
    sortable.sort(function(a,b) {
        return b.value[property] - a.value[property]; 
    })
    
    return sortable;
}

function JsonToResults(json) {
    return JSON.parse(json);   
}

function GetDomain(data) {
    return data.url.uri.replace("http://", "").replace("https://", "").replace("www.", "");
}

function GetFileNameFromUrl(uri) {
    var path = url.parse(uri).pathname;
    return path.replace(/^.*[\\\/]/, '');
}

function CouldNotScan(url) {
    globalSummary.summary.totalRequestErrors++;
    globalSummary.summary.requestFailed.push(url);
}

function InitializeIfMissing(lookup, key, initialValue) {
    if (!lookup[key]) {
        lookup[key] = initialValue;
    }
    
    return lookup[key];
}

function Summarize(result) {
    var domain = GetDomain(result);
    
    console.info("Processing results for " + domain);

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
    
    // Summarize each tests
    
    //      Browser Detection
    var tests = result.results.browserDetection.data.javascript.data;
    var testSummary = globalSummary.summary.tests.BrowserDetection;   
    var fileName = "";
    
    for (var i = 0; i < tests.length; i++) {
        var value = InitializeIfMissing(testSummary.patterns, tests[i].pattern, {
            count: 0,
            domains: []
        });
        testSummary.patterns[tests[i].pattern].count++;
        testSummary.patterns[tests[i].pattern].domains.push(domain);
        
        fileName = GetFileNameFromUrl(tests[i].url);
        var value = InitializeIfMissing(testSummary.files, fileName, {
            count: 0
        });
        testSummary.files[fileName].count++;
    }
        
    //      CSS Prefixes
    tests = result.results.cssprefixes.data;
    testSummary = globalSummary.summary.tests.CSSPrefixes;
    for (var i = 0; i < tests.length; i++) {
        var selectors = tests[i].selectors;
        for (var ii = 0; ii < selectors.length; ii++) {
            for (var iii = 0; iii < selectors[ii].styles.length; iii++) {
                var style = selectors[ii].styles[iii];
                InitializeIfMissing(testSummary.styles, style, {
                    count: 0,
                    domains: []
                });
                testSummary.styles[style].count++;
                testSummary.styles[style].domains.push(domain);
            }
        }
    }
    
    //      Edge
    tests = result.results.edge.data;
    testSummary = globalSummary.summary.tests.Edge;
    if (!summary.tests.Edge.passed && tests.mode[0]) {
        InitializeIfMissing(testSummary.modes, tests.mode[0], {
            count: 0,
            domains: []
        });
        testSummary.modes[tests.mode[0]].count++;        
        testSummary.modes[tests.mode[0]].domains.push(domain);        
    }
    
    //      JavaScript Libraries
    tests = result.results.jslibs.data;
    testSummary = globalSummary.summary.tests.JavaScriptLibraries;
    for (var i = 0; i < tests.length; i++) {
        InitializeIfMissing(testSummary.libraries, tests[i].name, {
            count: 0,
            versions: {
            }
        });
        testSummary.libraries[tests[i].name].count++;
        InitializeIfMissing(testSummary.libraries[tests[i].name].versions, tests[i].version, {
            count: 0,
            domains: []
        });
        testSummary.libraries[tests[i].name].versions[tests[i].version].count++;
        testSummary.libraries[tests[i].name].versions[tests[i].version].domains.push(domain);
    }
    
    //      Plugins
    var test = result.results.pluginfree.data;
    testSummary = globalSummary.summary.tests.PluginFree;
    if (test.activex) {
        testSummary.plugins["Active-X"].count++;
        testSummary.plugins["Active-X"].domains.push(domain);    
    }
    if (test.cvlist) {
        testSummary.plugins["CV List"].count++;
        testSummary.plugins["CV List"].domains.push(domain);    
    }
    if (test.silverlight) {
        testSummary.plugins["Silverlight"].count++;
        testSummary.plugins["Silverlight"].domains.push(domain);    
    }        
    
    // cache the results            
    resultsCache.push({
        domain: domain,
        summary: summary,
        result: result
    });
    
    return summary;
    
}

function GenerateMarkdownReport() {
    var sortedFiles = SortObjectByProperty(globalSummary.summary.tests.BrowserDetection.files, "count");
    
    var result;
    md.clear();
    
    md.appendLine("# Report")
    
    md.appendLine("## Summary");
    md.appendLine();
    md.appendTableHeader([
        "Sites Tested",
        "Sites Passed",
        "Sites Failed",
        "Sites Could Not Be Scanned",
        "Actual Points",
        "Total Points"
    ]);
    md.appendTableRow([
        globalSummary.summary.totalSites,
        globalSummary.summary.totalPassed,
        globalSummary.summary.totalFailed,
        globalSummary.summary.totalRequestErrors,
        globalSummary.summary.totalPoints,
        globalSummary.summary.availablePoints
    ]);
    md.appendLine();
    
    // LIST SITES THAT COULD NOT BE SCANNED    
    if (globalSummary.summary.totalRequestErrors > 0) {
        md.appendLine("## Sites That Could Not Be Scanned")
        md.appendTableHeader([
            "Site"
        ]);
        for (var i = 0; i < globalSummary.summary.requestFailed.length; i++) {
            md.appendTableRow([
                "[**" + globalSummary.summary.requestFailed[i] + "**](" + globalSummary.summary.requestFailed[i] + ")"
            ]);
        }
    }
    
    // LIST SITES THAT PASSED
    if (globalSummary.summary.totalPassed > 0) {
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
        
        // Summarize the tests that failed
        
        md.appendLine("## Failed Test Summary");
        
        //  Browser Detection
        var browserDetection = globalSummary.summary.tests.BrowserDetection;
        if (browserDetection.failed > 0) {
            md.appendLine("### Browser Detection");
            
            md.appendTableHeader(["Pattern", "Count", "Domains"]);
            for (var pattern in browserDetection.patterns ) {
                md.appendTableRow([
                    pattern,
                    browserDetection.patterns[pattern].count,
                    "[hover to see](#! \"" + browserDetection.patterns[pattern].domains.join(", ") + "\")"
                ]);
            }
        }
        
        //  Edge
        var edge = globalSummary.summary.tests.Edge;
        if (edge.failed > 0) {
            md.appendLine("### Edge");
            
            md.appendTableHeader(["Mode", "Count", "Domains"]);
            for (var mode in edge.modes ) {
                md.appendTableRow([
                    mode,
                    edge.modes[mode].count,
                    "[hover to see](#! \"" + edge.modes[mode].domains.join(", ") + "\")"                          
                ]);
            }
        }   
        
        //  Javascript Libraries
        var jsLibs = globalSummary.summary.tests.JavaScriptLibraries;

        if (jsLibs.failed > 0) {
            md.appendLine("### JavaScript Libraries");
            
            md.appendTableHeader(["Library", "Version", "Count", "Domains"]);
            for (var library in jsLibs.libraries ) {
                for (var version in jsLibs.libraries[library].versions) {
                    md.appendTableRow([
                        library,
                        version,
                        jsLibs.libraries[library].versions[version].count,
                        "[hover to see](#! \"" + jsLibs.libraries[library].versions[version].domains.join(", ") + "\")"           
                    ]);                    
                }

            }
        } 
        
        //  Plugins
        var pluginTests = globalSummary.summary.tests.PluginFree;
        if (pluginTests.failed > 0) {
            md.appendLine("### Plugins");
            md.appendTableHeader(["Plugin", "Count", "Domain"]);
            for (var plugin in pluginTests.plugins) {
                md.appendTableRow([
                   plugin,
                   pluginTests.plugins[plugin].count,
                   "[hover to see](#! \"" + pluginTests.plugins[plugin].domains.join(", ") + "\")"
                ]);
            }
        }                   
    }
    
    return md.getMarkdown(true);
}

function BuildUrl(domain, url) {
    if (!url) {
        return "";
    }
        
    if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
        return url;
    }
    
    if (url.indexOf("/") != 0) {
        return "http:// + " + domain + "/" + url;
    }
    
    return "http://" + domain + url;
}

function GenerateBrowserDetectiondMarkdownReport() {
    md.clear()
    md.appendLine("[&#9668; Summary](../report.html)");
    md.appendLine();
    md.appendLine("# Browser Detection Report");
    md.appendLine();
    
    if (!globalSummary.summary.tests.BrowserDetection.files || globalSummary.summary.tests.BrowserDetection.files.length == 0){
        md.appendLine("No browser detection code detected.");    
    }
    else {
        var top = 15;
        md.appendLine("## Top " + top + " File Summary");
        md.appendLine();
        var sorted = SortObjectByProperty(globalSummary.summary.tests.BrowserDetection.files, "count");
        var limit = sorted.length;
        if (limit > top) { 
            limit = top;
        }
        md.appendTableHeader(["File", "Count"]);
        for (var i = 0; i < limit; i++) {
            md.appendTableRow([
                sorted[i].key,
                sorted[i].value.count      
            ]);
        }        
    }

    md.appendLine();

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
    md.appendLine("# Report for [" + details.domain + "](http://" + details.domain + ")");
    md.appendLine();
    md.appendLine("## Summary");
    md.appendLine();
    md.appendTableHeader([
        "Score",
        "Edge (30 pts)",
        "Plugin Free (30 pts)",
        "JavaScript Libraries (20 pts)",
        "CSS Prefixes (10 pts)",
        "Browser Detection (10 pts)"
    ]);
    md.appendTableRow([
        details.summary.score,
        details.summary.tests["Edge"].passed ?  passString : failString,
        details.summary.tests["PluginFree"].passed ?  passString : failString,
        details.summary.tests["JavaScriptLibraries"].passed ?  passString : failString,
        details.summary.tests["CSSPrefixes"].passed ?  passString : failString,
        details.summary.tests["BrowserDetection"].passed ?  passString : failString,
    ]);    
    
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
            md.appendLine("    * File: [" + tests[i].url + "](" + BuildUrl(details.domain, tests[i].url) + ")");
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
            if (tests[i].url != "embed") {
                md.appendLine("    * File: [" + tests[i].url + "](" + BuildUrl(details.domain, tests[i].url) + ")");
            }
            else {
                md.appendLine("    * File: embedded");
            }
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
module.exports.couldNotScan = CouldNotScan;
module.exports.generateDetailedMarkdownReport = GenerateDetailedMarkdownReport;
module.exports.generateBrowserDetectiondMarkdownReport = GenerateBrowserDetectiondMarkdownReport;
module.exports.markedownToHtml = MarkdownToHtml;