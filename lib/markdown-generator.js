/**
 * Description: Utility class to generate simple markdown
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

var buffer = "",
    newline = "\r\n";

function clear() {
    buffer = "";
}

function appendLine(text) {
    buffer += (text ? text : "") + newline;
}

function appendTableHeader(values) {
    buffer += "|" + values.join("|") + "|" + newline;
    for (var i = 0; i < values.length; i++) {
        if (i==0) {
            buffer += "|---|"
        }
        else{
        buffer += ":-:|"
            
        }
    }
    buffer += newline;
}

function appendTableRow(values) {
    buffer += "|" + values.join("|") + "|" + newline;
}

function getMarkdown(clearBuffer) {
    var markdown = buffer;
    if (clearBuffer) {
        clear();
    }
    return markdown;
}

module.exports.appendLine = appendLine;
module.exports.appendTableHeader = appendTableHeader;
module.exports.appendTableRow = appendTableRow;
module.exports.getMarkdown = getMarkdown;
module.exports.clear = clear;
