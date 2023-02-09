$(document).ready(function() {

	$("input:visible:not([readonly]):eq(0)").focus();

	$("form").keydown(function(event){
		if(event.keyCode == 13) {
			event.preventDefault();
			return false;
		}
	});
	
	initMenu();
	
	$('.datatable').each(function() {
		$table = $(this);
		ordering = 'asc';
		if($table.attr('data-ordering') == 'desc') {
			ordering = 'desc';
		}
		ordering_col = 0;
		if($table.attr('data-ordering-col') && $table.attr('data-ordering-col').length != 0) {
			ordering_col = $table.attr('data-ordering-col');
		}
		paging = true;
		if($table.attr('data-paging') == 'false') {
			paging = false;
		}
		searching = true;
		if($table.attr('data-searching') == 'false') {
			searching = false;
		}
		info = true;
		if($table.attr('data-info') == 'false') {
			info = false;
		}
		var columnDefs = [];
		$table.find("th").each(function(index) {
			if($(this).attr('data-raw-type')=='int') {
				columnDefs.push({ "type": "num", "targets": index });
			} else if($(this).attr('data-raw-type')=='datetime') {
				columnDefs.push({
					targets: index,
					"render": {
						"display": function (data, type, row, meta) {
							return data;
						},
						"sort": function (data, type, row, meta) {
							return moment(data, 'H:mm:ss DD-MM-YYYY').format('YYYYMMDDHmmss') * 1;
						},
					}
				});
			} else if($(this).attr('data-raw-type')=='date') {
				columnDefs.push({
					targets: index,
					"render": {
						"display": function (data, type, row, meta) {
							return data;
						},
						"sort": function (data, type, row, meta) {
							return moment(data, 'DD-MM-YYYY').format('YYYYMMDD') * 1;
						},
					}
				});
			}
		});
		rowReorder = false;
		if($table.attr('data-row-reorder')) {
			rowReorder = true;
		}
		pageLength = 50;
		if($table.attr('data-page-length') && $table.attr('data-page-length').length != 0) {
			pageLength = $table.attr('data-page-length');
		}
		zeroRecords = "No se encontraron registros";
		if($table.attr('data-zeroRecords') && $table.attr('data-zeroRecords').length != 0) {
			zeroRecords = $table.attr('data-zeroRecords');
		}
		var table = $table.DataTable({
			"order": [[ ordering_col, ordering ]],
			"columnDefs": columnDefs,
			"paging": paging,
			"rowReorder": rowReorder,
			"lengthChange": true,
			"searching": searching,
			"ordering": false,
			"info": info,
			"autoWidth": false,
			"pageLength": pageLength,
			"language": {
				"lengthMenu": "Cantidad de registros por página: _MENU_",
				"zeroRecords": zeroRecords,
				"info": "Página _PAGE_ de _PAGES_",
				"infoEmpty": "Sin resultados",
				"infoFiltered": "(Búsqueda entre _MAX_ registros totales)",
				"search": "Buscar",
				"paginate": {
					"previous": "Anterior",
					"next": "Siguiente"
				}
			}
	    });

		if(rowReorder) {
		    table.on('row-reorder', function (e, diff, edit) {
		        var result = Array();
		        for (var i=0, ien=diff.length ; i<ien ; i++) {
		        	//obtengo el id del registro
		            var id = $(table.row( diff[i].node ).nodes()).attr("data-id");
		            //obtengo el nuevo orden
		            var newOrder = diff[i].newData;
		            //guardo el resultado
		 			result.push({"id":id, "orden":newOrder});
		        }
				var all = Array();
				//recorro las filas y guardo todos los ids
				table.rows().nodes().each(function (node) {
					all.push($(node).attr("data-id"));
				});

				showLoading();
				$.ajax({
					type: "POST",
					url: base_url + "/api/" + $table.attr('data-row-reorder') + "/reorder",
					data: JSON.stringify({ 'diff':result, 'all':all }),
					contentType: 'application/json',
					success: function(response){
						//recorro las filas
						table.rows().data().each(function (row, index) {
							//si la numeración no es consecutiva
							if(row[0] != (index + 1)) {
								//refreso la página
								window.location.href = window.location.href;
							}
						});
						hideLoading();
					},
					error: function(xhr, ajaxOptions, thrownError) {
						hideLoading();
					}
				});
		    });
		}
    });

	initPlugins();
	disableMouseScrollOnGoogleMaps();
	hideLoading();
});

