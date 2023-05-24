// Call the dataTables jQuery plugin
$(document).ready(function() {
    Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
    Chart.defaults.global.defaultFontColor = '#292b2c';
    const version = "?v0.0.1"
    const get_speciality_path = (key) => {
        let result = null
        switch (key) {
            case "lengua":
                result = "datos/590004-leng-castell-y-literatura"
        }
        return result
    }

      const loadData = (url) =>{
          return new Promise((resolve, reject) => {
              $.ajax({url: url, success: (data) => {
                if(data){
                    resolve(data);
                }else{
                    reject(new Error("No data to show."))
                }
              },
              error: (err)=>{
                  reject(new Error("File unavailable."))
              }})
          })
      }
    const reset_dataTable = ()=>{
        if($.fn.dataTable.isDataTable( '#dataTable' )){
            $('#dataTable').DataTable().destroy();
            $('#dataTable').empty();
        }
    }

    const get_dataTable_options = ()=>{
        return {
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json',
            },
            lengthMenu:[10, 25, 50, 100, 200],
            pageLength: 50,
            dom: 'iflptrip',
        }
    }

    const get_ordered_scales_table_view_url = (view="all") => {
        let url_view = null;
        const base_path = get_speciality_path("lengua")
        switch (view) {
            case "free":
                url_view = `${base_path}/ordenados/lengua_ordered_scales_1-libre.json${version}`;
                break;
            case "handicap":
                url_view = `${base_path}/ordenados/lengua_ordered_scales_2-discapacidad.json${version}`;
                break;
            default:
                url_view = `${base_path}/ordenados/lengua_ordered_scales.json${version}`;
                break;
        }
        return url_view;
    }

    const ordered_scales_dataTable = ()=>{
        if($('#dataTable')){
            const url_view = get_ordered_scales_table_view_url()
            loadData(url_view)
                .then((data)=>{
                    let options = get_dataTable_options();
                    options.columns = data.columns;
                    options.data = data.data
                    let data_table = $('#dataTable').DataTable(options);
                })
        }
    }

    const contest_result_dataTable_loader = (region, access)=>{
        if($('#dataTable')){
            const base_path = get_speciality_path("lengua")
            const url_view = `${base_path}/resultados/json/result-${region}-${access}.json${version}`
            loadData(url_view)
                .then((data)=>{
                    reset_dataTable()
                    let options = get_dataTable_options();
                    options.columns = [
                        {"title": "Posición", type:"num"},
                        {"title": "Id", type:"num"},
                        {"title": "Nombre", type:"text"},
                        {"title": "N.I.F", type:"text"},
                        {"title": "Baremo", type:"num"},
                        {"title": "N° Pref.", type:"num"}
                    ];
                    options.data = data.rows
                    let data_table = $('#dataTable').DataTable(options);

                })
                .catch((err)=>{
                    reset_dataTable()
                    if($("#contest_result_title")){
                        $("#contest_result_title").text("No hay datos en este momento, pronto estarán disponibles.");
                    }
                })


        }
    }
    const set_data_table_title = (titles)=>{
        let text = "Por favor, seleccione una comunidad y el turno, para poder ver algún resultado"
        if($("#region_select") && $("#access_select") && titles){
            const region = $('#region_select').find(":selected").val();
            const access = $('#access_select').find(":selected").val();
            if(titles[region] && titles[region][access]){
                text = titles[region][access]
            }else{
                text = `Atribución de plazas - ${region_name} - Turno ${access_name} : No está disponible en este momento.`
            }
            if($("#contest_result_title")){
                $("#contest_result_title").text(text);
            }
        }
    }
    const on_change_contest_result_select = (titles, e) =>{
        let text = "Por favor, seleccione una comunidad y el turno, para poder ver algún resultado"
        if($("#region_select") && $("#access_select") && titles){
            const region = $('#region_select').find(":selected").val();
            const region_name = $('#region_select').find(":selected").text();
            const access = $('#access_select').find(":selected").val();
            const access_name = $('#access_select').find(":selected").text();
            if(titles[region] && titles[region][access]){
                text = titles[region][access]
                contest_result_dataTable_loader(region, access)
            }else{
                text = `Atribución de plazas - ${region_name} - Turno ${access_name} : No está disponible en este momento.`
                reset_dataTable()
            }
        }
        if($("#contest_result_title")){
            $("#contest_result_title").text(text);
        }
    }
    const fill_contest_result_selects = ()=>{
        return new Promise((resolve, reject) => {
            const base_path = get_speciality_path("lengua")
            const url = `${base_path}/resultados/lengua_contest_result_selects.json`
            if($("#region_select") && $("#access_select")){
                loadData(url).then((data)=>{
                    if(data
                            && data.status === true
                            && data.region_select
                            && data.access_select
                            && data.titles){
                        let region, access;
                        $.each(data.region_select, function(index) {

                            $("#region_select").append($("<option />").val(this.value).text(this.option));
                            if(index === 0){
                                $("#region_select").children("option").attr("selected", true);
                                region = this.value;
                            }
                        });
                        $.each(data.access_select, function(index) {
                            $("#access_select").append($("<option />").val(this.value).text(this.option));
                            if(index === 0){
                                $("#access_select").children("option").attr("selected", true);
                                access = this.value
                            }
                        });
                        contest_result_dataTable_loader(region, access);
                        set_data_table_title(data.titles)
                        $("#region_select").on("change", (e)=>{
                            on_change_contest_result_select(data.titles, e)
                        })
                        $("#access_select").on("change", (e)=>{
                            on_change_contest_result_select(data.titles, e)
                        })
                        resolve(true)
                    }else{
                        reject({status: false, msg: "No hay datos disponibles en este momento."})
                    }
                })
            }
        })

    }
    const set_contest_result_status_item = (region, access, data) =>{
        if($("#contest_result_status") && data){
            /*let container = $("#contest_result_status")
                .append($("<div>")).addClass("card-text");
            let title = $(container).append($("<div>"))
                .addClass("small font-weight-bold d-flex justify-content-between align-items-start")*/
        }
    }

    const set_contest_result_status = ()=>{
        return new Promise((resolve, reject) => {
            const base_path = get_speciality_path("lengua")
            const url = `${base_path}/resultados/lengua_contest_result_status.json`
            if($("#contest_result_status")){
                loadData(url).then((data)=>{
                    if(data
                        && data.status === true
                        && data.regions){
                        $.each(data.regions, function(region) {
                            const t_region = this
                            let region_name = null
                            $("#contest_result_status").append(
                                $("<div />")
                                    .addClass("card-text mb-3").attr("data-region", region)
                                    .append(
                                        $("<h4 />").addClass("mb-3")
                                    )
                            )
                            $.each(this, function(access) {
                                const cont = $('[data-region="'+region+'"]')
                                const is_success = this.nb_teachers === this.vacancies && this.vacancies > 0
                                let bg_class = "bg-info"
                                const percent = (this.vacancies > 0) ? this.nb_teachers * 100 / this.vacancies : 0;
                                const empate = (this.cut_note > 0) ? this.cut_note : 'null';
                                if(is_success === true){
                                    bg_class = "bg-success"
                                }
                                if(region_name === null){
                                    $(cont).children('h4').text(this.region_name)
                                }
                                $(cont).append(
                                    $("<div />").attr("data-access", access)
                                )
                                const access_cont = $(cont).children('[data-access="'+access+'"]')
                                $(access_cont).append(
                                    $("<h5 />").addClass("small font-weight-bold d-flex justify-content-between align-items-start")
                                        .text(`${this.access_name} - Nota de corte ${empate}`)
                                )
                                $(access_cont).children('h5.small').append(
                                    $("<span />").text(`${this.nb_teachers} / ${this.vacancies} Plazas`)
                                )
                                $(access_cont).append(
                                    $("<div />").addClass("progress mb-3")
                                )
                                $(access_cont).children('div').append(
                                    $("<div />")
                                        .addClass("progress-bar progress-bar-striped")
                                        .addClass(bg_class)
                                        .attr("aria-valuenow", percent)
                                        .attr("aria-valuemin", "0")
                                        .attr("aria-valuemax", "100")
                                        .attr("style", "width: " + percent + "%")
                                )
                                set_contest_result_status_item(region, access, this)

                            });

                        });

                        resolve(true)
                    }else{
                        reject({status: false, msg: "No hay datos disponibles en este momento."})
                    }
                })
            }
        })
    }
    const contest_result_dataTable = ()=>{
        if($('#dataTable')){
            fill_contest_result_selects()
                .then((titles)=>{

                })
            set_contest_result_status()
        }
    }

    const dataTable_loader = ()=>{
        if($('#dataTable') && $('#dataTable').attr('data-source')){
            switch ($('#dataTable').attr('data-source')) {
                case "ordered_scales":
                    ordered_scales_dataTable();
                    break;
                case "contest_result":
                    contest_result_dataTable();
                    break;
            }
        }
    }
    dataTable_loader();
});
