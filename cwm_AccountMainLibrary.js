function onFormLoad(executionContext) {
    try{
        hideBillingContact(executionContext);
        hideBillingInfoSectionIfUsingBc(executionContext);
    }
    catch(error){
        console.log(error);
    }
}

function onFormSave()
{
    var xrmPage = Xrm.Page;
    var selfID = xrmPage.data.entity.getId();
}



function GPAcctID_onchange(context) {
    var gpAccountField = context.getEventSource();
    validateGPAccountId(gpAccountField);
}

function customertypecode_onchange(context) {
    var gpAccountIdField = Xrm.Page.getAttribute('accountnumber');
    validateGPAccountId(gpAccountIdField);
}
//Validates the length of the GP Account ID field
function validateGPAccountId(gpAccountIdField) {
    var isGPAccountIdValid = true;
    var maxFieldLength = 15;
    if (typeof (gpAccountIdField) === "undefined" || gpAccountIdField === null) {
        return;
    }
    var gpAccountId = gpAccountIdField.getValue();
    if (typeof (gpAccountId) != "undefined" && gpAccountId != null) {
        var relationshipType = Xrm.Page.getAttribute('customertypecode').getText();
        if (gpAccountId != null) {
            if (relationshipType == 'Client - NJS' || relationshipType == 'Client') {
                if (gpAccountId.length > maxFieldLength) {
                    isGPAccountIdValid = false;
                    setFieldNotification(gpAccountIdField, 'The maximum number of characters for a Service Provider GP ID is ' + maxFieldLength + '. Please verify that the ID matches the value in GP.');
                    //alert('The maximum number of characters for a Service Provider GP ID is 10, please fix and then Save.');
                }
            }
        }
    }
    if (isGPAccountIdValid) {
        clearFieldNotification(gpAccountIdField);
    }
}

function hideBillingContact(executionContext) {
    var xrmPage = Xrm.Page;

    //Hide Primary Contact
    if(xrmPage.getAttribute("cwm_bccustomerno").getValue() != null)
        xrmPage.getControl("cwm_billingcontactid").setVisible(false);
}

function hideBillingInfoSectionIfUsingBc(executionContext) {
    var xrmPage = Xrm.Page;
    if(xrmPage.getAttribute("ownerid").getValue() != null)
    {
        var userID = xrmPage.getAttribute("ownerid").getValue()[0].id.replace('{','').replace('}','');
        var serverURL = Xrm.Page.context.getClientUrl();
        var Query ="systemusers(" + userID + ")?$select=_businessunitid_value";

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

                        //Get Defaults from Business Unit
                        var Query2 ="businessunits(" + myData["_businessunitid_value"] + ")?$select=cwm_usingbc";

                        var req2 = new XMLHttpRequest();
                        req2.open("GET", serverURL + "/api/data/v8.2/" + Query2, true);
                        req2.setRequestHeader("Accept", "application/json");
                        req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        req2.setRequestHeader("OData-MaxVersion", "4.0");
                        req2.setRequestHeader("OData-Version", "4.0");
                        req2.onreadystatechange = function () {
                            var myData = JSON.parse(this.response);
                            if (this.readyState === 4 && this.response !== null) {

                                if(myData["cwm_usingbc"] !== null && myData["cwm_usingbc"] !== undefined  && myData["cwm_usingbc"] === true){
                                    xrmPage.ui.tabs.get("tab_contract_details").sections.get("section_billing_address").setVisible(false);
                                }
                            }
                        };
                        req2.send();
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
    catch(error){
        console.log(error);
    }

    return null;
}