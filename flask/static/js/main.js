// (function() {
var data_url = flask_util.url_for("search", {fq: 'persons:("Obama, Barack")'});
// Available for debugging purposes
var data;

// Months
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

// Load the data from the server
d3.json(data_url, function(error, json) {
    if (error) return console.warn(error);
    data = json;
    // Call the init function...
    init(data);
});

var init = function() {
    if (! data) {
        throw "No data has been loaded! This is not good.";
    }

    // Debugging stuff
    tempYearData = data.years[17];
    tempYear2Data = data.years[18];
    tempMonthData = data.years[17].months[0];

    var $container = d3.select("#container .content");
    // Set up all three timelines (instantiate them in reverse order for correct DOM ordering).
    //var $articles_timeline = ArticlesTimeline(tempMonthData, $container);
//    $months_timeline = createTimeline(
//        tempYearData,
//        $container.select("#months_timeline")
//    );

    createTimeline(
        data,
        d3.select("#years_timeline")
    );

    $container
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
    // Clear out the container and set its opacity to 0
    var $timeline = $container;

    $timeline
        .classed("hidden", true)
        .text("")
    ;

    // Calculate Dimensions
    var label_height = 18;
    var timeline_width = parseInt( $timeline.style("width") );
    var timeline_height = parseInt( $timeline.style("height") ) - label_height * 1.35;
    // Logarithmic scaling for the timeline bars
    var heightScale = d3.scale.log().domain([maxHits, 0.5]).range([timeline_height,0]);
    // Year rect size | data.years.length
    var year_rect_width = timeline_width / timeLength;

    // SVG groups for each year
    var $year_bars = $timeline.selectAll("g.bar")
        .data(timeData)
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

    // Exit
    $year_bars
        .exit()
        .transition()
        .duration(500)
        .attr("height", 0)
        .remove()
    ;

    var $year_bg_rects = $year_bars
        .append("rect")
        .classed("bg", true)
        .attr("x", function(d,i) { return (i * year_rect_width) + "px" })
        .attr("y", "0px" )
        .attr("width", year_rect_width + "px")
        .attr("height", timeline_height + "px")
    ;

    var $year_fg_rects = $year_bars
        .append("rect")
        .classed("fg", true)
        .attr("x", function(d,i) { return (i * year_rect_width) + "px" })
        .attr("y", function(d,i) {
            return timeline_height - heightScale(d.hits) + "px";
        })
        .attr("width", year_rect_width + "px")
        .attr("height", function(d,i) {
            return heightScale(d.hits) + "px";
        })
    ;

    var $year_labels = $year_bars
        .append("text")
        .classed("annotation", true)
        .text(function(d, i) { 
            if(data.years)
                return d.year; 
            else {
                return months[i] + " '" + (d.year + "").substr(2,2);
            }
        })
        .attr("width", year_rect_width + "px")
        .attr("height", 24 + "px")
        .attr("x", function(d,i) { return (i * year_rect_width + year_rect_width / 2) + "px" })
        .attr("y", (timeline_height + label_height) + "px")
    ;

    // Event Handler
    $year_bars.selectAll("rect, text").on("click", function(d) {
        var $parent = d3.select(this.parentNode);

        if ($parent.classed("active")) {
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

    // Unhide the element
    $timeline
        .classed("hidden", false)
    ;

    // All Done
    return $timeline;
};

var initFisheye = function(numDocs, baseWidth) {
//    var margin = {top: 20, right: 250, bottom: 30, left: 40};
//    var width = baseWidth - margin.left - margin.right;

    return d3.fisheye.scale(d3.scale.linear).domain([0, numDocs]).range([0, baseWidth]).focus(0);
};

var ArticlesTimeline = function(data, $html) {

    console.log(data);
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
    var xScaleDistortion = data.docs.length / 3;

    // The position() function implements the fisheye lens distortion on the articles.
    var position = function(d, i) {
        var translateX = xScale(i);
        var translateY = 0;

        d3.select(this)
            .style("-webkit-transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("width", xScale(i + 1.0) - xScale(i) + "px")
        ;
    };

    // Set the fisheye distortion center right away
    xScale.distortion(xScaleDistortion).focus(960);

    var $timelineContainer = $timeline
        .append("div")
        .classed("timelineContainer", true)
        .style("height", timeline_height + "px")
    ;

    var timeline_label = data.year;

    if (data.month) {
        timeline_label = months[data.month - 1] + " '" + (data.year + "").substr(2,2);
    }

    // Timeline label
    var timeline_label_el = $timeline
        .append("h2")
        .text(timeline_label)
    ;

    // Insert articles as <a> elements
    var articles = $timelineContainer.selectAll("a.article")
        .data(data.docs)
        .enter()
        .append("a")
        .classed("article", true)
        .style("height", timeline_height + "px")
        .attr("href", function(d) { return d.web_url; })
        // Set up the fisheye distortion right away.
        .each(position)
        // Event handler to open links in a new window
        .on("click", function(d, i) {
            d3.event.preventDefault();
            window.open(d.web_url);
        })
    ;

    // Article Images
    var articleImages = articles.each(function(d) {
        if (d.multimedia_url) {
            d3.select(this)
                .append("div")
                .classed("imgContainer", true)
                .classed(d.multimedia_type, true)
                .append("img")
                .attr("src", d.multimedia_url)
            ;
        }
    });

    // Set up an interior container for the articles
    var rectInsides = articles
        .append("div")
        .classed("rectInside", true)
    ;

    // Article headlines
    var articleHeadlines = rectInsides
        .append("h3")
//        .attr("data-headline", function(d) { return d.main_headline; })
        .text(function(d) { return d.main_headline; })
        .style("text-transform", "capitalize")
    ;

    // Article Snippets
    var articleSnippets = rectInsides
        .append("p")
        .text(function(d) { return d.snippet; })
    ;

    // Article Dates
    var articleDates = rectInsides
        .append("cite")
        .text(function(d) {
            var pub_date = new Date(d.pub_date);
            return pub_date.getDate() + " " + months[pub_date.getMonth()] + " " + pub_date.getFullYear();
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

    // Unhide the timeline
    $timeline
        .classed("hidden", false)
    ;

    // Return
    return $timeline;
};

// })();
