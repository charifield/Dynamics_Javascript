var global_ShowingMessage = false;

function formLoad(executionContext) {
    try{
        setEndDateReadOnly();
        setMonthlyFieldsReadOnly();
        setReadOnly();
        checkCancelledContract();
        setAppropriateFSM();
    }
    catch(e){}
}

function onFormSave(){

    if(Xrm.Page.getAttribute("cwm_inoutofcontract").getValue() === false) {
        return;
    }

    setReadOnly();

    if(Xrm.Page.data.entity.getId() === "")
    {
        setInvoiceDescription();
    }
}

function setAppropriateFSM()
{
    var selfID = Xrm.Page.data.entity.getId();
    if(selfID != "") {
        return;
    }

    //Get FSM from header
    var params = Xrm.Page.context.getQueryStringParameters();
    var parentID = params["_CreateFromId"];

    parentID = parentID.replace('{','').replace('}','');

    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query ="cwm_citywidecontracts(" + parentID + ")?$select=_cwm_contractfsmid_value";

    var req = new XMLHttpRequest();
    req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
    req.onreadystatechange = function () {

        if (this.readyState === 4 && this.response !== null) {

            this.onreadystatechange = null;
            if (this.status === 200)
            {

                var myData = JSON.parse(this.response);
                var lookupValue = new Array();
                lookupValue[0] = new Object();
                lookupValue[0].id = myData["_cwm_contractfsmid_value"];
                lookupValue[0].name = myData["_cwm_contractfsmid_value@OData.Community.Display.V1.FormattedValue"];
                lookupValue[0].entityType = myData["_cwm_contractfsmid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                Xrm.Page.getAttribute("ownerid").setValue(lookupValue);
            }
        }
    };
    req.send();
}

function setReadOnly(){
    try{
        var lineStatus = Xrm.Page.getAttribute("statuscode").getValue();

        var contractLineHoldStartDate = Xrm.Page.getControl("cwm_onholdstartdate");
        var contractLineHoldEndDate = Xrm.Page.getControl("cwm_onholdenddate");

        var serviceItem = Xrm.Page.getControl("cwm_contractlineserviceitem");
        var serviceFrequency = Xrm.Page.getControl("cwm_occurrences");
        var serviceTimesPer = Xrm.Page.getControl("cwm_frequencyunitoftime");

        //If line is Pending
        if(lineStatus === 122190000)
        {
            contractLineHoldStartDate.setDisabled(true);
            contractLineHoldEndDate.setDisabled(true);
            serviceItem.setDisabled(false);
            serviceFrequency.setDisabled(false);
            serviceTimesPer.setDisabled(false);
        }
        else if(lineStatus === 122190002 && global_ShowingMessage === false)
        {
            global_ShowingMessage = true;
            Xrm.Page.ui.clearFormNotification();
            Xrm.Page.ui.setFormNotification('This line is Cancelled. This Record is Read-Only', 'Warning');
            setFormReadOnly();
        }
        else
        {
            contractLineHoldStartDate.setDisabled(false);
            contractLineHoldEndDate.setDisabled(false);
            serviceItem.setDisabled(true);
            serviceFrequency.setDisabled(true);
            serviceTimesPer.setDisabled(true);
        }
    }
    catch(e){}
}

function setFormReadOnly()
{
    Xrm.Page.ui.controls.forEach(function (control, index) {
        var controlType = control.getControlType();
        if (controlType != "iframe" && controlType != "webresource" && controlType != "subgrid") {
            try {
                control.setDisabled(true);
            } catch(e){}
        }
    });
}

function setInvoiceDescription(){
    var serviceItem = Xrm.Page.getAttribute("cwm_contractlineserviceitem").getValue();
    var invoiceDescription = Xrm.Page.getAttribute("cwm_description").getValue();
    if((invoiceDescription == "" || invoiceDescription == null) && serviceItem != null)
    {
        Xrm.Page.getAttribute("cwm_description").setValue(Xrm.Page.getAttribute("cwm_contractlineserviceitem").getValue()[0].name);
    }
}

function setEndDateReadOnly(){
    try{
        var contractLineEndDateField = Xrm.Page.getControl("cwm_enddate");
        var contractLineEndDate = Xrm.Page.getAttribute("cwm_enddate").getValue();

        if(contractLineEndDate !== null && contractLineEndDate !== "undefined")
        {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            if(today >= contractLineEndDate )
            {
                contractLineEndDateField.setDisabled(true);
            }
        }
    }
    catch(e){}
}

function setMonthlyFieldsReadOnly(){
    try{
        var contractLineStartDate = Xrm.Page.getAttribute("cwm_startdate").getValue();

        if(contractLineStartDate !== null && contractLineStartDate !== "undefined")
        {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            if(today >= contractLineStartDate )
            {
                Xrm.Page.getControl("cwm_monthlyamount").setDisabled(true);
                Xrm.Page.getControl("cwm_occurrences").setDisabled(true);
                Xrm.Page.getControl("cwm_frequencyunitoftime").setDisabled(true);
            }
        }
    }
    catch(e){}
}


function checkCancelledContract(data) {

    var xrmPage = Xrm.Page;

    var params = Xrm.Page.context.getQueryStringParameters();
    var parentID = params["_CreateFromId"];
    var selfID = Xrm.Page.data.entity.getId().replace('{','').replace('}','');

    parentID = parentID.replace('{','').replace('}','');

    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query ="cwm_citywidecontracts(" + parentID + ")?$select=statuscode";

    var req = new XMLHttpRequest();
    req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {

        if (this.readyState === 4 && this.response !== null) {

            this.onreadystatechange = null;
            if (this.status === 200)
            {
                var myData = JSON.parse(this.response);

                var contractStatus = myData["statuscode"];
                if(contractStatus != null && contractStatus == 122190005 && selfID === "")
                {
                    xrmPage.ui.setFormNotification('Cancelled Contract', 'ERROR');
                    alert("Cannot create new lines on a Cancelled Contract");
                    xrmPage.ui.close();
                    window.close();
                }
                if(contractStatus != 122190000)
                {
                    Xrm.Page.getControl("cwm_inoutofcontract").setDisabled(true);
                }
                if(contractStatus === 122190005 && global_ShowingMessage === false)
                {
                    global_ShowingMessage = true;
                    Xrm.Page.ui.clearFormNotification();
                    Xrm.Page.ui.setFormNotification('Contract status is Cancelled. This Record is Read-Only', 'Warning');
                    setFormReadOnly();
                }
            }
        }
    };
    req.send();
}

function calculateMonthlyAmount(data){
    var xrmPage = Xrm.Page;
    //debugger;

    var selectedItemReference = xrmPage.getAttribute("cwm_contractlineserviceitem").getValue();
    if(selectedItemReference == null)
        return;

    var calculateFlatMonthlyPrice = false;
    var calculatePriceAs = xrmPage.getAttribute("cwm_calculatepriceas").getValue();

    if(calculatePriceAs == null || calculatePriceAs == "undefined")
    {return;}

    if(calculatePriceAs === 122190001){
        calculateFlatMonthlyPrice = true;
    }

    performMonthlyAmountCalculation(calculateFlatMonthlyPrice);
}

function performMonthlyAmountCalculation(calculateFlatMonthlyPrice){
    var xrmPage = Xrm.Page;

    //MonthlyAmount = Amount X Times Per X (Service Frequency - See breakdown) / 12
    //• Service Frequency Breakdown
    //• Week = 52
    //• Bi-Weekly = 26
    //• Month  = 12
    //• Year = 1

    var amount = xrmPage.getAttribute("cwm_price").getValue();
    var timesPer = xrmPage.getAttribute("cwm_frequencyunitoftime").getValue();
    var inOutContract = xrmPage.getAttribute("cwm_inoutofcontract").getValue();
    var serviceFrequency = xrmPage.getAttribute("cwm_occurrences").getText();
    var timerPerMultiplier = 1;

    //Check if any are Null OR
    if(amount === null || timesPer === null || serviceFrequency === null)
    {
        if(xrmPage.getAttribute("cwm_monthlyamount") !== null) {
            xrmPage.getAttribute("cwm_monthlyamount").setValue(0);
        }
        return;
    }

    //Check if Quote Product is IN or OUT of contract
    if(inOutContract !== null)
    {
        if(inOutContract === false)
        {
            if(xrmPage.getAttribute("cwm_monthlyamount") !== null){
                xrmPage.getAttribute("cwm_monthlyamount").setValue(0);
            }
            return;
        }
    }
    else
    {
        return;
    }

    switch(timesPer) {
        case 122190000:
            timerPerMultiplier = 52;
            break;
        case 122190001:
            timerPerMultiplier = 26;
            break;
        case 122190002:
            timerPerMultiplier = 12;
            break;
        case 122190003:
            timerPerMultiplier = 1;
            break;
        case 122190004:
            timerPerMultiplier = 0;
            break;
    }

    var monthlyAmount = (amount * serviceFrequency * timerPerMultiplier) / 12;

    if(calculateFlatMonthlyPrice != null)
    {
        if(calculateFlatMonthlyPrice)
        {
            xrmPage.getAttribute("cwm_monthlyamount").setValue(amount);
            return;
        }
    }

    if(xrmPage.getAttribute("cwm_monthlyamount") !== null)
    {
        xrmPage.getAttribute("cwm_monthlyamount").setValue(monthlyAmount);
    }
}

function populateServiceFrequency(data) {

    var xrmPage = Xrm.Page;

    //Get times per year
    var timesPerYearField = xrmPage.getControl("cwm_frequencyunitoftime");
    var timesPerYearOptions = timesPerYearField.getOptions();

    //Get Service Frequency
    var serviceFrequencyField = xrmPage.getControl("cwm_occurrences");
    var serviceFrequencyOptions = serviceFrequencyField.getOptions();

    //Get currently selected Values
    var selectedTimesPerYear = xrmPage.getAttribute("cwm_frequencyunitoftime").getValue();
    var selectedFrequency = xrmPage.getAttribute("cwm_occurrences").getValue();

    //Clear all items
    serviceFrequencyField.clearOptions();

    //List of available options
    var options = [{value : 122190000, text : "1"},
        {value : 122190001, text : "2"},
        {value : 122190002, text : "3"},
        {value : 122190003, text : "4"},
        {value : 122190004, text : "5"},
        {value : 122190005, text : "6"},
        {value : 122190006, text : "7"},
        {value : 122190007, text : "8"},
        {value : 122190008, text : "9"},
        {value : 122190009, text : "10"},
        {value : 122190010, text : "11"},
        {value : 122190011, text : "12"}];


    for(var i = 0; i < options.length; i++)
        serviceFrequencyField.addOption(options[i]);

    //Disable Frequency if time is blank
    if(selectedTimesPerYear == null)
    {
        serviceFrequencyField.setDisabled(true);
        return;
    }
    else
    {
        xrmPage.getAttribute("cwm_occurrences").setValue(selectedFrequency);
    }

    serviceFrequencyField.setDisabled(false);
    var frequencyCount = 12;

    switch(selectedTimesPerYear) {
        case 122190000:
            frequencyCount = 7;
            break;
        case 122190001:
            frequencyCount = 1;
            break;
        case 122190002:
            frequencyCount = 4;
            break;
        case 122190003:
            frequencyCount = 12;
            break;
        case 122190004:
            frequencyCount = 1;
            serviceFrequencyField.setDisabled(true);
            xrmPage.getAttribute("cwm_occurrences").setValue(122190000);
            break;
    }


    //Add Relevant items
    for(var i = 0; i < options.length; i++)
    {
        if(i >= frequencyCount)
            serviceFrequencyField.removeOption(options[i].value);
    }
}

function checkServiceItem(){
    var xrmPage = Xrm.Page;

    var params = Xrm.Page.context.getQueryStringParameters();
    var parentID = params["_CreateFromId"];
    var selfID = Xrm.Page.data.entity.getId();
    var serviceItem = "";
    Xrm.Page.ui.clearFormNotification('');
    Xrm.Page.ui.clearFormNotification('100');


    //Ignore if not creating a brand new line
    if(selfID != "")
        return;

    //Check for service item
    if(xrmPage.getAttribute("cwm_contractlineserviceitem").getValue() != null && xrmPage.getAttribute("cwm_contractlineserviceitem").getValue() != undefined) {
        serviceItem = xrmPage.getAttribute("cwm_contractlineserviceitem").getValue()[0].id.replace('{','').replace('}','').toLowerCase();
    }
    else
    {
        return;
    }

    if ((parentID === null || parentID === undefined) && xrmPage.getAttribute("quoteid") != null) {
        parentID = xrmPage.getAttribute("quoteid").getValue()[0].id;
        if (parentID === null || parentID === undefined) {
            return;
        }
    }

    parentID = parentID.replace('{','').replace('}','');

    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query ="cwm_citywidecontractlines?$select=statuscode,_cwm_contractlineserviceitem_value,_cwm_contractid_value&$filter=_cwm_contractid_value eq " + parentID;
    var req = new XMLHttpRequest();
    req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {

        if (this.readyState === 4 && this.response !== null) {

            this.onreadystatechange = null;
            if (this.status === 200)
            {
                //debugger;
                var myData = JSON.parse(this.response);
                myData.value.forEach(function(line) {
                    var lineStatusCode = line["statuscode"];
                    var lineServiceItem = line["_cwm_contractlineserviceitem_value"];

                    if(lineStatusCode == 122190001 && lineServiceItem == serviceItem)
                    {
                        Xrm.Page.ui.setFormNotification('NOTE: The Service Item you selected already exists on another On-Hold Contract Line', 'WARNING', '100');
                    }
                });
            }
        }
    };
    req.send();
}

// This method will set the value for the Calculate Price As field when the Service Item field changes
// It will query the BC Item entity and see if the selected service item has the cwm_calculateflatmonthlyprice = true
// If so, then set the value to Monthly otherwise set it to Per Occurrence
function populateCalculatePriceAsOnChange(executionContext){
    //debugger;
    var xrmPage = Xrm.Page;

    var contractLineId = xrmPage.data.entity.getId();
    // Only populate if this is a new Quote Product record
    if(contractLineId !== "")
        return;

    var serviceItem = xrmPage.getAttribute("cwm_contractlineserviceitem").getValue();
    if(serviceItem === null || serviceItem === undefined)
        return;

    var serviceItemId = serviceItem[0].id.replace('{','').replace('}','').replace('"','');

    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query = "cwm_bcitems(" + serviceItemId + ")?$select=cwm_bcitemnumber,cwm_name,cwm_bcdescription,cwm_calculateflatmonthlyprice";

    var req = new XMLHttpRequest();
    req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {

        if (this.readyState === 4 && this.response !== null) {

            this.onreadystatechange = null;
            if (this.status === 200)
            {
                //debugger;
                try{
                    var myData = JSON.parse(this.response);
                    var lookupValue = new Array();
                    lookupValue[0] = new Object();
                    lookupValue[0].id = myData.cwm_bcitemid;
                    lookupValue[0].name = myData.cwm_name;
                    lookupValue[0].description = myData.cwm_bcdescription;
                    lookupValue[0].itemNumber =  myData.cwm_bcitemnumber;
                    lookupValue[0].entityType = "cwm_bcitem";
                    lookupValue[0].calculateflatmonthlyprice = myData.cwm_calculateflatmonthlyprice;
                    if (lookupValue[0].id != null){
                        if(lookupValue[0].calculateflatmonthlyprice === true){
                            xrmPage.getAttribute("cwm_calculatepriceas").setValue(122190001);
                        }
                        else{
                            xrmPage.getAttribute("cwm_calculatepriceas").setValue(122190000);
                        }
                    }
                }
                catch (error)
                {
                    console.log(error);
                }
            }
        }
    };
    req.send();
}