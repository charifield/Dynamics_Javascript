function onFormLoad(executionContext) {
    try{
        lockAccount();
        lockSalesPerson();
        lockQuote();
        getOriginalValues();
        setFormReadOnly();
    }
    catch (error)
    {
        console.log(error);
    }
}

function onFormSave()
{
    var xrmPage = Xrm.Page;
    
    var selfID = xrmPage.data.entity.getId();
    if(selfID !== "")
    {
        setModified();
        getOriginalValues();
    }
}

function lockAccount()
{
    var xrmPage = Xrm.Page;

    //Lock out Account
    var contractAccount = xrmPage.getControl("cwm_contractaccountid");
    if(xrmPage.getAttribute("cwm_contractaccountid").getValue() != undefined)
    {
        contractAccount.setDisabled(true);
    }
}

function setFormReadOnly()
{
    if(Xrm.Page.getAttribute("statuscode").getValue() === 122190005)
    {
        Xrm.Page.ui.setFormNotification('Contract status is Cancelled. This Record is Read-Only', 'Warning');
        Xrm.Page.ui.controls.forEach(function (control, index) {
            var controlType = control.getControlType();
            if (controlType != "iframe" && controlType != "webresource" && controlType != "subgrid") {
                try {
                    control.setDisabled(true);
                }
                catch (error)
                {
                    console.log(error);
                }
            }
        });
    }
}

function lockSalesPerson()
{
    var xrmPage = Xrm.Page;

    //Lock out SalesPerson
    var salesPerson = xrmPage.getControl("ownerid");
    if(xrmPage.getAttribute("ownerid").getValue() != undefined)
    {
        salesPerson.setDisabled(true);
    }
}

function lockQuote()
{
    var xrmPage = Xrm.Page;

    //Lock out Quote
     var quote = xrmPage.getControl("cwm_quote");
    if(xrmPage.getAttribute("cwm_quote").getValue() != undefined)
    {
        quote.setDisabled(true);
    }
}


//####################### Modified Flag  ####################

var original_status;
var original_fsm;
var original_endDate;
var original_contractType;
var original_po

function getOriginalValues()
{
    var xrmPage = Xrm.Page;

    original_status = xrmPage.getAttribute("statuscode").getValue();
    original_endDate = xrmPage.getAttribute("cwm_contractenddate").getValue();
    original_contractType = xrmPage.getAttribute("cwm_contracttype").getValue();
    original_fsm = xrmPage.getAttribute("cwm_contractfsmid").getValue();
    original_po = xrmPage.getAttribute("cwm_customerpo").getValue();
}

function setModified()
{
    var xrmPage = Xrm.Page;
    
    var isModified = false;
    var runMap = false;
    var saveChanges = false;

    if(xrmPage.getAttribute("statuscode").getValue() != original_status)
    {
        isModified = true; runMap = true;
    }
    if(getLookupID(xrmPage.getAttribute("cwm_contractfsmid").getValue()) != getLookupID(original_fsm))
    {
        isModified = true; runMap = true;
    }
    if(String(xrmPage.getAttribute("cwm_contractenddate").getValue()) != String(original_endDate))
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_contracttype").getValue() != original_contractType)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_customerpo").getValue() != original_po)
    {
        runMap = true;
    }

    //Set modified and RunMap Fields
    if(xrmPage.getAttribute("statuscode").getValue() != 122190000 && xrmPage.getAttribute("statuscode").getValue() != 122190001){
        if(isModified === true) {
            saveChanges = true;
        }
    } else {
        isModified = false;
    }
    
    if(xrmPage.getAttribute("statuscode").getValue() != 122190000)
    {
        if(runMap == true) {
            saveChanges = true;
        }
    } else {
        runMap = false;
    }

    if(saveChanges)
        setFlags(runMap, isModified);
}


//####################### Get Lookup ID  ####################

function getLookupID(lookup)
{
    try
    {
        if(lookup === null) {
            return null;
        }

        if(lookup[0] === null) {
            return null;
        }

        if(lookup[0].id != null) {
            return lookup[0].id;
        }
    }
    catch (error)
    {
        console.log(error);
    }

    return null;
}

function setFlags(runMap, isModified)
{
    var xrmPage = Xrm.Page;

    //Check if UsingBC
	if(xrmPage.getAttribute("ownerid").getValue() == null)
        return;  
    
    //Check if UsingBC
    //var userID = Xrm.Page.context.getUserId().replace('{','').replace('}','');
    var userID = xrmPage.getAttribute("ownerid").getValue()[0].id.replace('{','').replace('}','');
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
                            
                            if(myBuData["cwm_usingbc"] === true) {
                                if(runMap === true){
                                    xrmPage.getAttribute("cwm_runmap").setValue(true);
                                }
                                if(isModified === true){
                                    xrmPage.getAttribute("cwm_modified").setValue(true);
                                }
                                xrmPage.data.entity.save();
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