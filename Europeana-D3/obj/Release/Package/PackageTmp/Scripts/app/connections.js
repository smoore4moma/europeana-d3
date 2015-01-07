
// europeana api key
var wskey = "hoTkHHxB4";

var tooltip = d3.select('body').append('div')
       .attr('class', 'tooltip')

var q = getUrlVars()["q"];
var rows = getUrlVars()["rows"];

if (q !== undefined) {
    document.getElementById('tbSearchArtist').value = decodeURIComponent(q);
}

function getResults() {

    var searchArtist = document.getElementById('tbSearchArtist');

    q = encodeURIComponent(searchArtist.value);  // encode the search query

    q.replace('%20', '+AND+')

    var searchCount = document.getElementById("search-results");
    rows = searchCount.options[searchCount.selectedIndex].value;

    window.location = window.location.href.split('?')[0] + '?q=' + q + '&rows=' + rows;
}

// Set a default result
if (q === undefined) {
    q = "richard+AND+serra"
}

// Set a default result
if (rows === undefined || rows === 0) {
    rows = "5";
}

var url = "http://europeana.eu/api/v2/search.json?query=who%3A+" + q + "&start=1&rows=" + rows + "&profile=standard&qf=TYPE:IMAGE&wskey=" + wskey;
var nodes = [];
var links = [];
var providers = [];
var museums = [];

