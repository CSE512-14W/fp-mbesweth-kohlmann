$(document).ready(function(){


	var margin = {top: 20, right: 30, bottom: 30, left: 40},
		width = 3000 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	var data = [];
	var rects;

	// this populates relative position of
	// 
	for(var i = 1; i <= 200; i++)
		data.push(i * 5)

	donut(data);

	$svg = $("svg");

	var left = 171;
	var barRange = 0.5;
	var closestBar = rects[0][0];
	console.log(rects[0][0]);
	

	$("svg").mousemove(function(event){


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

	var donutSliceColor;
	console.log(rects[0][0].__data__)

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
	
	var width = 4000,
    height = 1000,
    radius = Math.min(width, height) / 2;

	var color = d3.scale.category20();

	var pie = d3.layout.pie()
	.value(function (d) {return d });

	var arc = d3.svg.arc()
	    .innerRadius(radius - 400)
	    .outerRadius(radius );


	var svg = d3.select(".donut")
		.data([data])
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + 0 + "," + height / 5 + ")");

	rects = svg.selectAll("rect")
		.data(function(d, i) { return d })
		.enter()
		.append("rect")
		.attr('width', function(d){ return 10 + "px" })
		.attr('height', function(d){ return 200 + "px" })
		.attr('x', function(d, i ){ return 15 * i  })
		.attr('fill', "pink");

	console.log(rects);

	/*
	rects.on('mouseover', function(){
		//console.log('over');
		d3.select(this)
			.transition()
			//.attr('y', 300)
			.attr('width', "30px")
			.duration(500);
	}).on('mouseout',function(){
		//console.log('out');
		d3.select(this)
			.transition()
			//.attr('y', 0)
			.attr('width', "10px")
			.duration(500);
	});
	*/

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


	/*
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