function cleanOnBoardingSteps(steps) {
	steps = JSON.parse(steps);
	steps.forEach(item => {
		item.orphan = (item.orphan == 'true');
		if(item.orphan) {
			delete item.element;
		}
		return item
	});
	return steps;
}
function openOnBoarding(name, force, steps)
{
	// Instance the tour
	var tour = new Tour({
		name: name,
		backdrop: true,
		backdropPadding: 8,
		template: `
		<div class='popover tour'>
			<div class='arrow'></div>
			<div class='popover-container'>
				<h3 class='popover-title'></h3>
				<div class='popover-content'></div>
			</div>
			<div class='popover-navigation'>
				<div class="progress-container"></div>
				<div class='pull-right'>
					<!--button class='btn btn-primary btn-xs' data-role='prev'>« Prev</button-->
					<button class='btn btn-primary btn-xs' data-role='next'>Siguiente</button>
					<button class='btn btn-primary btn-xs' style="display: none;" data-role='end'>Finalizar</button>
				</div>
			</div>
		</div>
		`,
		steps: steps,
		onShown: onShownTour
	});

	// Initialize the tour
	tour.init();

	// Start the tour
	tour.start(force).goTo(0);

	function onShownTour(tour) {
		if(tour._current == (tour._options.steps.length - 1)) {
			$(".popover.tour [data-role='next']").hide();
			$(".popover.tour [data-role='end']").show();
		} else {
			$(".popover.tour [data-role='next']").show();
			$(".popover.tour [data-role='end']").hide();
		}
		
		$(".popover.tour .progress-container").html('');
		for (let index = 0; index < tour._options.steps.length; index++) {
			$(".popover.tour .progress-container").append("<div class='progress-circle'></div>");
		}
		$(".popover.tour .progress-container .progress-circle:eq("+tour._current+")").addClass("current");
		closeTourByBackdropClick(tour);
		tour_scrollTo_step(tour._options.steps[tour._current]);
	}
	function closeTourByBackdropClick(tour) {
		$('.tour-backdrop').on('click', function (e) {
			tour.end();
		});
	}
	function tour_scrollTo_step(step){
		var parent=$("html");
		if(typeof step.element !== 'undefined') {
			var scrollTop=parent.scrollTop() + ($(step.element).position().top - parent.position().top) - (parent.height()/2)+parent.position().top
			parent.scrollTop(scrollTop);
		} else if(parent.scrollTop() != 0) {
			parent.scrollTop(0);
		}
	}
}

function showLoading() {
	$(".loading").fadeIn(500);
}
function hideLoading() {
	$(".loading").fadeOut(1000);
}

function disableMouseScrollOnGoogleMaps() {
	$maps_container = $("iframe[src*=maps]").parents("div:eq(0)");
	$maps = $("iframe[src*=maps]");
	$maps.css("pointer-events", "none"); 
	
	$maps_container.click(function () {
	    $maps.css("pointer-events", "auto");
	});

	$maps_container.mouseleave(function() {
	  $maps.css("pointer-events", "none"); 
	});
}

function initSelect2Plugin() {
    //Initialize Select2 Elements
    $(".select2").each(function() {
    	var tags = $(this).attr("data-tags") == "true";
		var maximumSelectionLength = $(this).attr("data-maximumSelectionLength") > 0 ? $(this).attr("data-maximumSelectionLength") : 0;
    	$(this).select2({
	    	templateResult: formatState,
	    	templateSelection: formatState,
	    	tags: tags,
			maximumSelectionLength: maximumSelectionLength,
	    	tokenSeparators: [',', ';']
	    });
    });

	function formatState (state) {
		if (!state.id) { return state.text; }

		var img = $(state.element).attr('data-image');
		if(img !== undefined && img != '') {
			var $state = $(
				'<span><img src="' + img + '" class="select2-img" /> ' + state.text + '</span>'
			);
		} else {
			var $state = $(
				'<span>' + state.text + '</span>'
			);
		}
		return $state;
	};
}

function initInputMask() {
    //InputMask
    $("[data-mask]").inputmask();
}

function initPlugins() {

	initSelect2Plugin();

	initInputMask();

    //wysiwyg
    $('.wysiwyg').summernote({
    	height: 400,
    	lang: 'es-ES',
	    map: {
	        apiKey: 'AIzaSyC4wQxb6hFjF1nrDEg6ePZcTbmswq89hAE',
	        // This will be used when map is initialized in the dialog.
	        center: {
	          lat: -34.4385685,
	          lng: -58.5963152
	        },
	        zoom: 13
	    },
	    toolbar: [
		    ['style', ['style']],
		    ['fontname', ['color', 'fontname', 'fontsize', 'height']],
		    ['fontstyle', ['bold', 'italic', 'underline', 'clear']],
		    ['para', ['ul', 'ol', 'paragraph']],
			['font', ['strikethrough', 'superscript', 'subscript']],
		    ['table', ['table']],
		    ['insert', ['hr', 'link', 'picture', 'video', 'map']],
		    ['view', ['fullscreen', 'codeview']],
		    ['help', ['help']]
	    ]
    });

	$('.wysiwyg[readonly]').each(function() {
		$(this).summernote('disable');
	});

	//iCheck for checkbox and radio inputs
	$('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
		checkboxClass: 'icheckbox_minimal-blue',
		radioClass: 'iradio_minimal-blue'
	});
	$('input[type="radio"].options_buttons').iCheck({
		checkboxClass: 'icheckbox_minimal-check',
		radioClass: 'iradio_minimal-check'
	});
	$('input[type="radio"].options_buttons').on('ifClicked', function() {
		if($(this).prop('checked')) {
			$(this).iCheck('uncheck');
		}
	});

	$('[data-toggle="popover"]').each(function() {
		$this = $(this);
		if($this.attr("data-html-content") !== undefined) {
		    $this.popover({
		        html : true, 
		        content: function() {
		          return $this.attr("data-html-content");
		        }
		    });
		} else {
			$this.popover();
		}
	});

	initNestable();
	
	initCheckboxPicker();
}