d3.json(url, function (json) {

    var nodeParent = { name: json.items[0].dcCreator, "type": 1, "slug": "http://www.google.com/search?q=" + q, "entity": "artist" };
    nodes.push(nodeParent);

    for (var i = 0; i < json.items.length; i++) {

        var provider = json.items[i];
        providers[json.items[i].dataProvider[0]] = provider
    }

    iii = 0;
    for (var provider in providers) {
        museums[iii++] = providers[provider];
    }

    for (var x = 0; x < museums.length; x++) {

        var node = { name: museums[x].dataProvider[0], source: nodes.length + 1, target: nodes.length, "type": 2, "slug": 'http://www.google.com/search?q=' + museums[x].dataProvider[0], "entity": "museum" };
        nodes.push(node);

        nodes.push({ "name": "", source: 0, target: nodes.length, "type": 4, "slug": "", "entity": "slug" });

    }

    for (var i = 0; i < json.items.length; i++) {

        var searchProvider = json.items[i].dataProvider[0];
        var parentObjectIndex;

        for (var ii = 0; ii < nodes.length; ii++) {
            if (nodes[ii].name == searchProvider) {
                parentObjectIndex = ii;
                break;
            }
        }

        node = { name: json.items[i].title, source: parentObjectIndex, target: nodes.length, "type": 3, "slug": json.items[i].edmIsShownAt, "entity": "object", "about": json.items[i].id };
        nodes.push(node);
    }

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].target !== undefined || nodes[i].source !== undefined) {

            if (nodes[i].type === 2) {

                var link = { "source": nodes[i].source, "target": nodes[i].target, "value": 1, "distance": 5 };
                links.push(link);
            }

            if (nodes[i].type === 3) {

                var link = { "source": nodes[i].source, "target": nodes[i].target, "value": 10, "distance": 6 };
                links.push(link);
            }

            if (nodes[i].type === 4) {
                var link = { "source": nodes[i].source, "target": nodes[i].target, "value": 1, "distance": 5 };
                links.push(link);
            }
        }
    }

    var w = 1000,
        h = 800,
        radius = d3.scale.log().domain([0, 312000]).range(["10", "50"]);

    var vis = d3.select("#graphic").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    var force = self.force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .linkDistance(function (d) { return (d.distance * 10); })
        .charge(-250)
        .size([w, h])
        .start();

    var link = vis.selectAll("line.link")
        .data(links)
        .enter().append("svg:line")
        .attr("class", function (d) { return "link" + d.value + ""; })
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; })

    var node = vis.selectAll("g.node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .call(force.drag);

    node.append("circle")
    .attr("class", function (d) { return "node type" + d.type })
    .attr('id', function (d) {
        if (d.type === 3) { return 'm_' + d.about }
    })
    .attr("r", function (d) {
        if (d.type === 1) { return 14 }
        if (d.type === 2) { return 14 }
        if (d.type === 3) { return 10 }
        if (d.type === 4) { return 6 }
        else { return 18 }
    })

    node.append("svg:a")
    .attr("target", "_blank")
    .attr("xlink:href", function (d) {
        if (d.entity == "artist" || d.entity == "museum")
            return d.slug
    })
    .append("text")
    .attr("class", function (d) {
        if (d.entity === "artist")
        { return "nodewrap" }
        else if (d.entity === "museum")
        { return "nodetext" }
        else
        { return "nodetext_object" }
    })
    .attr("dy", "0.35em")

    .attr('font-size', function (d) {
        if (d.entity === "artist") { return '2em' }
        if (d.entity === "museum") { return '1.50em' }
        if (d.entity === "object") { return '1em' }
        else { return '1em' }
    })

    .attr('fill', function (d) {
        if (d.entity === "artist") { return '#738A05' }
        if (d.entity === "museum") { return '#000' }
        if (d.entity === "object") { return '#536870' }
        else { return '#000' }
    })

    .attr('text-anchor', function (d) {
        if (d.entity === "artist") { return 'middle' }
        if (d.entity === "museum") { return 'beginning' }
        if (d.entity === "object") { return 'end' }
        else { return 'end' }
    })

    .text(function (d) { if (d.entity !== "slug") { return d.name } });

    d3.selectAll(".nodewrap")
     .call(wrap, 50);

    node.on("mouseover", function (d) {
        if (d.entity === "artist") {
            d3.select(this).select('text')
                .text(function (d) {
                    return d.name;
                })
                .style("font-size", "4em")
        }
        else if (d.entity === "museum") {
            d3.select(this).select('text')
                .text(function (d) {
                    return d.name;
                })
                .style("font-size", "3em")
        }
        if (d.entity == "artist" || d.entity == "museum") {

            d3.select(this).select('circle')
                            .attr("r", 28)
        }
    })


    node.on("mouseout", function (d) {
        if (d.entity == "artist") {
            d3.select(this).select('text')
                .text(function (d) { return d.name; })
                .style("font-size", "2em")
                .call(wrap, 50);
        }
        else if (d.entity == "museum") {
            d3.select(this).select('text')
                .text(function (d) { return d.name; })
                .style("font-size", "1.5em")
        }


        if (d.entity == "artist" || d.entity == "museum") {

            d3.select(this).select('circle')
                            .attr("r", 14)
        }

    });


    force.on("tick", function () {
        link.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    });


    d3.selectAll('.node.type3')
      .on('click', function (d) {

          var eu_id = this.id.substring(2);  //.replace(/_-_/g,'/');

          var object_url = "http://europeana.eu/api/v2/record" + eu_id + ".json?wskey=" + wskey;

          d3.json(object_url, function (json_obj) {

              var m_image, m_title, m_creator, m_date, m_source, m_source_url;

              if (jsonPath(json_obj, "$.object.europeanaAggregation.edmPreview") === false) { m_image = "../europeana-d3/Content/Images/noimage.jpg"; }
              else { m_image = jsonPath(json_obj, "$.object.europeanaAggregation.edmPreview"); }

              if (jsonPath(json_obj, "$.object.proxies[0].dcTitle..[0]") === false) { m_title = "Title not available"; }
              else { m_title = jsonPath(json_obj, "$.object.proxies[0].dcTitle..[0]"); }

              if (jsonPath(json_obj, "$.object.proxies[0].dcCreator..[0]") === false) { m_creator = "Artist not available"; }
              else { m_creator = jsonPath(json_obj, "$.object.proxies[0].dcCreator..[0]"); }

              if (jsonPath(json_obj, "$.object.proxies[0].dcDate..[0]") === false) { m_date = "Date not available"; }
              else { m_date = jsonPath(json_obj, "$.object.proxies[0].dcDate..[0]"); }

              if (jsonPath(json_obj, "$.object.aggregations[0].edmDataProvider..[0]") === false) { m_source = "Source not available"; }
              else { m_source = jsonPath(json_obj, "$.object.aggregations[0].edmDataProvider..[0]"); }

              if (jsonPath(json_obj, "$.object.aggregations[0].edmIsShownAt") === false) { m_source_url = "Source URL not available"; }
              else { m_source_url = jsonPath(json_obj, "$.object.aggregations[0].edmIsShownAt"); }

              tooltip.html("<table><tr><td id='tooltipImage'><img src='"
                  + m_image + "' /></td><td id='tooltipData'><span style='font-size: bigger;font-weight:bold'>Title: </span>"
                  + m_title + "<br><strong>Artist: </strong>"
                  + m_creator + "<br><strong>Date: </strong>"
                  + m_date + "<br><strong>Source: </strong>"
                  + m_source + "<br><strong>Object URL: </strong><a href='"
                  + m_source_url + "' target='_blank'>object url</a></td></tr></table>")
          });



          tooltip.transition()
                 .style('opacity', .95)
               //.style('left', (d.x) + 'px')
               //.style('top', (d.y) + 'px')
                 .style('left', '10px')
                 .style('top', '70px');
               //.style('visibility', 'visible');

      })

    .on("mouseout", function (d) {
        tooltip.transition()
              .duration(4000)
              .style("opacity", 0);
            //.style('visibility', 'hidden');
    });

    force.start();

});


function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = .50, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0,
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}




