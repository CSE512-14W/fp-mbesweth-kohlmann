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
    // Set up a timeline for all the years represented in the data set.
    var $all_years_timeline = AllYearsTimeline(data, $svg);
//    var $single_year_timeline = SingleYearTimeline($svg);
};

var CreateSVGContainer = function($container) {
    var svg_width = 1920;
    var svg_height = 640;

    var $svg = $container.append("svg")
//        .data([data])
        .attr("width", svg_width + "px")
        .attr("height", svg_height + "px")
    ;

    return $svg;
}

var TransitionToSingleYearTimeline = function(single_year_data, $svg, $all_years_timeline, $single_year_timeline) {
    // SVG container width and height
    var svg_width = parseInt( $svg.style("width") );
    var svg_height = parseInt( $svg.style("height") );
    // Timeline group position and size
    var margin = 32;
    var timeline_width = svg_width - margin * 2;
    var timeline_height = svg_height / 2 - margin * 2;
    var timeline_x = margin;
    var timeline_y = svg_height / 2 + margin;
    var timeline_y_centered = svg_height / 2 - timeline_height / 2;

    $all_years_timeline
        .transition()
        .delay(500)
        .duration(1000)
        .attr("transform", "translate(" + timeline_x + ", " + timeline_y + ")")
    ;

    $single_year_timeline
        .data([single_year_data])
        .transition()
        .delay(500)
        .duration(1000)
        .attr("opacity", 1.0)
    ;
}

var AllYearsTimeline = function(data, $svg) {
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

    var heightScale = d3.scale.log().domain([data.max_hits, 0.5]).range([timeline_height,0]);

    console.log(heightScale(428));

    // Year rect size
    var year_rect_width = timeline_width / data.years.length;

    // DOM setup
    var $timeline = $svg.append("g")
        .data([data.years])
        .attr("id", "all_years_timeline")
        .attr("width", timeline_width + "px")
        .attr("height", timeline_height + "px")
        .attr("transform", "translate(" + timeline_x + ", " + timeline_y_centered + ")")
    ;

    // SVG elements for each year
    var $year_groups = $timeline.selectAll("g")
        .data(function(d) { return d; })
    ;

    $year_groups
        .enter()
        .append("g")
        .classed("year", true)
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
        .text(function(d) { return d.year; })
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
        console.log("Hello, hovering");
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
            window.alert("We should show a month timeline for the year" + d.year + ".");
            throw "Month timeline not implemented yet.";
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

var SingleYearTimeline = function($svg, data) {
    var margin = {top: 20, right: 250, bottom: 30, left: 40},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

	var rects;
	var rectText;

	// this populates relative position of
//	for (var i = 0; i < 200; i++) {
//		data.push(i)
//    }

	var xScale = d3.fisheye.scale(d3.scale.linear).domain([0, data.length]).range([0, width]).focus(width/2);

    //
    $svg.on("mousemove", function() {
     	var mouse = d3.mouse(this);
     	xScale.distortion(100).focus(mouse[0]);

     	rects.call(position);
     	rectText.call(position);
     	rectText.each(function() {
     		var $that = d3.select(this);
     		var x = $that.attr("x");
     		$that.selectAll("tspan").attr("x", x + 30 + "px");
     	});
	});

	  // Positions the bars based on data.
	var position = function(rect) {
        rect.attr("x", function(d, i) {
            return xScale(i) + 5;
        });
        rect.attr("width", function(d, i) {
            return xScale(i+.97) - xScale(i);
        });
    };

	var textPosition = function(text) {
	    text.attr("x", function(d, i) {
	        return xScale(i) + 5;
        });
	};
    //////////////////////
    // Begin Joe's Code //
    //////////////////////
    // SVG container width and height
    var svg_width = parseInt( $svg.style("width") );
    var svg_height = parseInt( $svg.style("height") );
    // Timeline group position and size
    var margin = 32;
    var timeline_width = svg_width - margin * 2;
    var timeline_height = svg_height / 2 - margin * 2;
    var timeline_x = margin;
    var timeline_y = margin;
    var timeline_y_centered = svg_height / 2 - timeline_height / 2;

    // DOM setup
    var $timeline = $svg.append("g")
        .attr("id", "single_year_timeline")
        .attr("width", timeline_width + "px")
        .attr("height", timeline_height + "px")
        .attr("transform", "translate(" + timeline_x + ", " + timeline_y + ")")
    ;

//    return $timeline;
    ////////////////////
    // End Joe's Code //
    ////////////////////
    radius = Math.min(width, height) / 2;

	var color = d3.scale.category20();

    var pie = d3.layout.pie()
	    .value(function (d) {return d })
    ;

	$timeline
		.data([data])
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + 0 + "," + height / 5 + ")")
        .attr("opacity", "0.0")
    ;

	rectGroups = $timeline.selectAll("g")
		.data(function(d, i) { return d })
		.enter()
		.append("g")
		.attr('x', function(d, i ){ return 15 * i  })
	;

	rects = rectGroups
		.append("rect")
		.attr('width', function(d) { return 160 + "px" })
		.attr('height', function(d) { return 250 + "px" })

		.attr('fill', "#3D5C95")

		.on('mouseover', function(){
			var rect = d3.select(this)
			var position = rect[0][0].__data__;

			rect.transition()
				//.attr('y', 300)
				//.attr('width', "30px")
				.attr('fill', '#cc0000')
				.duration(200);


			//moveSquares(position, rects[0].length, true);
			//moveSquares(position, rects[0].length);
		})
		.on('mouseout',function(){

			var rect = d3.select(this)
			var position = rect[0][0].__data__;

			d3.select(this)
				.transition()
				//.attr('y', 0)
				//.attr('width', "10px")
				.attr('fill','#3D5C95')
				.duration(200)

			//moveSquares(position, rects[0].length, false);

		})
		.on('click', function(d) {
			window.open(d.web_url);
		})
		//.append("text")
		//.text(function(d) { return d.main_headline })
		.call(position)
	;

	// Append svg foreignObject element containing an HTML paragraph
	rectText = rectGroups
		.append("text")
		.attr("y", "10px")
		.attr("data-headline", function(d) { return d.main_headline; })
		.each(function(d) {
			var $that = d3.select(this);
			var textContent = d.main_headline;
			var wordsPerLine = 4;
			var words = textContent.split(" ");

			for (var i = 0; i < words.length; i += wordsPerLine) {
				var lineContent = words.slice(i, i + wordsPerLine).join(" ");
				$that.append("tspan")
					.attr("dy", (1.2) + "em")
					.attr('dx', "1em")
					.text(lineContent)
				;
			}
		});
	;

    // Event Handlers
    $timeline.on("mousemove", function() {
     	var mouse = d3.mouse(this);
     	xScale.distortion(100).focus(mouse[0]);

     	rects.call(position);
     	rectText.call(position);
     	rectText.each(function() {
     		var $that = d3.select(this);
     		var x = $that.attr("x");
     		$that.selectAll("tspan").attr("x", x + 30 + "px");
     	});
	});

    // Invoke the layout right away
    xScale.distortion(100).focus(960);

    rects.call(position);
    rectText.call(position);
    rectText.each(function() {
        var $that = d3.select(this);
        var x = $that.attr("x");
        $that.selectAll("tspan").attr("x", x + 30 + "px");
    });

    // Return
    return $timeline;
};

// })();
