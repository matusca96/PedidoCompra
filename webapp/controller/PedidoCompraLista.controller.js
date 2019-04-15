sap.ui.define([
	"br/com/idxtecPedidoCompra/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"br/com/idxtecPedidoCompra/services/Session"
], function(BaseController, Filter, FilterOperator, Session) {
	"use strict";

	return BaseController.extend("br.com.idxtecPedidoCompra.controller.PedidoCompraLista", {
		
		onInit: function() {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.getView().byId("tablePedidos").getColumns()[1].setFilterType(new sap.ui.model.odata.type.Date({
                source: { pattern: "yyyy-MM-dd" },  pattern: "dd.MM.yyyy", style: "full"
            }));
            
            this.getModel().attachMetadataLoaded(function(){
				var oFilter = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
				var oView = this.getView();
				var oTable = oView.byId("tablePedidos");
				var oColumn = oView.byId("columnNumero");
				
				oTable.sort(oColumn);
				oView.byId("tablePedidos").getBinding("rows").filter(oFilter, "Application");
			});
		},
		
		filtraPedido: function(oEvent){
			var sQuery = oEvent.getParameter("query");
			var oFilter1 = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oFilter2 = new Filter("Numero", FilterOperator.Contains, sQuery);
			
			var aFilters = [
				oFilter1,
				oFilter2
			];

			this.getView().byId("tablePedidos").getBinding("rows").filter(aFilters, "Application");
		},
		
		onRefresh: function() {
			this.getModel().refresh(true);
			this.getView().byId("tablePedidos").clearSelection();
		},
		
		onIncluir: function(oEvent) {
			this.getRouter().navTo("pedidoAdd");
		},
		
		onEditar: function(oEvent) {
			var oTable = this.getView().byId("tablePedidos");
			var nIndex = oTable.getSelectedIndex();
			
			if (nIndex > -1) {
				var oContext = oTable.getContextByIndex(nIndex);
				this.getRouter().navTo("pedidoEdit",{
					pedido: oContext.getProperty("Numero")		
				});
			} else {
				sap.m.MessageBox.warning("Selecione um registro na tabela.");
			}
		}
		
	});

});