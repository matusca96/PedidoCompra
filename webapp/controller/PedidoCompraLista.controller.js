sap.ui.define([
	"br/com/idxtecPedidoCompra/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("br.com.idxtecPedidoCompra.controller.PedidoCompraLista", {
		
		onInit: function() {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.getView().byId("tablePedidos").getColumns()[1].setFilterType(new sap.ui.model.odata.type.Date({
                source: { pattern: "yyyy-MM-dd" },  pattern: "dd.MM.yyyy", style: "full"
            }));
		},
		
		onAtualizarLista: function() {
			this.getModel().refresh(true);
		},
		
		onIncluirPedido: function(oEvent) {
			this.getRouter().navTo("pedidoAdd");
		},
		
		onEditarPedido: function(oEvent) {
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