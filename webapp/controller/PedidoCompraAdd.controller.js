sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"br/com/idxtecPedidoCompra/helpers/ParceiroNegocioHelpDialog",
	"br/com/idxtecPedidoCompra/helpers/ProdutoHelpDialog",
	"sap/ui/core/routing/History",
	"br/com/idxtecPedidoCompra/services/Session"
], function(Controller, MessageBox, JSONModel, ParceiroNegocioHelpDialog, ProdutoHelpDialog, History, Session) {
	"use strict";

	return Controller.extend("br.com.idxtecPedidoCompra.controller.PedidoCompraAdd", {
		onInit: function(){
			var oRouter = this.getOwnerComponent().getRouter();

			oRouter.getRoute("pedidoAdd").attachMatched(this._routerMatch, this);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.showFormFragment("PedidoCompraCampos");
		},
		
		getModel : function(sModel) {
			return this.getOwnerComponent().getModel(sModel);	
		},
		
		parceiroNegocioReceived: function() {
			this.getView().byId("cliente").setSelectedKey(this.getModel("pedido").getProperty("/Cliente"));
		},
		
		produtoReceived: function() {
			this.getView().byId("produto").setSelectedKey(this.getModel("itens").getProperty("/Produto"));
		},
		
		handleSearchParceiro: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ParceiroNegocioHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchProduto: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ProdutoHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		_routerMatch: function() {
			var oPedidoModel = new JSONModel();
			var oPedidoItensModel = new JSONModel();
			var oPedido = {
				Numero: "00000000",
				Cliente: 0,
				Emissao: new Date(),
				Observacoes: "",
				"Empresa" : Session.get("EMPRESA_ID"),
				"Usuario": Session.get("USUARIO_ID"),
				"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
				"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
			};
			
			oPedidoModel.setData(oPedido);
			oPedidoItensModel.setData([]);
			
			this.getView().setModel(oPedidoModel,"pedido");
			this.getView().setModel(oPedidoItensModel,"itens");
			
			this.getView().byId("cliente").setValue(null);
		},
		
		onInserirLinha: function(oEvent) {
			var oPedidoModel = this.getView().getModel("pedido");
			var oPedidoItensModel = this.getView().getModel("itens");
			var oItems = oPedidoItensModel.getProperty("/");
			var oNovoItem = oItems.concat({
	    		Id: 0,
				Pedido : oPedidoModel.getProperty("/Numero"),
				Produto: 0,
				Quantidade: 1,
				ValorUnitario: 0,
				Total: 0,
				"Empresa" : Session.get("EMPRESA_ID"),
				"Usuario": Session.get("USUARIO_ID"),
				"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
				"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
	    	});
			this.getView().getModel("itens").setProperty("/", oNovoItem);
			
			$(window).bind("beforeunload", function(e) {
				var message = "Teste";
				e.returnValue = message;
				return message;
		    });
		},
		
		onRemoverLinha: function(oEvent){
			var oPedidoItensModel = this.getView().getModel("itens");
			
			var oTable = this.getView().byId("tablePedido");
			//var oTable = sap.ui.getCore().byId("tablePedido");
			
			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getModel();
			
			if (nIndex > -1) {
				var oContext = oTable.getContextByIndex(nIndex);
				var oDados = oContext.getObject();
				var oItems = oPedidoItensModel.getProperty("/");
				
				oItems.splice(nIndex,1);
				oPedidoItensModel.setProperty("/", oItems);
				oTable.clearSelection();
			} else {
				sap.m.MessageBox.warning("Selecione um item na tabela!");
			}
		},
		
		onCalculaTotal: function(oEvent) {
			var oPedidoItensModel = this.getView().getModel("itens");
			var aItems = oPedidoItensModel.getData();
			
			for( var i = 0; i < aItems.length; i++) {
				aItems[i].Total = aItems[i].Quantidade * aItems[i].ValorUnitario;                                                  
			}
	
			oPedidoItensModel.refresh(true);
			this.totalPedido();
		},
		
		totalPedido: function() {
			var oPedidoItensModel = this.getView().getModel("itens");
			var aItems = oPedidoItensModel.getData();
			var nTotal = 0;
			
			for( var i = 0; i < aItems.length; i++) {
				nTotal += aItems[i].total;
			}
			
			this.getModel("pedido").setProperty("/total", nTotal);
			
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
			
			
			oModel.setDeferredGroups(["upd"]);
			
			
			oDadosPedido.ParceiroNegocioDetails = { __metadata: { uri: "/ParceiroNegocios(" + oDadosPedido.Cliente + ")"}};
			
			oModel.create("/PedidoVendas", oDadosPedido,{
				groupId: "upd",
				success: function(oData){
					// talves seja necessario para pegar o id do objeto
				}
			});
			
			for ( var i = 0; i < oDadosItens.length; i++) {
				oDadosItens[i].ProdutoDetails = {
					__metadata: { uri: "/Produtos(" + oDadosItens[i].Produto + ")" }
				};
				oDadosItens[i].PedidoVendaDetails = {
					__metadata: { uri: "/PedidoVendas('" + oDadosPedido.Numero + "')" } 
				};
				
				oModel.create("/PedidoVendaItenss", oDadosItens[i], { 
						groupId: "upd" 
				});
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
			var oPage = this.getView().byId("pagePedidoAdd");
			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName));
		},
		
		fechar: function(oEvent) {
			var oTable = this.getView().byId("tablePedido");
			var that = this;
			console.log(oTable.getBinding().getLength());
			if(oTable.getBinding().getLength() >= 1){
				sap.m.MessageBox.confirm("Todas as informações serão descartadas, deseja continuar?", {
					onClose: function(sResposta){
						if(sResposta === "OK"){
							that.navBack();
						}
					}
				});
			} else{
				this.navBack();
			}
		}
	});
});