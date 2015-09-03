# DXEdgeReporter
Generates static (HTML) reports using the results from [DXCrawler](https://github.com/deltakosh/DXCrawler).

## Usage

### Single Site

  grunt refresh -u http://microsoft.com

### Multipl sites

Where `my_sites.txt` is a list (each on seperate line) of sites to test

  grunt refresh -l my_sites.txt
  
  
## Output

The output is a summary & set of reports in `reports/<timestamp>/`.

## Setup

Change `task/refresh.js:113` to use your local DXCrawler or the production one.
