sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function(Controller, History) {
	"use strict";
	
	return Controller.extend("BaseController",{
		
		getModel: function(sModel){
			return this.getOwnerComponent().getModel(sModel);
		},
		
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		}
	
	});
});