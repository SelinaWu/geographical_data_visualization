
import * as d3 from "d3";
import React, { Component } from 'react';
// import { feature } from "topojson-client";
import * as topojson from "topojson-client";
import LatLong from "./latlongRedux"

class Globe3D extends Component{
	state = {
		world: null,
		places: null,
	}

	componentWillMount(){
		Promise.all([
        fetch("/world-110m.json")
	      .then(response => {
	        if (!response.ok) {
	          throw new Error("Bad response");
	        }
	        return response.json();
	      }),
	      fetch("./places.json")
	      .then(response => {
	        if (!response.ok) {
	          throw new Error("Bad response");
	        }
	        return response.json();
	      })
        ]).then( ([world, places]) => {
            // do stuff
            this.setState({
            	world,
            	places
            });
        }).catch(err => console.log('Error loading or parsing data.'))
		
		
		
	}

	position_labels(proj, svg, width, height) {
      var centerPos = proj.invert([width/2,height/2]);

      svg.selectAll(".label")
        .attr("text-anchor",function(d) {
          var x = proj(d.geometry.coordinates)[0];
          return x < width/2-20 ? "end" :
                 x < width/2+20 ? "middle" :
                 "start"
        })
        .attr("transform", function(d) {
          var loc = proj(d.geometry.coordinates),
            x = loc[0],
            y = loc[1];
          var offset = x < width/2 ? -5 : 5;
          return "translate(" + (x+offset) + "," + (y-2) + ")"
        })
        .style("display",function(d) {
          var d = d3.geoDistance(d.geometry.coordinates, centerPos);
		  return (d > 1.57) ? 'none' : 'inline';
        })
        
    }   
   
    
	componentDidUpdate(){
		const svg = d3.select(this.refs.anchor),
			  {width, height} = this.props;
		
		const proj = d3.geoOrthographic()
			        .scale(220)
			        .translate([width / 2, height / 2])
			        .clipAngle(90);
		const path = d3.geoPath(proj)
					.pointRadius(1.5);
		const graticule = d3.geoGraticule()();

		const ocean_fill = svg.append("defs").append("radialGradient")
		        .attr("id", "ocean_fill")
		        .attr("cx", "75%")
		        .attr("cy", "25%");
			ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#ddf");
			ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#9ab");

		const globe_highlight = svg.append("defs").append("radialGradient")
		      .attr("id", "globe_highlight")
		      .attr("cx", "75%")
		      .attr("cy", "25%");
		    globe_highlight.append("stop")
		      .attr("offset", "5%").attr("stop-color", "#ffd")
		      .attr("stop-opacity","0.6");
		    globe_highlight.append("stop")
		      .attr("offset", "100%").attr("stop-color", "#ba9")
		      .attr("stop-opacity","0.2");

		const globe_shading = svg.append("defs").append("radialGradient")
		      .attr("id", "globe_shading")
		      .attr("cx", "50%")
		      .attr("cy", "40%");
		    globe_shading.append("stop")
		      .attr("offset","50%").attr("stop-color", "#9ab")
		      .attr("stop-opacity","0")
		    globe_shading.append("stop")
		      .attr("offset","100%").attr("stop-color", "#3e6184")
		      .attr("stop-opacity","0.3")

		const drop_shadow = svg.append("defs").append("radialGradient")
		      .attr("id", "drop_shadow")
		      .attr("cx", "50%")
		      .attr("cy", "50%");
		    drop_shadow.append("stop")
		      .attr("offset","20%").attr("stop-color", "#000")
		      .attr("stop-opacity",".5")
		    drop_shadow.append("stop")
		      .attr("offset","100%").attr("stop-color", "#000")
		      .attr("stop-opacity","0") 

		const world = this.state.world,
			  places = this.state.places;

		const centerPos = proj.invert([width/2,height/2]);
		const reactClass = this;
		

		svg.append("ellipse")
            .attr("cx", 440).attr("cy", 450)
            .attr("rx", proj.scale()*.9)
            .attr("ry", proj.scale()*.5)
            .attr("class", "noclicks")
            .style("fill", "url(#drop_shadow)");

      	svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class", "noclicks")
            .style("fill", "url(#ocean_fill)");
        
        svg.append("path")
            .data(topojson.feature(world, world.objects.land).features)
            .attr("class", "land")
            .attr("d", path);

        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule noclicks")
            .attr("d", path);

        svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class","noclicks")
            .style("fill", "url(#globe_highlight)");

        svg.append("circle")
            .attr("cx", width / 2).attr("cy", height / 2)
            .attr("r", proj.scale())
            .attr("class","noclicks")
            .style("fill", "url(#globe_shading)");

         

        svg.append("g").attr("class","points")
            .selectAll("text").data(places.features)
          .enter().append("path")
            .attr("class", "point")
            .attr("d", path);

        svg.append("g").attr("class","labels")
            .selectAll("text").data(places.features)
          .enter().append("text")
          .attr("class", "label")
          .text(function(d) { return d.properties.name })

        svg.append("g").attr("class","countries")
	       .selectAll("path")
	         .data(topojson.feature(world, world.objects.countries).features)
	       .enter().append("path")
	         .attr("d", path)

	    

        this.position_labels(proj, svg, width, height);
        

        var m0, 
			o0,
			pt;
		
		svg.on("mousedown.log", function() {
			const p = proj.invert(d3.mouse(this));
			const location = d3.mouse(this);
			pt = {'x': location[0],
				  'y': location[1]}
			var lonlat = proj.invert(d3.mouse(this))
			console.log("Lon & Lat:", lonlat);
			console.log(typeof(lonlat))
			LatLong.dispatch({type: lonlat})
		})
		
		
        svg.on('mousemove', () => {
 
            if (m0) {
		        const m1 = [d3.event.pageX, d3.event.pageY]
		          , o1 = [o0[0] + (m1[0] - m0[0]) / 6, o0[1] + (m0[1] - m1[1]) / 6];
		        o1[1] = o1[1] > 30  ? 30  :
		                o1[1] < -30 ? -30 :
		                o1[1];
		        proj.rotate(o1);

		        svg.selectAll(".land").attr("d", path);
				svg.selectAll(".countries path").attr("d", path);
				svg.selectAll(".graticule").attr("d", path);
				svg.selectAll(".point").attr("d", path);
				console.log("mouse move");
				reactClass.position_labels(proj, svg, width, height);				
        	}
        });
		svg.on('mouseup', () => {
            if (m0) {
		        svg.on('mousemove', () => {
		            if (m0) {
				        const m1 = [d3.event.pageX, d3.event.pageY]
				          , o1 = [o0[0] + (m1[0] - m0[0]) / 6, o0[1] + (m0[1] - m1[1]) / 6];
				        o1[1] = o1[1] > 30  ? 30  :
				                o1[1] < -30 ? -30 :
				                o1[1];
				        proj.rotate(o1);
				        svg.selectAll(".land").attr("d", path);
						svg.selectAll(".countries path").attr("d", path);
						svg.selectAll(".graticule").attr("d", path);
						svg.selectAll(".point").attr("d", path);
						console.log("mouse up");
						reactClass.position_labels(proj, svg, width, height);
		        	}
		        });
		        m0 = null;
		      }
        });
        svg.on('mousedown', () => {
            m0 = [d3.event.pageX, d3.event.pageY];
			o0 = proj.rotate();
			console.log("mouse down");
			d3.event.preventDefault();
        });

		var dataset = [
		{ x: width / 2, y: height/2 }]

        var circleLoc = svg.append("circle")
			        	.data(dataset)
			            .attr("cx", function(d){
			            	console.log("ori",d.x);
			            	return d.x
			            })
			            .attr("cy", function(d){
			         		console.log("ori",d.y);
			            	return d.y
			            })
			            .attr("r", 10)
			            .attr("class","noclicks")
			            .style("fill", "red")
			            .style("opacity",.5)
			            
        svg.on('click',()=>{
        				dataset.shift();
						dataset.push(pt);
						circleLoc.data(dataset)
						.attr(
							"cx", function(d){console.log("new x:", d.x);return d.x})
						.attr(
		            		"cy", function(d){console.log("new y:", d.y);return d.y}
		            	)})
        var ptdata = [];

		var line = d3.line()
			    .curve(d3.curveLinear)
			    .x(function(d) { return d.x; })
			    .y(function(d) { return d.y; });

		const mouseLoc = svg.append("g")
					  .append("path")
					    .data([ptdata])
					    .attr("class", "line")
					    .attr("d", line);

        const svgagain = d3.select("body")
				    .select("svg")
		            .on('mousemove',()=>{
		            	const pt = {'x':d3.event.pageX, 'y':d3.event.pageY};
				    	ptdata.push(pt);
				    	
				    	mouseLoc.attr("d", function(d) { return line(d);})
				    	if (ptdata.length > 5) {
							  ptdata.shift();
						  }
		            });


	}

	
	render(){
		const {world, places} = this.state;
		if (!world || !places){
			return null;
		}
		return <g ref="anchor" />;
	}
}
export default Globe3D;