function simulate(data, svg)

{

    /* Specify VSG dimensions */
    let width = parseInt(svg.attr("viewBox").split(' ')[2]);
    let height = parseInt(svg.attr("viewBox").split(' ')[3]);
    let main_group = svg.append("g")
        .attr("transform", "translate(175, 50)");


    /* ----- Determine the degree of the nodes ----- */

    // Node Degree based on Disdain metric
    let node_degree_data = d3.map(data.nodes, d => {
        return ({'Character': d.id, 'Disdain': d.Disdain, 'Speaker': d.Speaker, 'Referent': d.Referent, 'Race': d.Race})
    })

    let node_degree = d3.group(node_degree_data, d => d.Character)

    console.log(node_degree);


    /* ----- Scale the nodes according to their degree ----- */

    let scale_radius = d3.scaleLinear()
        .domain(d3.extent(node_degree, d => d[1][0].Speaker))
        .range([10, 30]);


    /* ----- Color the Nodes According to Race ----- */

    let color = d3.scaleOrdinal()
        .domain(['Orc', 'Hobbit', 'Maia', 'Man', 'Dwarf', 'Elf', 'Other'])
        .range(['#488f31', '#8ba944', '#c7c261', '#ffdc87', '#f7aa63', '#ea7652', '#de425b']);


    /* ----- Link Elements ----- */

    let link_elements = main_group.append("g")
        .attr('transform',`translate(${width/3},${height/3})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("path")
        .attr('class', 'line')
        .attr("marker-end", "url(#end)");

    console.log(data.links);

    /* ----- Arrow Elements ----- */

    // build the arrow.
    main_group.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -.5)
        .attr("markerWidth", 10)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");


    /* ----- Node Elements ----- */

    let node_elements = main_group.append("g")
        .attr('transform', `translate(${width / 3},${height / 3})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", function (d){
            return "gr_" + d.Race
        })
        .on("mouseenter", function (d, data){
            //d3.selectAll('#Year').text(data.Year.toString())
            node_elements.classed("inactive", true)

            //const selected_class = d3.select(this).attr("class").split(" ")[0];
            //console.log(selected_class);

            d3.selectAll(".gr_" + data.Race)
                .classed("inactive", false);
        })
        .on("mouseout", function (){
            d3.selectAll(".inactive").classed("inactive", false)
        })

    node_elements.append("circle")
        .attr("r", function (d){
            return scale_radius(node_degree.get(d.id)[0].Speaker)
        })
        .attr("fill", (d)=>color(d.Race))
        .attr("opacity", .5);

    //console.log(data.nodes);

    node_elements.append("text")
        .attr("class","label")
        .attr("text-anchor","middle")
        .text(d=>d.id);


    /* ----- Force Simulation ----- */

    let ForceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide().radius( (d)=> scale_radius(node_degree.get(d.id)[0].Speaker)))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link",d3.forceLink(data.links)
            .id(function (d){
                return d.id
            })
        )
        .on("tick", ticked);

    function ticked()
    {
        node_elements
            .attr('transform', function (d){return `translate(${d.x * 3}, ${d.y * 3})`})
        //.attr("cx", d=>d.x)
        //.attr("cy", d=>d.y)

        link_elements
            .attr('d', linkArc)
            //.attr("x1",d=>d.source.x * 3)
            //.attr("x2",d=>d.target.x * 3)
            //.attr("y1",d=>d.source.y * 3)
            //.attr("y2",d=>d.target.y * 3)

    }

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([-1, 8])
        .on("zoom", zoomed));
    function zoomed({transform}) {
        main_group.attr("transform", transform);
    }

}


function linkArc(d, scale_radius, node_degree) {

        let x1 = d.source.x*3,
          y1 = d.source.y*3,
          x2 = d.target.x*3,
          y2 = d.target.y*3,
          dx = x2 - x1,
          dy = y2 - y1,
          dr = Math.sqrt(dx * dx + dy * dy),

          // Defaults for normal edge.
          drx = dr,
          dry = dr,
          xRotation = 0, // degrees
          largeArc = 0, // 1 or 0
          sweep = 1; // 1 or 0

          // Self edge.
          if ( x1 === x2 && y1 === y2 ) {
            // Fiddle with this angle to get loop oriented.
            xRotation = -90;

            // Needs to be 1.
            largeArc = 1;

            // Change sweep to change orientation of loop.
            //sweep = 0;

            // Make drx and dry different to get an ellipse
            // instead of a circle.
            drx = 20;
            dry = 20;

            // For whatever reason the arc collapses to a point if the beginning
            // and ending points of the arc are the same, so kludge it.
            x2 = x2 - 1;
            y2 = y2 - 1;
          }

     return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
}

