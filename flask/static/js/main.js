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
    var $container = d3.select("#container .content");
    var $svg = CreateSVGContainer($container);
    var $div = CreateDivContainer($container);
    // Set up a timeline for all the years represented in the data set.
    var $all_years_timeline = createTimeline(data, $svg);
    var $single_year_timeline = SingleYearTimeline(data.years[17].months[0], $div);
};

var CreateSVGContainer = function($container) {
    var svg_width = 1920;
    var svg_height = 300;

    return $container.append("svg")
        .attr("id", "svgContainer")
        .attr("width", svg_width + "px")
        .attr("height", svg_height + "px")
    ;
};

var CreateDivContainer = function($container) {
    var svg_width = 1920;
    var svg_height = 640;

    return $container.append("div")
        .attr("id", "divContainer")
        .attr("width", svg_width + "px")
        .attr("height", svg_height + "px")
    ;
};

var createTimeline = function(data, $svg) {

    //dealing with year data
    var maxHits;    // max number of articles
    var timeLength; // number of years or months being considered
    var timeData;   // the associated month or year data
    var graphName;
    if(data.years){
        maxHits    = data.max_hits;
        timeLength = data.years.length;
        timeData   = data.years;
        graphName  = "all_years_timeline";
    } else { // dealing with month data
        maxHits    = data.months_max_hits;
        timeLength = data.months.length;
        timeData   = data.months;
        graphName  = "month_timeline";
    }

//    console.log(data);
//    console.log(data.years);
    // SVG container width and height
    var svg_width = parseInt( $svg.style("width") );
    var svg_height = parseInt( $svg.style("height") );
    // Timeline group position and size
    var margin = 32;
    var timeline_width = svg_width - margin * 2;
    var timeline_height = svg_height / 2 - margin * 2;
    var timeline_x = margin;
    var timeline_y = svg_height / 2 + margin - 36;
    var timeline_y_centered = svg_height / 2 - timeline_height / 2;

    //data.max_hits
    var heightScale = d3.scale.log().domain([maxHits, 0.5]).range([timeline_height,0]);

    // Year rect size | data.years.length
    var year_rect_width = timeline_width / timeLength;

    // DOM setup
    var $timeline = $svg.append("g")
        //data.years
        .data([timeData])
        .attr("id", graphName)
        .attr("width", timeline_width + "px")
        .attr("height", timeline_height + "px")
        .attr("transform", "translate(" + timeline_x + ", " + 0 + ")") // timelineYCentered
    ;

    // SVG elements for each year
    var $year_groups = $timeline.selectAll("g")
        .data(function(d) { return d; })
    ;

    $year_groups
        .enter()
        .append("g")
        .classed("bar", true)
        .attr("data-year", function(d) { return d.year; })
        .attr("data-hits", function(d) { return d.hits; })
    ;

    var $year_bg_rects = $year_groups
        .append("rect")
        .classed("bg", true)
        .attr("x", function(d,i) { return (i * year_rect_width) + "px" })
        .attr("y", "0px" )
        .attr("width", year_rect_width + "px")
        .attr("height", timeline_height + "px")
        .attr("opacity", "0")
        .transition()
        .attr("opacity", "1.0")
    ;

    var $year_fg_rects = $year_groups
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
        // .attr("transform", "scale(1.0, 0.0)")
        // .attr("transform-origin", "50%, 50%")
        .attr("opacity", "0")
        .transition()
        // .attr("transform", "scale(1.0, 1.0)")
        .attr("opacity", "1.0")
    ;

    var $year_labels = $year_groups
        .append("text")
        .classed("annotation", true)
        .text(function(d, i) { 
            if(data.years)
                return d.year; 
            else {
                return months[i] + ".";
            }
        })
        .attr("width", year_rect_width + "px")
        .attr("height", 24 + "px")
        .attr("x", function(d,i) { return (i * year_rect_width + year_rect_width / 2) + "px" })
        .attr("y", (timeline_height + 24) + "px")
    ;

    /*
    var $year_annotations = $year_groups
        .append("text")
        .classed("annotation", true)
        .text(function(d) { return d.hits; })
        .attr("width", year_rect_width + "px")
        .attr("height", 18 + "px")
        .attr("x", function(d,i) { return (i * year_rect_width + year_rect_width / 2) + "px" })
        .attr("y", (timeline_height + 42) + "px")
    ;
    */

//    $timeline
//        .transition()
//        .delay(500)
//        .duration(1000)
//        .attr("transform", "translate(" + timeline_x + ", " + timeline_y + ")")
//    ;

    var $single_year_timeline = null;

    // var $single_year_timeline = SingleYearTimeline($svg, data[17].docs);

    // Event Handlers
    $year_groups.selectAll("rect, text").on("mouseenter", function(d, i) {
        //console.log("Hello, hovering");
    });

    $year_groups.selectAll("rect, text").on("click", function(d, i) {
        console.log("Clicking");
        var $this = d3.select(this);
        var $parent = d3.select(this.parentNode);

        if ($parent.classed("active")) {
            return;
        } else {
            $timeline.select("g.year.active").classed("active", false);
            $parent.classed("active", true);
        }

        if ($single_year_timeline) {
            $single_year_timeline.remove();
//        } else {
        }

        // Should we display a month timeline or an article timeline next?
        if (d.docs == null) {
            //console.log(d);
            //$("#all_years_timeline").remove();
            $timeline
                .transition()
                .attr("transform", "translate(" + timeline_x + ", " + 150 + ")") // timelineYCentered
            createTimeline(d, $svg);
            //window.alert("We should show a month timeline for the year" + d.year + ".");
            //throw "Month timeline not implemented yet.";
        } else {
            $single_year_timeline = SingleYearTimeline($svg, d.docs);
            // Bring the single year timeline in
            $single_year_timeline
                .transition()
                .duration(1000)
                .attr("opacity", "1.0")
            ;
            // Slide the all years timeline down
            $timeline
                .transition()
                .duration(1000)
                .attr("transform", "translate(" + timeline_x + ", " + timeline_y + ")")
            ;
        }
    });

    // All Done
    return $timeline;
};

