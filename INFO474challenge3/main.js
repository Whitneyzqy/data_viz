// Set up functions
let width = 1400
let height = 600
let padding = 60
let margin = 20

let xScale
let yScale

let xAxis
let yAxis

// set up rainfall chart
outerRadius = 270
innerRadius = 105
chartG = d3.select('#rainfall').attr('width', 960).attr('height', 1800)
let widthR = 960
let heightR = 600


//Pase and formate date
let parseDate = d3.timeParse("%Y-%m-%d");
// var formatTime = d3.time.format("%e %B");

let svg = d3.select('svg')

let tooltip = d3.select('#tooltip')
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([110, 0]);

let generateScales = () => {
    
    xScale = d3.scaleTime()
    .domain([new Date(2014, 6, 1), new Date(2015, 5, 30)])
    .range([padding, width - padding])

    yScale = d3.scaleBand()
    .domain(["Houston", "New York", "Seattle"])
    .range([padding, height - padding])

}

let drawCanvas = () => {
    svg.attr('width', width)
    svg.attr('height', height)
}

let generateAxes = () => {
    let xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%b"));
    svg.append('g')
        .call(xAxis)
        .attr('id','x-axis')
        .attr('transform', 'translate(0, ' + (height-padding) + ')')

    let yAxis = d3.axisLeft(yScale)
	svg.append('g')
        .call(yAxis)
        .attr('id', 'y-axis')
        .attr('transform', 'translate(' + padding + ', 0)')

    svg.append('text').attr('transform', 'translate(' + [width/4, 580] +')').text('2014')
    svg.append('text').attr('transform', 'translate(' + [width/4 *3, 580] +')').text('2015')
        
}

function drawLegend(id, interpolator) {
    var data = Array.from(Array(100).keys());

    var cScale = d3.scaleSequential()
        .interpolator(interpolator)
        .domain([0,99]);

    var xScale = d3.scaleLinear()
        .domain([0,99])
        .range([0, 580]);

    var legend = d3.select("#" + id)
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => Math.floor(xScale(d)))
        .attr("y", 0)
        .attr("height", 40)
        .attr("width", (d) => {
            if (d == 99) {
                return 6;
            }
            return Math.floor(xScale(d+1)) - Math.floor(xScale(d)) + 1;
         })
        .attr("fill", (d) => cScale(d));
    var legendText = d3.select('#legend').append('text')
        .attr('transform', 'translate(215, 130)')
        .text('Temperature Range(°F)')

    var maxTemp = d3.select('#legend').append('text')
        .attr('transform', 'translate(0, 70)')
        .text('110°F')
    var minTemp = d3.select('#legend').append('text')
        .attr('transform', 'translate(530, 70)')
        .text('0°F')

  }

function dataPreprocessor(row) {
    return {
        'actual_mean_temp': +row['actual_mean_temp'],
        'actual_min_temp': +row['actual_min_temp'],
        'actual_max_temp': +row['actual_max_temp'],
        'actual_precipitation': +row['actual_precipitation'],
        'average_precipitation': +row['average_precipitation'],
        'record_precipitation': +row['record_precipitation']
    };
}
   
