$(document).ready(function(){

	var svg = d3.select(".donut")
	var margin = {top: 20, right: 250, bottom: 30, left: 40},
		width = window.innerWidth - margin.left - margin.right,
	    height = window.innerHeight - margin.top - margin.bottom;


	var data = [];
	var rects;
	
	// this populates relative position of
	for(var i = 0; i < 200; i++)
		data.push(i)

	var xScale = d3.fisheye.scale(d3.scale.linear).domain([0, data.length]).range([0, width]).focus(width/2);

     svg.on("mousemove", function() {
     	var mouse = d3.mouse(this);
     	xScale.distortion(10).focus(mouse[0]);

     	rects.call(position);
	});

	  // Positions the bars based on data.
	  function position(rect) {
	      rect.attr("x", function(d, i) {
	          return xScale(i) + 5;
	      });
	      rect.attr("width", function(d, i) {
		      return xScale(i+.97) - xScale(i);
		  })
	  }


	donut(data);

	$svg = $("svg");

	var left = 171;
	var barRange = 0.5;
	var closestBar = rects[0][0];
	
	/*
	$("svg").mousemove(function(event){

		fisheye.focus(d3.mouse(this));

		
		//console.log((event.screenX - left) / 10);
		// get the bar closest to a mouse move
		// then resize the rest of the bars
		// according to which bar we grabbed
		var bar = getClosestBar((event.screenX - left) / 10);

		//console.log(bar);
		
		d3.select(bar)
			.transition()
			//.attr('width', "30px")
			.attr('fill', 'black')
			.duration(500);
		
		
	});
*/


	var donutSliceColor;
	
	

	function getClosestBar(mousePosition){
		for(var i = 0; i < rects[0].length; i++){
			if((i - mousePosition) < barRange){
			//if(Math.abs(rects[0][i].__data__ - mousePosition) < barRange) {
				//console.log("square: " + i + "at " + Math.abs(rects[0][i].__data__ - mousePosition));
				closestBar = rects[0][i];
			}
		}
		return closestBar;
	}


function donut(data) {
	
	
    radius = Math.min(width, height) / 2;

	var color = d3.scale.category20();

	var pie = d3.layout.pie()
	.value(function (d) {return d });

	var arc = d3.svg.arc()
	    .innerRadius(radius - 400)
	    .outerRadius(radius );

	svg.append('rect')
		.attr('width', width)
		.attr('height', height)
		.attr('fill','white')

	svg 
		.data([data])
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + 0 + "," + height / 5 + ")");

	rects = svg.selectAll("rect")
		.data(function(d, i) { return d })
		.enter()
		.append("rect")
		.attr('width', function(d){ return 160 + "px" })
		.attr('height', function(d){ return 500 + "px" })
		.attr('x', function(d, i ){ return 15 * i  })
		.attr('fill', "#3D5C95")
		
		.on('mouseover', function(){
			var rect = d3.select(this)
			var position = rect[0][0].__data__;
			
			rect.transition()
				//.attr('y', 300)
				//.attr('width', "30px")
				.attr('fill', 'pink')
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

		.call(position);
	

	function moveSquares(position, length) {
		console.log("position: " + position);

		var scaledPosition;
		/*
		for(var i = 0; i < length; i++){
			otherPosition = i + 1;
			if(otherPosition > position)
				otherPosition = Math.abs(length - otherPosition - position);

			scaledPosition = Math.log(otherPosition)
			console.log(i + " should be " + scaledPosition + " big.");
		}
		/*
		for(var i = position + 1; i < length; i++){
			var current = d3.select(rects[0][i]);
			var oldX = current.attr("x");
			if(forward){
				current
					.transition()
					.attr("x", parseInt(oldX) + 20);
			} else {
				current
					.transition()
					.attr("x", parseInt(oldX) - 20);	
			}
		}
		*/
	}
	/*

	var mySquare=svg.append("rect")
	  .attr("x",60)
	  .attr("y",400)
	  .attr("width",60)
	  .attr("height",60);

	mySquare.on('mouseover', function(){
		d3.select(this)
		  .transition()
		  .attr("x",320);
	})


	
	var path = svg.selectAll("path")
	    .data(pie.value(function(d) { return d }))
	  	.enter().append("path")
	    .attr("fill", function(d, i) { return color(i); })
	    .attr("d", arc)
	    .on('mouseover', function(d){ 
	    	donutSliceColor = d3.select(this).style('fill');
	    	d3.select(this).transition().style("fill", " #fcfcfa");
	    	
	    	//this part is fucked
	    	d3.select(this).tansition()
	    		.attr("d", d3.svg.arc()
				    .innerRadius(radius + 100)
				    .outerRadius(radius + 100));
			


	    })
	    .on('mouseout', function(d){
	    	d3.select(this).transition().style("fill", donutSliceColor);
	    });
	    */

	}




});

/*
(function chart2() {
  var width = 960,
      height = 180,
      xStepsBig = d3.range(10, width, 16),
      yStepsBig = d3.range(10, height, 16),
      xStepsSmall = d3.range(0, width + 6, 6),
      yStepsSmall = d3.range(0, height + 6, 6);

  var fisheye = d3.fisheye.circular()
      .focus([360, 90])
      .radius(100);

  var line = d3.svg.line();

  var svg = d3.select("#chart2").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(-.5,-.5)");

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  svg.selectAll(".x")
      .data(xStepsBig)
    .enter().append("path")
      .attr("class", "x")
      .datum(function(x) { return yStepsSmall.map(function(y) { return [x, y]; }); });

  svg.selectAll(".y")
      .data(yStepsBig)
    .enter().append("path")
      .attr("class", "y")
      .datum(function(y) { return xStepsSmall.map(function(x) { return [x, y]; }); });

  var path = svg.selectAll("path")
      .attr("d", fishline);

  svg.on("mousemove", function() {
    fisheye.focus(d3.mouse(this));
    path.attr("d", fishline);
  });

  function fishline(d) {
    return line(d.map(function(d) {
      d = fisheye({x: d[0], y: d[1]});
      return [d.x, d.y];
    }));
  }
})();
*/



