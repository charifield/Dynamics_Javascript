function onFormLoad(executionContext){
    var xrmPage = Xrm.Page;

    //Only set Default IC if Creating a record
    var formType= xrmPage.ui.getFormType();
    if(formType === 1) {
        setDefaultIndependentContractor();
    }
}

function setDefaultIndependentContractor(){
    //debugger;
    var xrmPage = Xrm.Page;

    if(xrmPage.getAttribute("regardingobjectid").getValue() != null)
    {
        var accountId = xrmPage.getAttribute("regardingobjectid").getValue()[0].id.replace('{','').replace('}','');
        var serverURL = Xrm.Page.context.getClientUrl();
        var Query ="cwm_account_independentcontractorset?$filter=accountid eq " + accountId;

        var req = new XMLHttpRequest();
        req.open("GET", serverURL + "/api/data/v8.2/" + Query, true);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState === 4 && this.response !== null) {
                this.onreadystatechange = null;
                if (this.status === 200)
                {
                    //debugger;
                    try{
                        var myData = JSON.parse(this.response);
                        var icCount = myData.value.length;
                        if(icCount === 1)
                        {
                            var icId = myData.value[0]["cwm_independentcontractorid"];

                            try{
                                //Get the name of the Independent Contractor
                                var Query2 ="cwm_independentcontractors(" + icId + ")?$select=cwm_name";

                                var req2 = new XMLHttpRequest();
                                req2.open("GET", serverURL + "/api/data/v8.2/" + Query2, true);
                                req2.setRequestHeader("Accept", "application/json");
                                req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                                req2.setRequestHeader("OData-MaxVersion", "4.0");
                                req2.setRequestHeader("OData-Version", "4.0");
                                req2.onreadystatechange = function () {
                                    if (this.readyState === 4 && this.response !== null) {
                                        //debugger;
                                        var myIcData = JSON.parse(this.response);
                                        var icName = myIcData.cwm_name;

                                        var icLookupValue = new Array();
                                        icLookupValue[0] = new Object();
                                        icLookupValue[0].id = icId;
                                        icLookupValue[0].name = icName;
                                        icLookupValue[0].entityType = "cwm_independentcontractor";
                                        if (icLookupValue[0].id != null)
                                        {
                                            xrmPage.getAttribute("cwm_independentcontractor").setValue(icLookupValue);
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
                    catch (error)
                    {console.log(error);}
                }
            }
        };
        req.send();
    }
}