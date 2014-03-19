// (function() {
var data_url = flask_util.url_for("search", {fq: 'persons:("Obama, Barack")'});
// Available for debugging purposes
var data;
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
    var months;
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
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    }

    console.log(data);
    console.log(data.years);
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

var SingleYearTimeline = function(data, $html) {
    var margin = {top: 20, right: 250, bottom: 30, left: 40},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

    var rects;

    // this populates relative position of
//  for (var i = 0; i < 200; i++) {
//      data.push(i)
//    }

    var xScale = d3.fisheye.scale(d3.scale.linear).domain([0, data.docs.length]).range([0, width]).focus(width/2);

    // Positions the bars based on data.
    var position = function(d, i) {
        // get the current transformation
//        var transform = new WebKitCSSMatrix(
//            d3.select(this).style("-webkit-transform")
//        );
        var transform = new WebKitCSSMatrix()
            .translate(xScale(i) + 5, 0)
//            .scale((xScale(i + .97) - xScale(i)) / 160, 1.0)
        ;
        d3.select(this)
            .style("-webkit-transform", transform)
            .style("width", xScale(i + .97) - xScale(i) + "px")
        ;
    };

//  var textPosition = function(text) {
//      text.each(function(d, i) {
//          $(this).css({
//                transform: xScale(i) + 5
//            });
//        });
//  };
    //////////////////////
    // Begin Joe's Code //
    //////////////////////
    // SVG container width and height
    var svg_width = parseInt( $html.style("width") );
    var svg_height = parseInt( $html.style("height") );
    // Timeline group position and size
    var margin = 32;
    var timeline_width = svg_width - margin * 2;
    var timeline_height = svg_height / 2 - margin * 2;
    var timeline_x = margin;
    var timeline_y = margin;
    var timeline_y_centered = svg_height / 2 - timeline_height / 2;

    // DOM setup
    var $timeline = $html.append("div")
        .attr("id", "single_year_timeline")
        .style("width", timeline_width + "px")
        .style("height", 250 + "px")
        .data([data.docs])
//        .style("position", "absolute")
//        .style("left", 0)
//        .style("top", 0)
//        .attr("transform", "translate(" + timeline_x + ", " + timeline_y + ")")
    ;
    // Apply the translation transform
    $($timeline[0]).css({
        transform: "translate(" + timeline_x + ", " + timeline_y + "px)"
    });

    // Event handler
    $timeline.on("mousemove", function() {
        var mouse = d3.mouse(this);
        xScale.distortion(100).focus(mouse[0]);

        rects.call(position);
        rectText.call(position);
        rectText.each(function() {
            var $that = d3.select(this);
//          var x = $that.attr("x");
//          $that.selectAll("tspan").attr("x", x + 30 + "px");
        });
    });

//    return $timeline;
    ////////////////////
    // End Joe's Code //
    ////////////////////
    radius = Math.min(width, height) / 2;

    var color = d3.scale.category20();

    var pie = d3.layout.pie()
        .value(function (d) {return d })
    ;

//    $timeline
//        .data([data.docs])
//        .attr("width", width)
//        .attr("height", height)
////      .append("g")
////      .attr("transform", "translate(" + 0 + "," + height / 5 + ")")
////        .attr("opacity", "0.0")
//    ;

    rects = $timeline.selectAll("div")
        .data(function(d) { return d })
        .enter()
        .append("div")
        .classed("rect", true)
        .attr("data-headline", function(d) { return d.main_headline; })
        .attr("data-multimedia", function(d) { return d.multimedia_url; })
        .style("-webkit-transform", function(d, i) {
            return "translate(" + 15 * i + ", " + 0 + ")"
        })
//        .style('background-color', "#3D5C95")
//        .on('mouseover', function() {
////            var rect = d3.select(this)
////            var position = rect[0][0].__data__;
//
//            rect.transition()
//                .style('background-color', '#cc0000')
//                .duration(200)
//            ;
//        })
//        .on('mouseout',function(){
//
//            var rect = d3.select(this)
//            var position = rect[0][0].__data__;
//
//            d3.select(this)
//                .transition()
//                .duration(200)
//            ;
//
//        })
        .on('click', function(d) {
            window.open(d.web_url);
        })
    ;

    rectInsides = rects
        .append("div")
        .classed("rectInside", true)
    ;

    // CSS Transforms
//    rects
//        .each(function(d, i) {
//            $(this).css({
//                transform: "translateX(" + 15 * i + "px)"
//            });
//
//            var transform = new WebKitCSSMatrix(
//                $(this).css("-webkit-transform")
//            );
//            transform = transform.translate(0, i * -250);
//            $(this).css("-webkit-transform", transform);
//        })
//    ;

//  rects = rectGroups
//      .append("div")
//        .classed("rect")
//      .attr('width', function(d) { return 160 + "px" })
//      .attr('height', function(d) { return 250 + "px" })
//      .style('background-color', "#3D5C95")
//      .on('mouseover', function() {
//          var rect = d3.select(this)
//          var position = rect[0][0].__data__;
//
//          rect.transition()
//              //.attr('y', 300)
//              //.attr('width', "30px")
//              .style('background-color', '#cc0000')
//              .duration(200);
//
//
//          //moveSquares(position, rects[0].length, true);
//          //moveSquares(position, rects[0].length);
//      })
//      .on('mouseout',function(){
//
//          var rect = d3.select(this)
//          var position = rect[0][0].__data__;
//
//          d3.select(this)
//              .transition()
//              //.attr('y', 0)
//              //.attr('width', "10px")
//              .style('background-color','#3D5C95')
//              .duration(200)
//
//          //moveSquares(position, rects[0].length, false);
//
//      })
//      .on('click', function(d) {
//          window.open(d.web_url);
//      })
//      //.append("text")
//      //.text(function(d) { return d.main_headline })
//      .call(position)
//  ;

    // Append svg foreignObject element containing an HTML paragraph
    rectHeadlines = rectInsides
        .append("h3")
//        .attr("data-headline", function(d) { return d.main_headline; })
        .text(function(d) { return d.main_headline; })
    ;

    rectLeads = rectInsides
        .append("p")
        .text(function(d) { return d.snippet; })
    ;

    rectImgs = rects.each(function(d, i) {
        if (d.multimedia_url) {
            d3.select(this)
                .append("img")
                .attr("src", d.multimedia_url)
                .attr("class", d.multimedia_type)
            ;
        }
    })
//        .append("img")
////        .attr("data-multimedia", function(d) { return d.multimedia_url; })
//        .attr("src", function(d) { return d.multimedia_url; })
    ;

    // Event Handlers
    $timeline.on("mousemove", function() {
        var mouse = d3.mouse(this);
        xScale.distortion(100).focus(mouse[0]);
        rects.each(position);
    });

    // Invoke the layout right away
    xScale.distortion(100).focus(960);

//    rects.call(position);
//    rectText.call(position);
//    rectText.each(function() {
//        var $that = d3.select(this);
//        var x = $that.attr("x");
//        $that.selectAll("tspan").attr("x", x + 30 + "px");
//    });

    // Return
    return $timeline;
};

// })();
