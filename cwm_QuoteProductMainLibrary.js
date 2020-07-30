var isExperlogixQuote = false;

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

function checkExpertlogixQuote(data) {
    var xrmPage = Xrm.Page;
    var errorMessageDisplayed = false;

    var params = Xrm.Page.context.getQueryStringParameters();
    var parentID = params["_CreateFromId"];
    var selfID = Xrm.Page.data.entity.getId();
    if ((parentID === null || parentID === undefined) && xrmPage.getAttribute("quoteid") != null) {
        parentID = xrmPage.getAttribute("quoteid").getValue()[0].id;
        if (parentID === null || parentID === undefined) {
            return;
        }
    }

    parentID = parentID.replace('{','').replace('}','');

    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query ="quotes(" + parentID + ")?$select=cwm_experlogixquote,name";

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

                var expertLogix = myData["cwm_experlogixquote"];
                isExperlogixQuote = expertLogix;

                //Display correct quote lookup text
                //debugger;
                var quoteLookupValue = xrmPage.getAttribute("quoteid").getValue();
                quoteLookupValue[0].name = myData["name"];
                xrmPage.getAttribute("quoteid").setValue(quoteLookupValue);

                if(expertLogix != null && expertLogix == true)
                {
                    //Lock fields if Quote is Experlogix
                    if(xrmPage.getAttribute("cwm_quotelinebcitemid").getValue() != null) {
                        xrmPage.getControl("cwm_quotelinebcitemid").setDisabled(true);
                        xrmPage.getControl("cwm_extrachargeamount").setDisabled(true);
                    } else {
                        xrmPage.getAttribute("cwm_quotelinebcitemid").setRequiredLevel("none");
                        xrmPage.getControl("cwm_extrachargeamount").setDisabled(false);
                    }
                    xrmPage.getControl("cwm_frequencyunitoftime").setDisabled(true);
                    xrmPage.getControl("cwm_occurrences").setDisabled(true);
                    xrmPage.getAttribute("cwm_occurrences").setRequiredLevel("none");
                    xrmPage.getControl("cwm_independentcontractorpayamount").setDisabled(true);
                    xrmPage.getControl("cwm_quoteincontract").setDisabled(true);
                    xrmPage.getControl("quantity").setDisabled(true);
                    xrmPage.getControl("cwm_reportgroup").setDisabled(true);
                    xrmPage.getControl("cwm_pricingoption").setDisabled(true);
                    xrmPage.getControl("productdescription").setDisabled(true);
                    xrmPage.getControl("priceperunit").setDisabled(true);
                    xrmPage.getControl("cwm_reportgroup").setDisabled(true);


                    if(errorMessageDisplayed == false)
                    {
                        errorMessageDisplayed = true;

                        //Lock Contract and set based on Extra Charge
                        xrmPage.getControl("cwm_quoteincontract").setDisabled(true);

                        //Return if its a New Line Item
                        if(parentID == null || selfID != "")
                            return;

                        xrmPage.ui.setFormNotification('ExperLogix Quote', 'ERROR');
                        alert("Cannot manually create line items from an ExperLogix Quote");
                        xrmPage.ui.close();
                        window.close();
                    }
                }
                else
                {
                    Xrm.Page.ui.tabs.get("tabBidModuleFields").setDisplayState("collapsed");

                    if(xrmPage.getAttribute("isproductoverridden").getValue() != 1)
                    {
                        //debugger;
                        //Set Defaults  for Write In
                        xrmPage.getAttribute("isproductoverridden").setValue(1);
                        xrmPage.getControl("isproductoverridden").setDisabled(true);

                        xrmPage.getControl("productid").setDisabled(true);
                        xrmPage.getAttribute("productid").setRequiredLevel("none");

                        xrmPage.getControl("ispriceoverridden").setDisabled(true);
                        xrmPage.getAttribute("ispriceoverridden").setValue(1);

                        xrmPage.getAttribute("quantity").setValue(1.000);

                        xrmPage.getAttribute("productdescription").setValue('Manual Quote');
                        xrmPage.getAttribute("productdescription").setRequiredLevel("required");
                        xrmPage.getControl("productdescription").setDisabled(false);

                        xrmPage.getAttribute("uomid").setRequiredLevel("none");

                        xrmPage.getAttribute("priceperunit").setValue(0);
                        xrmPage.getAttribute("priceperunit").setRequiredLevel("required");
                        xrmPage.getControl("priceperunit").setDisabled(false);

                        xrmPage.getControl("cwm_quotelinebcitemid").setFocus();

                        //Populate Default Service Item to JS
                        populateDefaultServiceItem();

                    }
                }
            }
        }
    };
    req.send();


    //Check if UsingBC
    //var userID = Xrm.Page.getAttribute("ownerid").getValue()[0].id.replace('{','').replace('}','');
    var userID = Xrm.Page.context.getUserId().replace('{','').replace('}','');
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

                            //Return if its a New Line Item
                            if(parentID == null || selfID != "")
                                return;

                            //Set Defaults
                            if((myBuData["cwm_usingbc"] === false || myBuData["cwm_usingbc"] === null) && errorMessageDisplayed == false){
                                errorMessageDisplayed = true;
                                alert("Your location does not support the creation of manual line items, you must use Experlogix");
                                xrmPage.ui.close();
                                window.close();
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

function populateDefaultServiceItem(){
    var xrmPage = Xrm.Page;

    var quoteProductID = xrmPage.data.entity.getId();
    if(quoteProductID !== "")
        return;


    //Get Record
    var serverURL = Xrm.Page.context.getClientUrl();
    var Query = "cwm_bcitems?$select=cwm_bcitemnumber,cwm_name,cwm_bcdescription" +
        "&$filter=cwm_name eq 'Managed Janitorial Services'"+
        "&$top=5";

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
                try{
                    var myData = JSON.parse(this.response);
                    var lookupValue = new Array();
                    lookupValue[0] = new Object();
                    lookupValue[0].id = myData.value[0]["cwm_bcitemid"];
                    lookupValue[0].name =  myData.value[0]["cwm_name"];
                    lookupValue[0].entityType = "cwm_bcitem";
                    if (lookupValue[0].id != null)
                    {
                        xrmPage.getAttribute("cwm_quotelinebcitemid").setValue(lookupValue);
                        xrmPage.getAttribute("cwm_frequencyunitoftime").setValue(122190000);
                        xrmPage.getAttribute("cwm_occurrences").setValue(122190004);
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

// This method will set the initial value for the Calculate Price As field
// It will set the default value to Monthly since the default Service Item is Managed Janitorial Service
function populateInitialCalculatePriceAsValue(executionContext){
    var xrmPage = Xrm.Page;

    var quoteProductID = xrmPage.data.entity.getId();
    // Only populate if this is a new Quote Product record
    if(quoteProductID !== "")
        return;
    xrmPage.getAttribute("cwm_calculatepriceas").setValue(122190001);
    xrmPage.getAttribute("cwm_calculatepriceas").setSubmitMode("always");
}

// This method will set the value for the Calculate Price As field when the Service Item field changes
// It will query the BC Item entity and see if the selected service item has the cwm_calculateflatmonthlyprice = true
// If so, then set the value to Monthly otherwise set it to Per Occurrence
function populateCalculatePriceAsOnChange(executionContext){
    //debugger;
    var xrmPage = Xrm.Page;

    var quoteProductID = xrmPage.data.entity.getId();
    // Only populate if this is a new Quote Product record
    if(quoteProductID !== "")
        return;

    var serviceItem = xrmPage.getAttribute("cwm_quotelinebcitemid").getValue();
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

function calculateMonthlyAmount(data){
    try{
        //debugger;
        var xrmPage = Xrm.Page;

        var selectedItemReference = xrmPage.getAttribute("cwm_quotelinebcitemid").getValue();
        if(selectedItemReference == null || selectedItemReference == "undefined")
        {return;}

        var calculateFlatMonthlyPrice = false;
        var calculatePriceAs = xrmPage.getAttribute("cwm_calculatepriceas").getValue();

        if(calculatePriceAs == null || calculatePriceAs == "undefined")
        {return;}

        if(calculatePriceAs === 122190001){
            calculateFlatMonthlyPrice = true;
        }

        performMonthlyAmountCalculation(calculateFlatMonthlyPrice);
    }
    catch
    {
        console.log(error);
    }
}

function performMonthlyAmountCalculation(calculateFlatMonthlyPrice){
    try
    {
        var xrmPage = Xrm.Page;

        //MonthlyAmount = Amount X Times Per X (Service Frequency - See breakdown) / 12
        //• Service Frequency Breakdown
        //• Week = 52
        //• Bi-Weekly = 26
        //• Month  = 12
        //• Year = 1

        var amount = xrmPage.getAttribute("cwm_extrachargeamount").getValue();
        var timesPer = xrmPage.getAttribute("cwm_frequencyunitoftime").getValue();
        var inOutContract = xrmPage.getAttribute("cwm_quoteincontract").getValue();
        var serviceFrequency = xrmPage.getAttribute("cwm_occurrences").getText();
        var timerPerMultiplier = 1;

        //Check if any are Null OR
        if(amount === null || timesPer === null || serviceFrequency === null)
        {
            //xrmPage.getAttribute("baseamount").setValue(0);
            if(xrmPage.getAttribute("cwm_monthlyamount") !== null) {
                xrmPage.getAttribute("extendedamount").setValue(0);
                xrmPage.getAttribute("cwm_monthlyamount").setValue(0);
                if(!isExperlogixQuote) {
                    xrmPage.getAttribute("priceperunit").setValue(0);
                }
            }
            return;
        }

        //Check if Quote Product is IN or OUT of contract
        if(inOutContract !== null)
        {
            if(inOutContract === false)
            {
                xrmPage.getAttribute("cwm_independentcontractorpayamount").setValue(0)
                if(xrmPage.getAttribute("cwm_monthlyamount") !== null){
                    xrmPage.getAttribute("extendedamount").setValue(0);
                    xrmPage.getAttribute("cwm_monthlyamount").setValue(0);
                    if(!isExperlogixQuote) {
                        xrmPage.getAttribute("priceperunit").setValue(0);
                    }
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

        //Check for Janitorial Services
        if(calculateFlatMonthlyPrice != null)
        {
            if(calculateFlatMonthlyPrice)
            {
                xrmPage.getAttribute("extendedamount").setValue(amount);
                xrmPage.getAttribute("cwm_monthlyamount").setValue(amount);
                if(!isExperlogixQuote) {
                    xrmPage.getAttribute("priceperunit").setValue(amount);
                }
                calculateIcPayAmount();
                return;
            }
        }

        if(xrmPage.getAttribute("cwm_monthlyamount") !== null)
        {
            xrmPage.getAttribute("extendedamount").setValue(monthlyAmount);
            xrmPage.getAttribute("cwm_monthlyamount").setValue(monthlyAmount);
            if(!isExperlogixQuote) {
                xrmPage.getAttribute("priceperunit").setValue(monthlyAmount);
            }
            calculateIcPayAmount();
        }
    }
    catch
    {
        console.log(error);
    }
}

function calculateIcPayAmount(){
    var xrmPage = Xrm.Page;
    var amount = xrmPage.getAttribute("cwm_monthlyamount").getValue();
    var icPayAmount = xrmPage.getAttribute("cwm_independentcontractorpayamount").getValue();
    var inOutContract = xrmPage.getAttribute("cwm_quoteincontract").getValue();

    //Check IC Pay Amount has data then return
    if(icPayAmount != undefined && icPayAmount != 0)
    {return;}

    if(amount === null || amount === "undefined")
    {
        amount = 0.0;
    }

    var calculatedIcPayAmount = amount * .68;
    if(inOutContract == true) {
        xrmPage.getAttribute("cwm_independentcontractorpayamount").setValue(calculatedIcPayAmount);
    } else {
        xrmPage.getAttribute("cwm_independentcontractorpayamount").setValue(0);
    }

}