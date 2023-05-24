class DrawMap {
    constructor(debug = true, access='all') {
        this.debug = (debug === true);
        this.country_json = 'https://unpkg.com/es-atlas@0.5.0/es/autonomous_regions.json';
        this.country_data = null;
        this.view_json = `${this.get_speciality_path("lengua")}/plazas/lengua_vacancies_by_regions`;
        this.view_key = 'geo_ref';
        this.projection_scale = 3000;
        this.width = 1000;
        this.height = 600;
        this.access_name = 'all';
        //this.setScale();
        this.getJsonData();
    }
    get_speciality_path = (key) => {
        let result = null
        switch (key) {
            case "lengua":
                result = "datos/590004-leng-castell-y-literatura"
        }
        return result
    }
    get_url_view(access_name='all'){
        let result = this.view_json + '.json'
        switch (access_name) {
            case "1-libre":
                result = `${this.view_json}_1-libre.json`;
                break;
            case "2-discapacidad":
                result = `${this.view_json}_2-discapacidad.json`;
                break;
        }
        return result;
    }
    updateJsonData(access_name='all'){

        d3.json(this.get_url_view(access_name))
            .then((data) => {
                if(data && data.status === true){
                    this.resetMapView()
                    this.drawMapView(data.data)
                }
            })
            .catch(function(error) {
                console.error("Erreur lors du chargement des données:", error);
            });
    }
    getJsonData(access_name='all'){
        Promise
            .all([d3.json(this.country_json), d3.json(this.get_url_view(access_name))])
            .then((data) => {
                // Valide les données GeoJSON
                var isValid = data && data[0];
                if(isValid && data[1] && data[1].status === true){
                    if(this.debug){
                        console.log("Data from json files");
                        console.log("Country data:");
                        console.log(data[0]);
                        console.log("Data view :");
                        console.log(data[1].data);
                    }
                    this.country_data = data[0]
                    this.setAccessesSelector(data[1].data.accesses)
                    this.drawMapView(data[1].data)
                }
                else{
                    console.log("Fatal error unable to draw map, bad data.")
                }
            })
    }

    setRadioInput(text, slug, checked=false){
        let radioContainer = document.createElement("div");
        radioContainer.setAttribute("class", "form-check form-check-inline")

        let label = document.createElement("label");
        label.innerText = text;
        label.setAttribute("class", "form-check-label")
        let input = document.createElement("input");
        input.type = "radio";
        input.name = "accesses";
        input.value = slug;
        input.checked = (checked === true);
        input.setAttribute("class", "form-check-input")
        radioContainer.appendChild(input);
        radioContainer.appendChild(label);
        return radioContainer;
    }
    onChangeRadio(container){
        const self = this;
        if(container){
            const inputs = container.getElementsByTagName("input");
            if(inputs && inputs.length > 0){
                for(const item in inputs){
                    if(parseInt(item) >= 0){
                        inputs[item].addEventListener('change', function(e){

                            console.log(this.value)
                            this.access_name = this.value;
                            self.updateJsonData(this.access_name)
                        });
                    }

                }
            }
        }
    }
    setAccessesSelector(accesses) {
        if(accesses){
            const container = document.getElementById("FormSelector");
            if(container){
                let RadioButtons = document.createElement("div");
                RadioButtons.setAttribute("class", "form-check");
                let legend = document.createElement("legend");
                legend.innerText = "Turno : ";
                legend.setAttribute("class", "col-form-label");
                RadioButtons.appendChild(legend);
                let radioContainer = this.setRadioInput("Todos", "all", true);
                RadioButtons.appendChild(radioContainer);
                for (let key in accesses) {
                    if(accesses[key].name !== "3 - INDEFINIDO")
                    radioContainer = this.setRadioInput(accesses[key].name, accesses[key].slug);

                    RadioButtons.appendChild(radioContainer);
                }
                container.appendChild(RadioButtons);
                this.onChangeRadio(container)
            }
        }
    }
    resetMapView(){
        document.getElementById("MapDraw").innerHTML = '';
    }
    drawMapView(viewData){
        if(this.debug) { console.log("Starting draw graph..."); }

        const filterViewData = (id_state) => {
            const result = viewData.regions.filter(function (obj) {
                return parseInt(obj.geo_ref) === parseInt(id_state);
            });
            return (result[0]) ? result[0] : 0;
        }

        const border = topojson.mesh(this.country_data, this.country_data.objects.border)

        const projection = d3.geoConicConformalSpain()
        .scale(this.projection_scale) //Échelle

        const path = d3.geoPath().projection(projection);
        const active = "autonomous_regions"

        const minVacancies = d3.min(viewData.regions, (d) => (d.nb_vacancies))
        const maxVacancies = d3.max(viewData.regions, (d) => (d.nb_vacancies))

        const color = d3
            .scaleSequential(
                d3.interpolateOrRd
            )
            .domain([minVacancies, maxVacancies])

        const get_description = () =>{
            let result = "";

            if(viewData.access_name === "all" ){
                result = "Plazas Total por comunidad : " + parseInt(viewData.total_vacancies);
            }
            else{
                result = "Plazas por comunidad turno ";
                result += viewData.access_name;
                result += " : " + parseInt(viewData.total_vacancies);
            }
            return result;
        }

        const description = document.getElementById("description")
        description.innerText = get_description();

        const tooltip = d3
            .select('.visHolder')
            .append('div')
            .attr('id', 'tooltip')
            .style('opacity', 0);


        const svg = d3
            .select("div.visHolder")
            .append("svg")
            .attr("id", "map")
            .attr("viewBox", [0, 0, this.width, this.height])
            //.attr("transform", "translate(" + (0) + "," + (50) + ")");

        svg
        .append('g')
        .attr("transform", "translate(" + (0) + "," + (50) + ")")
        .selectAll('path')
        .data(topojson.feature(this.country_data, this.country_data.objects[active]).features)
        .join('path')
        .attr('class', 'county')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('d', path)
        //.attr("transform", "translate(" + (0) + "," + (140) + ")")
        .attr('data-plazas', function (d) {
            const result = filterViewData(d.id)
            return (result) ? result.nb_vacancies : 0;
        })
        .attr('data-id', function (d) {
            return d.id;
        })
        .attr('fill', (d) => {
            const result = filterViewData(d.id)
            return (result) ? color(result.nb_vacancies) : 0;
        })
        .on("mouseover", (e, d) => {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(() => {
                const result = filterViewData(d.id)
                if (result) {
                    var txt = result.name + " (" + result.nb_vacancies + " plazas)<br />";
                    if(result.vacancies){
                        for(const key in result.vacancies){
                            const vacancie = result.vacancies[key]
                            txt += "Turno " + vacancie.access + " : " + vacancie.vacancies + " plazas <br />"
                        }

                    }

                    return txt
                }
                return "No data retrieved."
            })
                .style('left', e.offsetX + 'px')
                .style('top', e.offsetY + 'px')
                .style('border', '2px solid black')
                //.style('transform', 'translateX(-15px)')
                .attr('data-education', function () {
                    const result = filterViewData(d.id)
                    return (result) ? result.vacancies : 0;
                });
        })
        .on("mouseout", (e, d) => {
            tooltip
                .transition()
                .duration(200)
                .style('opacity', 0);
        });

    svg
        .append('path')
        .attr('d', projection.getCompositionBorders())
        .attr('fill', 'none')
        //.attr('stroke', 'black')
        //.attr("transform", "translate(" + (0) + "," + (180) + ")")


    svg.append("g")
        .attr('id', 'legend')
        .style('opacity', 0.9)
        .attr("transform", "translate(" + (10) + "," + (0) + ")")
        //.scale(1200) //Échelle;

    const legendSequential = d3.legendColor()
        .shapeWidth(60)
        .shapeHeight(40)
        .shapePadding(2)
        .labelOffset(20)
        .cells(10)
        .orient('vertical')
        .scale(color);

    svg
        .select('#legend')
        .call(legendSequential);

    console.log("End draw graph...")

    }


}
const draw_regions = new DrawMap(true);
console.log("Drawer class: ")
console.log(draw_regions)
