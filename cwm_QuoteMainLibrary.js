
function onFormLoad(data) {
	try
	{
		//Register Grid Load Event to function
		var quoteProductsGrid = Xrm.Page.getControl("QuotedServices");
		quoteProductsGrid.addOnLoad(checkExpertlogixStatus);
		quoteProductsGrid.addOnLoad(expertlogixStatusChanged);
		quoteProductsGrid.addOnLoad(checkUsingBC);
		
		checkUsingBC();
		checkQuoteStatus();

		// checkExpertlogixStatus();
		//expertlogixStatusChanged();
	}
	catch (error)
	{
		console.log(error);
	}
}

function onFormSave(data) {
	try
	{
		checkUsingBC();

		// checkExpertlogixStatus();
		//expertlogixStatusChanged();
	}
	catch (error)
	{
		console.log(error);
	}
}


function checkUsingBC()
{
	var selfID = Xrm.Page.data.entity.getId();
	
	//Check if UsingBC
	var userID = Xrm.Page.getAttribute("ownerid").getValue()[0].id.replace('{','').replace('}','');
    //var userID = Xrm.Page.context.getUserId().replace('{','').replace('}','');
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query2 ="systemusers(" + userID + ")?$select=_businessunitid_value";

    var req2 = new XMLHttpRequest();
    req2.open("GET", serverURL + "/api/data/v8.2/" + Query2, true);
    req2.setRequestHeader("Accept", "application/json");
    req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req2.setRequestHeader("OData-MaxVersion", "4.0");
    req2.setRequestHeader("OData-Version", "4.0");
    req2.onreadystatechange = function () {

        if (this.readyState === 4 && this.response !== null) {

            this.onreadystatechange = null;
            if (this.status === 200)
            {
                try{
                    var mySystemUserData = JSON.parse(this.response);

                    //Get Defaults from Business Unit
                    var Query3 ="businessunits(" + mySystemUserData["_businessunitid_value"] + ")?$select=cwm_usingbc";

                    var req3 = new XMLHttpRequest();
                    req3.open("GET", serverURL + "/api/data/v8.2/" + Query3, true);
                    req3.setRequestHeader("Accept", "application/json");
                    req3.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    req3.setRequestHeader("OData-MaxVersion", "4.0");
                    req3.setRequestHeader("OData-Version", "4.0");
                    req3.onreadystatechange = function () {
                        if (this.readyState === 4 && this.response !== null) {
							var myBuData = JSON.parse(this.response);
							var expertlogixCheckboxValue = Xrm.Page.getAttribute("cwm_experlogixquote").getValue();
							
                            //Set Experlogix to true if user BU is Not using BC
                            if((myBuData["cwm_usingbc"] === false || myBuData["cwm_usingbc"] === null)){
								Xrm.Page.getControl("cwm_experlogixquote").setDisabled(true);
								if(expertlogixCheckboxValue === false) {
									Xrm.Page.getAttribute("cwm_experlogixquote").setValue(true);
									expertlogixStatusChanged();
								}
							}
							else
							{
								//If they are using BC, check the appropriate Experlogix Status
								checkExpertlogixStatus();
							}
                        }
                    }
                    req3.send();
                }
                catch (error)
                {
                    console.log(error);
                }
            }
        }
    };
    req2.send();
}


function checkExpertlogixStatus(data) {
	
	var xrmPage = Xrm.Page;

    var quoteID = xrmPage.data.entity.getId();
    if(quoteID === null)
    	return;

    quoteID = quoteID.replace('{','').replace('}','');

    var serverURL = Xrm.Page.context.getClientUrl();
    var Query =	"quotedetails?$select=_createdonbehalfby_value,_modifiedonbehalfby_value,_quoteid_value" +
            	"&$filter=_quoteid_value eq " + quoteID +
            	"&$top=5";

	var req = new XMLHttpRequest();
	req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
	req.setRequestHeader("Accept", "application/json");
	req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
	req.setRequestHeader("OData-MaxVersion", "4.0");
	req.setRequestHeader("OData-Version", "4.0");
	req.setRequestHeader("Prefer", "odata.include-annotations=OData.Community.Display.V1.FormattedValue");
	req.onreadystatechange = function () {
		
		if (this.readyState === 4 && this.response !== null) {
			this.onreadystatechange = null;
			if (this.status === 200)
       		{
				var myData = JSON.parse(this.response);
				var expertlogixCheckbox = xrmPage.getControl("cwm_experlogixquote");
				var expertlogixCheckboxValue = xrmPage.getAttribute("cwm_experlogixquote").getValue();

				//Disable Box if Line Items Exist
				if(myData.value.length <= 0)
				{
					expertlogixCheckbox.setDisabled(false);
				}
				else
				{
					expertlogixCheckbox.setDisabled(true);
					
					//Loop through quote Line Items
				    for(var i = 0; i < myData.value.length; i++)
				    {
				    	var createdBy = myData.value[i]["_createdonbehalfby_value@OData.Community.Display.V1.FormattedValue"];
				    	var modifiedBy = myData.value[i]["_modifiedonbehalfby_value@OData.Community.Display.V1.FormattedValue"];

						//If Quote lines exist
						if(createdBy != null || modifiedBy != null)
						{
							var newValue = -1;
							
							//If Expertlogix made / modified this Line Item
							if(createdBy.toLowerCase().indexOf("experlogix") !== -1 || modifiedBy.toLowerCase().indexOf("experlogix") !== -1)
								newValue = 1;
							
							//If a User made and modified this line item
							else
								newValue = 0;

							//Patch if value is different from current state
							if(newValue != -1 && newValue != expertlogixCheckboxValue)
							{
								xrmPage.getAttribute("cwm_experlogixquote").setValue(newValue);
								expertlogixStatusChanged();

								//Patch Record if not the same
								var req2 = new XMLHttpRequest();
								req2.open("PATCH", serverURL + "/api/data/v8.2/quotes(" + quoteID + ")", true);
								req2.setRequestHeader("Accept", "application/json");
								req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
								req2.setRequestHeader("OData-MaxVersion", "4.0");
								req2.setRequestHeader("OData-Version", "4.0");
								var patchBody = JSON.stringify({
									"cwm_experlogixquote": newValue,
								});
								req2.send(patchBody);
								break;
							}
						}
					}
				}
			}
		} 
	};
	req.send();
}

