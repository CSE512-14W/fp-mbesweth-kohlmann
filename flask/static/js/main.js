// (function() {

// Lame event handler for the #page menu
d3.select("#page").on("change", function() {
    document.location = this.options[this.selectedIndex].value;
});

if (! fq) {
    console.log("Setting fq variable to a default value.");
    var fq = 'organizations:("WIKILEAKS")';
}
var data_url = flask_util.url_for("search_json", {fq: fq});
// Available for debugging purposes
var data;

// Months
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

// Load the data from the server
d3.json(data_url, function(error, json) {
    if (error) return console.warn(error);
    data = json;
    if (! data) {
        window.alert("Either there were no articles found...or there were more than 8000 articles found for this query! In the current implementation this would take forever and a day to retrieve from the NYT Article Search API, so we're punting. Sorry. :-(");
    }
    // Call the init function...
    init(data);
});

var init = function() {
    if (! data) {
        throw "No data has been loaded! This is not good.";
    }

    var $container = d3.select("#container .content");

    d3.select("header h2").text(data.total_hits + " articles spanning " + data.year_range + " years");

    // Get the years timeline up and running.
    createTimeline(
        data,
        d3.select("#years_timeline")
    );

    // Add the classes that will make .content look correct.
    $container
        .classed("loading", false)
        .classed("years-articles", false)
        .classed("years-months-articles", false)
        .classed("years-months", false)
        .classed("years", true)
    ;
};

var createTimeline = function(data, $container) {
    //dealing with year data
    var maxHits;    // max number of articles
    var timeLength; // number of years or months being considered
    var timeData;   // the associated month or year data
    var graphName;

    if(data.years) {
        maxHits    = data.max_hits;
        timeLength = data.years.length;
        timeData   = data.years;
        graphName  = "years_timeline";
    } else { // dealing with month data
        maxHits    = data.months_max_hits;
        timeLength = data.months.length;
        timeData   = data.months;
        graphName  = "months_timeline";
    }

    // DOM Setup
    var $timeline = $container
        .text("")
    ;

    // Calculate Dimensions
    var margin = 80;
    var label_width = 36;
    var label_height = 18;
    var timeline_width = parseInt( d3.select($timeline[0][0].parentNode).style("width") )  - margin * 2;
    var timeline_height = parseInt( $timeline.style("height") ) - label_height * 1.35;
    // Logarithmic scaling for the timeline bars
    var heightScale = d3.scale.log().domain([maxHits, 0.5]).range([timeline_height,0]);
    // Year rect size | data.years.length
    var year_rect_width = timeline_width / timeLength;

    // SVG groups for each year
    var $year_bars = $timeline.selectAll("g.bar")
        .data(timeData)
    ;

    $timeline
        .classed("narrow-bars", year_rect_width < label_width)
        .attr("width", (timeline_width + margin * 2) + "px");
    ;

    // Enter
    $year_bars
        .enter()
        .append("g")
        .classed("bar", true)
        .classed("empty", function(d) {
            return d.hits == 0;
        })
        .attr("data-year", function(d) { return d.year; })
        .attr("data-hits", function(d) { return d.hits; })
    ;

    var $year_bg_rects = $year_bars
        .append("rect")
        .classed("bg", true)
        .attr("x", function(d,i) { return (margin + i * year_rect_width) + "px" })
        .attr("y", "0px" )
        .attr("width", year_rect_width + "px")
        .attr("height", timeline_height + "px")
        .attr("title", function(d) { return d.hits + " articles"; })
    ;

    var $year_fg_rects = $year_bars
        .append("rect")
        .classed("fg", true)
        .attr("x", function(d,i) { return (margin + i * year_rect_width) + "px" })
        .attr("y", function(d,i) {
            return timeline_height - heightScale(d.hits) + "px";
        })
        .attr("width", year_rect_width + "px")
        .attr("height", function(d,i) {
            return heightScale(d.hits) + "px";
        })
        .attr("title", function(d) { return d.hits + " articles"; })
    ;

    var $year_labels = $year_bars
        .append("text")
        .classed("annotation", true)
        .attr("title", function(d) { return d.hits + " articles"; })
        .text(function(d, i) { 
            if(data.years)
                return d.year; 
            else {
                return months[i] + " '" + (d.year + "").substr(2,2);
            }
        })
        .attr("height", 24 + "px")
        .attr("x", function(d,i) { return (margin + i * year_rect_width + year_rect_width / 2) + "px" })
        .attr("y", (timeline_height + label_height) + "px")
    ;

    // Event Handler
    $year_bars.selectAll("rect, text").on("click", function(d) {
        var $parent = d3.select(this.parentNode);

        if ($parent.classed("active") || $parent.classed("empty")) {
            // Do nothing when clicking on a bar that is already active.
            return;
        } else {
            $timeline.select("g.bar.active").classed("active", false);
            $parent.classed("active", true);
        }

        // Should we display a month timeline or an article timeline next?
        if (d.docs == null) {
            // Bring in the months timeline
            createTimeline(d, d3.select("#months_timeline"));
            // b the articles timeline
            d3.select(".content")
                .classed("years-articles", false)
                .classed("years-months-articles", false)
                .classed("years-months", true)
                .classed("years", false)
            ;
        } else {
            // Bring in the articles timeline
            ArticlesTimeline(d, d3.select("#articles_timeline"));
            // Bring out the months timeline if we need to
            if (graphName == "years_timeline") {
                d3.select(".content")
                    .classed("years-articles", true)
                    .classed("years-months-articles", false)
                    .classed("years-months", false)
                    .classed("years", false)
                ;
            } else {
                d3.select(".content")
                    .classed("years-articles", false)
                    .classed("years-months-articles", true)
                    .classed("years-months", false)
                    .classed("years", false)
                ;
            }
        }
    });

    // All Done
    return $timeline;
};