var initFisheye = function(numDocs, baseWidth) {
    var margin = {top: 20, right: 250, bottom: 30, left: 40};
    var width = baseWidth - margin.left - margin.right;
//    var height = window.innerHeight - margin.top - margin.bottom;

    return d3.fisheye.scale(d3.scale.linear).domain([0, numDocs]).range([0, baseWidth - 148]).focus(0);
};

var SingleYearTimeline = function(data, $html) {
    // Scaling function for fisheye distortion
    var xScale = initFisheye(data.docs.length, 1920);
    var xScaleDistortion = 10;
    // Set the fisheye distortion center right away
    xScale.distortion(xScaleDistortion).focus(960);

    // The position() function implements the fisheye lens distortion on the articles.
    var position = function(d, i) {
        var translateX = xScale(i);
        var translateY = 0;

        d3.select(this)
            .style("-webkit-transform", "translate(" + translateX + "px, " + translateY + "px)")
            .style("width", xScale(i + 1.0) - xScale(i) + "px")
//            .select(".rectInside")
//            .style("opacity", (xScale(i + 1.0) - xScale(i)) / xScale(data.docs.length))
        ;

//        console.log(xScale(i));
    };

    // SVG container width and height
    var svg_width = parseInt( $html.style("width") );
    var svg_height = parseInt( $html.style("height") );
    // Timeline group position and size
    var margin = 32;
    var timeline_width = svg_width - margin * 2;
    var timeline_height = svg_height / 2 - margin * 2;

    // DOM setup
    var $timeline = $html.append("div")
        .attr("id", "single_year_timeline")
        .style("width", timeline_width + "px")
        .style("height", 250 + "px")
        .data([data.docs])
    ;
    // Apply the translation transform
    $($timeline[0]).css({
        transform: "translate(" + margin + ", " + margin + "px)"
    });

    // Insert articles as <a> elements
    var rects = $timeline.selectAll("a.rect")
        .data(function(d) { return d })
        .enter()
        .append("a")
        .classed("rect", true)
        .attr("href", function(d) { return d.web_url; })
//        .attr("data-headline", function(d) { return d.main_headline; })
        // For debugging
        .attr("data-has-multimedia", function(d) { return (d.multimedia_url && true) == true; })
            // Set up the fisheye distortion right away.
        .each(position)
        .on("click", function(d, i) {
            d3.event.preventDefault();
            window.open(d.web_url);
        })
//        .style("-webkit-transform", function(d, i) {
//            return "translate(" + 15 * i + ", " + 0 + ")"
//        })
    ;

    // Set up an interior container for the rects
    var rectInsides = rects
        .append("div")
        .classed("rectInside", true)
    ;

    // Article headlines
    var rectHeadlines = rectInsides
        .append("h3")
//        .attr("data-headline", function(d) { return d.main_headline; })
        .text(function(d) { return d.main_headline; })
        .style("text-transform", "capitalize")
    ;

    // Article Snippets
    var rectSnippets = rectInsides
        .append("p")
        .text(function(d) { return d.snippet; })
    ;

    // Article Dates
    var rectDates = rectInsides
        .append("cite")
        .text(function(d) {
            var pub_date = new Date(d.pub_date);
            return pub_date.getDate() + " " + months[pub_date.getMonth()] + " " + pub_date.getFullYear();
        })
    ;

    // Article Images
    rectImgs = rects.each(function(d) {
        if (d.multimedia_url) {
            d3.select(this)
                .append("div")
                .classed("imgContainer", true)
                .append("img")
                .attr("src", d.multimedia_url)
                .attr("class", d.multimedia_type)
            ;
        }
    });

    // Event Handler
    $timeline.on("mousemove", function() {
        var mouse = d3.mouse(this);
        // Change the fisheye distortion.
        xScale.distortion(xScaleDistortion).focus(mouse[0]);
        // Previously this was rects.call(position), and I'm not actually sure how that worked in the first place.
        rects.each(position);
    });

    // Return
    return $timeline;
};

// })();