function initCheckboxPicker() {
	$('input[type="checkbox"].checkboxpicker').checkboxpicker({
		style: false,
		defaultClass: 'btn-default',
		disabledCursor: 'not-allowed',
		offClass: 'btn-danger',
		onClass: 'btn-success',
		offLabel: 'No',
		onLabel: 'Si',
		offTitle: false,
		onTitle: false,
	});	
}

function initNestable() {
	var updateOutput = function(e)
    {
        var list   = e.length ? e : $(e.target);
        if(list.attr('data-updateOutput')) {
        	eval(list.attr('data-updateOutput') + '()');
        } else if(list.attr('data-output')) {
        	output = $('[name=' + list.data('output') + ']');
        	output.val(JSON.stringify(list.nestable('serialize')));
    	}
    };

	$('.dd').each(function() {
		if($(this).attr('data-maxDepth')) {
	    	maxDepth = $(this).attr('data-maxDepth');
	    } else {
	    	maxDepth = 5;
	    }

		$(this).nestable({
			autoscroll: true,
			maxDepth: maxDepth
		}).on('change', updateOutput);
	});
}

function initMenu() {
	$('.sidebar-menu li.treeview ul.treeview-menu').each(function() {
		if(!$(this).find('li:not(.treeview)').length) {
			$(this).parents('li.treeview:eq(0)').remove();
		}
	});
}

function openModal(pk_value, modal_id) {
	$pk_value = pk_value;
	$modal = $('#' + modal_id);
	$modal.on('show.bs.modal', function (e) {
		$modal.find(".pk_value").val(pk_value);
		setInterval(function(){ $modal.find("input:visible:not([readonly]):eq(0)").focus(); }, 100);
	});
	$modal.modal('show');
}
function hideModal(modal_id) {
	$modal = $('#' + modal_id);
	$modal.on('hidden.bs.modal', function (e) {
		if($modal.find("form").length) {
			$modal.find("form")[0].reset();
			$modal.find(".message_"+modal_id).html('');
		}
	});
	$modal.modal('hide');
}

function printPage() {
	__print($("section.content"));
}

function __print(element){
	$(element).printElement({
		overrideElementCSS:[
			base_url + '/bootstrap/css/bootstrap.min.css',
			base_url + '/css/font-awesome.min.css',
			base_url + '/css/ionicons.min.css',
			base_url + '/plugins/datatables/dataTables.bootstrap.css',
			base_url + '/plugins/iCheck/all.css',
			base_url + '/plugins/select2/select2.min.css',
			base_url + '/dist/css/AdminLTE.min.css',
			base_url + '/dist/css/skins/skin-yellow.min.css',
			base_url + '/css/style.css',

			base_url + '/plugins/jQuery/jQuery-2.1.4.min.js',
			base_url + '/bootstrap/js/bootstrap.min.js',
			base_url + '/plugins/select2/select2.full.min.js',
			base_url + '/plugins/printElement/jquery.printElement.js',
			base_url + '/plugins/iCheck/icheck.min.js',
			base_url + '/plugins/input-mask/jquery.inputmask.js',
			base_url + '/plugins/input-mask/jquery.inputmask.date.extensions.js',
			base_url + '/plugins/input-mask/jquery.inputmask.extensions.js',
			base_url + '/plugins/datatables/jquery.dataTables.min.js',
			base_url + '/plugins/datatables/dataTables.bootstrap.min.js',
			base_url + '/dist/js/app.min.js',
			base_url + '/js/script.js',
			base_url + '/js/validator.js'
		]
	});
}

function reloadPage(){
	location.href = location.href;
}

function onPageLoad($callback)
{
	if(typeof jQuery != 'undefined') {
		$callback();
	}
	$interval = setInterval(function(){
		if(typeof jQuery != 'undefined') {
			$callback();
			clearInterval($interval);
		}
	}, 500);
}

String.prototype.replaceLatinChar = function(){
 return output = this.replace(/á|é|í|ó|ú|ñ|ä|ë|ï|ö|ü/ig,function (str,offset,s) {
        var str =str=="á"?"a":str=="é"?"e":str=="í"?"i":str=="ó"?"o":str=="ú"?"u":str=="ñ"?"n":str;
       str =str=="Á"?"A":str=="É"?"E":str=="Í"?"I":str=="Ó"?"O":str=="Ú"?"U":str=="Ñ"?"N":str;
       str =str=="Á"?"A":str=="É"?"E":str=="Í"?"I":str=="Ó"?"O":str=="Ú"?"U":str=="Ñ"?"N":str;
       str =str=="ä"?"a":str=="ë"?"e":str=="ï"?"i":str=="ö"?"o":str=="ü"?"u":str;
       str =str=="Ä"?"A":str=="Ë"?"E":str=="Ï"?"I":str=="Ö"?"O":str=="Ü"?"U":str;
        return (str);
        });
}