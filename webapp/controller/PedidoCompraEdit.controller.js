sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"br/com/idxtecPedidoCompra/controller/ParceiroNegocioHelpDialog",
	"br/com/idxtecPedidoCompra/controller/ProdutoHelpDialog",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History"
], function(Controller, MessageBox, JSONModel, ParceiroNegocioHelpDialog, ProdutoHelpDialog, FilterOperator, History) {
	"use strict";
	
	return Controller.extend("br.com.idxtecPedidoCompra.controller.PedidoCompraEdit", {
		onInit: function(){
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("pedidoEdit").attachMatched(this._routerMatch, this);
			
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.showFormFragment("PedidoCompraCampos");
		},
	
		getModel : function(sModel) {
			return this.getOwnerComponent().getModel(sModel);	
		},
		
		parceiroNegocioReceived: function(oEvent) {
			sap.ui.getCore().byId("cliente").setSelectedKey(this.getModel("pedido").getProperty("/Cliente").toString());
		},
		
		produtoReceived: function() {
			sap.ui.getCore().byId("produto").setSelectedKey(this.getModel("itens").getProperty("/Produto"));
		},
		
		handleSearchParceiro: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ParceiroNegocioHelpDialog.handleValueHelp(this.getView(), sInputId)                         ;
		},
		
		handleSearchProduto: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ProdutoHelpDialog.handleValueHelp(this.getView(), sInputId);
		},
		
		_routerMatch: function(oEvent) {
			var sPedido = oEvent.getParameter("arguments").pedido;
			var oPedidoModel = new JSONModel();
			var oPedidoItensModel = new JSONModel();
			
			var oModel = this.getModel();
			oModel.setDeferredGroups(["upd"]);  // habilita grupo para transacacao
			oModel.read(`/PedidoVendas('${sPedido}')`, {  //estou usando interpolacao
				success: function(oPedido){
					oPedidoModel.setData(oPedido);
				}
			});
			
			oModel.read("/PedidoVendaItenss",{
				filters: [
					new sap.ui.model.Filter({
						path: 'Pedido',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sPedido
					})
				],
			
				success: function(oData) {
					oPedidoItensModel.setData(oData.results);
				}
				
			});
			
			this.getView().setModel(oPedidoModel,"pedido");
			this.getView().setModel(oPedidoItensModel,"itens");
		},
		
		onInserirLinha: function(oEvent) {
			var oPedidoModel = this.getView().getModel("pedido");
			var oPedidoItensModel = this.getView().getModel("itens");
			var oItems = oPedidoItensModel.getProperty("/");
			var oNovoItem = {
	    		Id: 0,
				Pedido : oPedidoModel.getProperty("/Numero"),
				Produto: 0,
				Quantidade: 1,
				ValorUnitario: 0,
				Total: 0
	    	};
	    	var oNovoItems = oItems.concat(oNovoItem);
			oPedidoItensModel.setProperty("/", oNovoItems);
			
			$(window).bind("beforeunload", function(e) {
				var message = "Teste";
				e.returnValue = message;
				return message;
		    });
		},
		
		onRemoverLinha: function(oEvent){
			var oPedidoItensModel = this.getView().getModel("itens");
			
			//var oTable = this.getView().byId("tablePedido");
			var oTable = sap.ui.getCore().byId("tablePedido");
			
			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getModel();
			
			if (nIndex > -1) {
				var oContext = oTable.getContextByIndex(nIndex);
				var oDados = oContext.getObject();
				var oItems = oPedidoItensModel.getProperty("/");
				
				if (oDados.Id !== 0) {
					//oModel.remove("/PedidoVendaItenss(" + oDados.Id + ")",{
					oModel.remove(`/PedidoVendaItenss(${oDados.Id})`,{
						groupId: "upd"
					});
				}
				
				oItems.splice(nIndex,1);
				oPedidoItensModel.setProperty("/", oItems);
				oTable.clearSelection();
			} else {
				sap.m.MessageBox.warning("Selecione um item na tabela !");
			}
		},
		
		salvar: function() {
			var that = this;
			var oPedidoModel = this.getView().getModel("pedido");
			var oPedidoItensModel = this.getView().getModel("itens");
			var oModel = this.getModel();
			
			var oDadosPedido = oPedidoModel.getData();
			var oDadosItens = oPedidoItensModel.getData();
			
			if (oDadosItens.length === 0) {
				sap.m.MessageBox.warning("Pedido não tem itens.");
				return;
			}
			
			oDadosPedido.ParceiroNegocioDetails = { __metadata: { uri: `/ParceiroNegocios(${oDadosPedido.Cliente})`}};
			
			oModel.update(`/PedidoVendas('${oDadosPedido.Numero}')`, oDadosPedido,{
				groupId: "upd",
				success: function(oData){
					// talves seja necessario para pegar o id do objeto
				}
			});
			
			
			for ( var i = 0; i < oDadosItens.length; i++) {
				oDadosItens[i].ProdutoDetails = {
					__metadata: { uri: `/Produtos(${oDadosItens[i].Produto})` }
				};
				oDadosItens[i].PedidoVendaDetails = {
					__metadata: { uri: `/PedidoVendas('${oDadosPedido.Numero}')` } 
				};
				
				if (oDadosItens[i].Id === 0) {
					oModel.create("/PedidoVendaItenss", oDadosItens[i], { 
						groupId: "upd" 
					});
				} else {
					oModel.update(`/PedidoVendaItenss(${oDadosItens[i].Id})`, oDadosItens[i], { 
						groupId: "upd" 
					});
				}
			}
			
			oModel.submitChanges({
				groupId: "upd",
				success: function(oResponse) {
					//se a propriedade response não for undefined, temos erro de gravação
					var erro = oResponse.__batchResponses[0].response;
					if (!erro) {
						sap.m.MessageBox.success("Pedido gravado.",{
							onClose: function() {
								that.navBack();
							}
						});
					}
				}
			});
		},
		
		navBack: function(){
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				oRouter.navTo("pedidoLista", {}, true);
			}
		},
		
		_getFormFragment: function (sFragmentName) {
			if (this._formFragment) {
				return this._formFragment;
			}
		
			this._formFragment = sap.ui.xmlfragment(this.getView().getId(),`br.com.idxtecPedidoCompra.view.${sFragmentName}`, this);

			return this._formFragment;
		},

		showFormFragment : function (sFragmentName) {
			var oPage = this.getView().byId("pagePedido");
			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName), 0);
		},
		
		fechar: function(oEvent) {
			this.navBack();
		}
	});
});