// Load all three data files
Promise.all([d3.csv("KHOU.csv"), d3.csv("KNYC.csv"), d3.csv("KSEA.csv")], dataPreprocessor).then(function(dataset) {
// set up datasets
    dataHou = dataset[0]
    dataNyc = dataset[1]
    dataSea = dataset[2]
    dataset = d3.merge(dataset)
    console.log(dataset)
// Convert string to date object
    dataset.forEach(function(d){
        d.date = parseDate(d.date)
    })
//******************************************Temperature Heatmap*********************************************
    drawCanvas()
    drawLegend("legend", d3.interpolateRdYlBu);
    generateScales()
    generateAxes()
 
    svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class','cell')
    .attr('date', function(d) {
        return d.date
    })
    .attr('high-temp', function(d) {
        return d.actual_max_temp
    })
    .attr('low-temp', function(d) {
        return d.actual_min_temp
    })
    .attr('fill', function(d) { return colorScale(d.actual_mean_temp)})
    .attr('x', function(d){
        return xScale(d.date)
    }) 
    .attr('y', function(d) {
        return yScale(d.location)
    }) 
    .attr("width", function(d) {
           var countDay = 365
         return (width - (2 * padding)) / countDay
       } )
     .attr("height", yScale.bandwidth() )
     .on('mouseover', (item) => {
        tooltip.transition()
        .style('visibility', 'visible')

        tooltip.html(item.date + "<br>" + 'Average Temperature: '+ item.actual_mean_temp + '°F' + "<br>" +'Daily High Temperature: ' 
                    + item.actual_max_temp + '°F' + "<br>" + 'Daily Low Temperature: ' + item.actual_min_temp + '°F' )
        .attr('date', item['date'])
        .attr('actual_mean_temp', item.actual_mean_temp)
        .attr('item.actual_max_temp', item.actual_max_temp)
        .attr('item.actual_min_temp', item.actual_min_temp)
    })
    .on('mouseout', (item) => {
        tooltip.transition()	
        .duration(500)		
        .style('visibility', 'hidden')
    });
//******************************************Rainfall Chart*********************************************   
// rainfall scales
dateScale = d3.scaleBand()
.domain(dataHou.map(function(d) {return d.date}))
.range([0, 2 * Math.PI])
.align(0)

rainfallScale = d3.scaleLinear()
.domain([0, 10])
.range([innerRadius, outerRadius])

// color legend
chartG.append('text').attr('transform', 'translate(40,100)').attr('fill', '#1d3b4e').text('Precipitation Type').attr('class', 'rainfallTitle')
chartG.append('text').attr('transform', 'translate(65,150)').attr('fill', 'steelblue').text('Actual Precipitation (inch)')
chartG.append('text').attr('transform', 'translate(65,200)').attr('fill', 'lightgreen').text('Record Precipitation (inch)')
chartG.append('rect').attr('transform', 'translate(30,130)').attr('width', 30).attr('height', 30).attr('fill', 'steelblue')
chartG.append('rect').attr('transform', 'translate(30,180)').attr('width', 30).attr('height', 30).attr('fill', 'lightgreen')
 
// draw circle axes 
 xAxis = g => g
    .attr('text-anchor', 'middle')
    .call(g => g.selectAll('g')
      .data(['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'])
      .join('g')
        .attr('transform', (d,i,arr) => `
          rotate(${ i * 360/arr.length })
          translate(${innerRadius},0)
        `)
        .call(g => g.append('line')
            .attr('x1', -5)
            .attr('x2', outerRadius - innerRadius + 10)
            .style('stroke', '#aaa'))
        .call(g => g.append('text')
            .attr('transform', (d,i,arr) => ((i * 360/arr.length) % 360 > 180
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)")) 
            .style('font-family', 'sans-serif')
            .style('font-size', 10)
            .text(d => d)))
    
          yAxis = g => g
            .call(g => g.selectAll('g')
              .data(rainfallScale.ticks(6))
              .join('g')
                .attr('fill', 'none')
                .call(g => g.append('circle')
                    .style('stroke', '#aaa')
                    .style('stroke-opacity', 0.5)
                    .attr('r', rainfallScale))
                .call(g => g.append('text')
                    .attr('y', d => -rainfallScale(d))
                    .attr('dy', '0.35em')
                    .style('stroke', '#fff')
                    .style('stroke-width', 5)
                    .style("fill",'#1a1a1a')
                    .text(rainfallScale.tickFormat(6, 's'))
                 .clone(true)
                    .style('stroke', 'none')))

chartG.append('text').attr('transform', 'translate(' + [550 , heightR /2] +')').text('Houston')
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2] +')').call(xAxis)
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2] +')').call(yAxis)

// Rainfall in Houston
    var recordRainfallHou= chartG.append('g')
    .selectAll('path')
    .data(dataHou)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2] + ')')
	.style("fill","LightGreen")
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.record_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

    var rainfallHou= chartG.append('g')
    .selectAll('path')
    .data(dataHou)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2] + ')')
    .style('fill', 'steelblue')
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.actual_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

// New York
chartG.append('text').attr('transform', 'translate(' + [550 , heightR /2 + 600] + ')').text('New York')
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 600] +')').call(xAxis)
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 600] +')').call(yAxis)


    var recordRainfallNyc= chartG.append('g')
    .selectAll('path')
    .data(dataNyc)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 600] + ')')
	.style("fill","LightGreen")
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.record_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

    var rainfallNyc= chartG.append('g')
    .selectAll('path')
    .data(dataNyc)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 600] + ')')
    .style('fill', 'steelblue')
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.actual_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

// Seattle
chartG.append('text').attr('transform', 'translate(' + [550 , heightR /2 + 1200] +')').text('Seattle')
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 1200] +')').call(xAxis)
chartG.append('g').attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 1200] +')').call(yAxis)


    var recordRainfallSea= chartG.append('g')
    .selectAll('path')
    .data(dataSea)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 1200] + ')')
	.style("fill","LightGreen")
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.record_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

    var rainfallSea= chartG.append('g')
    .selectAll('path')
    .data(dataSea)
    .join('path')
    .attr('transform', 'translate(' + [widthR * 3/5, heightR /2 + 1200] + ')')
    .style('fill', 'steelblue')
    .attr('d', d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => rainfallScale(d.actual_precipitation))
    .startAngle(d => dateScale(d.date))
    .endAngle(d => dateScale(d.date) + dateScale.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius))

})