function checkQuoteStatus() {
	var xrmPage = Xrm.Page;

	var quoteID = xrmPage.data.entity.getId();
    if(quoteID === null)
    	return;

	quoteID = quoteID.replace('{','').replace('}','');
	
	var statusCode = Xrm.Page.getAttribute("statuscode").getValue();
	if(statusCode != null && statusCode === 100000000) {

		//Check if quote has contracts
		var serverURL = Xrm.Page.context.getClientUrl();
		var Query =	"cwm_citywidecontracts?$select=_cwm_quote_value,statuscode&$filter=_cwm_quote_value eq " + quoteID;

		var req = new XMLHttpRequest();
		req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Prefer", "odata.include-annotations=OData.Community.Display.V1.FormattedValue");
		req.onreadystatechange = function () {
			
			if (this.readyState === 4 && this.response !== null) {
				this.onreadystatechange = null;
				if (this.status === 200)
	       		{
					var myData = JSON.parse(this.response);
					if(myData.value != null && myData.value.length > 0) {
						try
						{
							myData.value.forEach(function(element) {
								if (element["statuscode"] != null && element["statuscode"] != 122190005) {
									Xrm.Page.ui.clearFormNotification();
									Xrm.Page.ui.setFormNotification('Warning: This quote already has a contract associated to it.  All changes should be updated on the contract', 'INFO');
									return;
								}
							});
						}
						catch (error)
						{
							console.log(error);
						}
					}
				}
			}
		};
		req.send();
	}
}


function expertlogixStatusChanged() {

	var xrmPage = Xrm.Page;

	//Refresh Ribbon Chnages
	xrmPage.ui.refreshRibbon();

	//Unlock Bid Details if Manual
	var expertlogixCheckboxValue = xrmPage.getAttribute("cwm_experlogixquote").getValue();
	if(expertlogixCheckboxValue === false)
	{
		xrmPage.getControl("totallineitemamount").setDisabled(false);
		xrmPage.getControl("totalamount").setDisabled(false);
		xrmPage.getControl("cwm_priceperhourdays").setDisabled(false);
		xrmPage.getControl("cwm_priceperhournights").setDisabled(false);
		xrmPage.getControl("cwm_pricepersfnights").setDisabled(false);

		xrmPage.getControl("cwm_squarefeet").setDisabled(false);
		xrmPage.getControl("cwm_baseprice").setDisabled(false);
		xrmPage.getControl("cwm_asoccupiedsquarefootage").setDisabled(false);
		xrmPage.getControl("cwm_pricepersfdays").setDisabled(false);

		xrmPage.getControl("cwm_overallcleaningrateasoccupied").setDisabled(false);
		xrmPage.getControl("cwm_vacancycredit").setDisabled(false);
		xrmPage.getControl("cwm_vacancysquarefeet").setDisabled(false);
	}
	else
	{
		xrmPage.getControl("totallineitemamount").setDisabled(true);
		xrmPage.getControl("totalamount").setDisabled(true);
		xrmPage.getControl("cwm_priceperhourdays").setDisabled(true);
		xrmPage.getControl("cwm_priceperhournights").setDisabled(true);
		xrmPage.getControl("cwm_pricepersfnights").setDisabled(true);

		xrmPage.getControl("cwm_squarefeet").setDisabled(true);
		xrmPage.getControl("cwm_baseprice").setDisabled(true);
		xrmPage.getControl("cwm_asoccupiedsquarefootage").setDisabled(true);
		xrmPage.getControl("cwm_pricepersfdays").setDisabled(true);

		xrmPage.getControl("cwm_overallcleaningrateasoccupied").setDisabled(true);
		xrmPage.getControl("cwm_vacancycredit").setDisabled(true);
		xrmPage.getControl("cwm_vacancysquarefeet").setDisabled(true);
	}

	//Don't save form while user is filling out the rest of the form
	var quoteID = xrmPage.data.entity.getId();
	if(quoteID === null || quoteID === "")
		return;
}