var initFisheye = function(numDocs, baseWidth) {
//    var margin = {top: 20, right: 250, bottom: 30, left: 40};
//    var width = baseWidth - margin.left - margin.right;

    return d3.fisheye.scale(d3.scale.linear).domain([0, numDocs]).range([0, baseWidth]).focus(0);
};

var ArticlesTimeline = function(data, $html) {
    // DOM Setup
    var $timeline = $html;
        $timeline.text("")
    ;

    // Timeline group position and size
    var label_height = 18;
    var timeline_width = parseInt( $timeline.style("width") );
    var timeline_height = parseInt( $timeline.style("height") ) - label_height * 1.35;

    // Fisheye Distortion Setup
    var xScale = initFisheye(data.docs.length, timeline_width);
    // A value of 10 works well with 33 items
    var xScaleDistortion = data.docs.length / 2 * 1836 / timeline_width;
//    console.log(timeline_width);

    // The position() function implements the fisheye lens distortion on the articles.
    var position = function(d, i) {
        var translateX = xScale(i);
        var translateY = 0;

        d3.select(this)
            .style("-webkit-transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("-moz-transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("-ms-transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("width", xScale(i + 1.0) - xScale(i) + "px")
        ;
    };

    var $timelineContainer = $timeline
        .append("div")
        .classed("timelineContainer", true)
        .style("height", timeline_height + "px")
    ;

    var timeline_label = data.year;

    if (data.month) {
        timeline_label = months[data.month - 1] + " '" + (data.year + "").substr(2,2);
    }

    timeline_label += " (" + data.hits + " article" + (data.hits == 1 ? "" : "s") + ")";

    // Timeline label
    var timeline_label_el = $timeline
        .append("h2")
        .text(timeline_label)
    ;

    // Set the fisheye distortion
    xScale.distortion(xScaleDistortion).focus(timeline_width / 2);

    // Insert articles as <a> elements
    var articles = $timelineContainer.selectAll("a.article")
        .data(data.docs)
        .enter()
        .append("div")
        .classed("article", true)
        .classed("long", function(d) { return d.main_headline.length > 100; })
        .style("height", timeline_height + "px")
        // Set up the fisheye distortion right away.
        .each(position)
    ;

    // Article Images
    var articleImages = articles.each(function(d) {
        if (d.multimedia_url) {
            d3.select(this)
                .append("div")
                .classed("imgContainer", true)
                .classed(d.multimedia_type || "thumbnail", true)
                .append("img")
                .attr("src", d.multimedia_url)
            ;
        }
    });

    // Set up an interior container for the articles
    var rectInsides = articles
        .append("a")
        .classed("rectInside", true)
        .attr("href", function(d) { return d.web_url; })
        // Event handler to open links in a new window
        .on("click", function(d) {
            d3.event.preventDefault();
            window.open(d.web_url);
        })
    ;

    // Article headlines
    var articleHeadlines = rectInsides
        .append("h3")
//        .attr("data-headline", function(d) { return d.main_headline; })
        .html(function(d) { return d.main_headline; })
        .style("text-transform", "capitalize")
    ;

    // Article Snippets
    var articleSnippets = rectInsides
        .append("p")
        .html(function(d) { return d.snippet; })
    ;

    // Article Dates
    var articleDates = rectInsides
        .append("cite")
        .text(function(d) {
            var pub_date = new Date(d.pub_date);
            return pub_date.getDate() + " " + months[pub_date.getMonth()] + " " + pub_date.getFullYear();
        })
    ;

    var articleKeywordsWrapper = articles
        .append("div")
        .classed("keywordsWrapper", true)
        .append("div")
        .classed("keywords", true)
    ;

    var articleKeywords = articleKeywordsWrapper
        .selectAll("a.keyword")
        .data(function(d) {
            return d.keywords;
        })
        .enter()
        .append("a")
        .classed("keyword", true)
        .each(function(d, i) {
            var matches = d.match(/fq=([^:]+):\(\"([^\"]+)\"\)/);
            var label = d;
            if (matches[2]) {
                label = matches[2];
            }
            d3.select(this)
                .attr("href", flask_util.url_for("search", { fq: d.substr(3) }))
                // http://stackoverflow.com/a/7592235
                .text(label)
            ;
        })
    ;

    // Fisheye Distortion Event Handler
    $timelineContainer.on("mousemove", function() {
        var mouse = d3.mouse(this);
        // Change the fisheye distortion.
        xScale.distortion(xScaleDistortion).focus(mouse[0]);
        // Previously this was articles.call(position), and I'm not actually sure how that worked in the first place.
        articles.each(position);
    });

    // Return
    return $timeline;
};

// })();
