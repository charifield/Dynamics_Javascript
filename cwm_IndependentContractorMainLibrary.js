function onFormLoad(data)
{  
    //Lock out Share with Accounting
    var xrmPage = Xrm.Page;

    //Check if Creating or Updating
    var formType= xrmPage.ui.getFormType();
    if(formType === 1){ setDefaultValues(); return; }

    //If Unchecking
    var shareWithAccounting = xrmPage.getControl("cwm_sharewithaccounting");

    if(xrmPage.getAttribute("cwm_sharewithaccounting").getValue() === true)
    {
        shareWithAccounting.setDisabled(true);
    }

    getOriginalValues();
    setDefaultValues();
}

function onFormSave()
{
    var xrmPage = Xrm.Page;

    var selfID = xrmPage.data.entity.getId();
    if(selfID !== "" && selfID != null)
    {
        setModified();
        getOriginalValues();
    }
    
    onFormLoad();
}



function setDefaultValues(data)
{
    var xrmPage = Xrm.Page;
    var quoteProductID = xrmPage.data.entity.getId();
    

    if(xrmPage.getAttribute("ownerid").getValue() != null)
    {
        var userID = xrmPage.getAttribute("ownerid").getValue()[0].id.replace('{','').replace('}','');
        //var userID = Xrm.Page.context.getUserId().replace('{','').replace('}','');
        //Get User
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
              if (this.status === 200)
              {
                try{
                  var myData = JSON.parse(this.response);
                  
                  //Get Defaults from Business Unit
                  var Query2 ="businessunits(" + myData["_businessunitid_value"] + ")?$select=cwm_defaulticinitorientationfee,cwm_defaulticinitorientationfeepayments,cwm_usingbc";

                  var req2 = new XMLHttpRequest();
                  req2.open("GET", serverURL + "/api/data/v8.2/" + Query2, true);
                  req2.setRequestHeader("Accept", "application/json");
                  req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                  req2.setRequestHeader("OData-MaxVersion", "4.0");
                  req2.setRequestHeader("OData-Version", "4.0");
                  req2.onreadystatechange = function () {
                    var myData = JSON.parse(this.response);
                    if (this.readyState === 4 && this.response !== null) {

                        //Set Defaults
                        if(quoteProductID === "")
                        {
                            if(myData["cwm_defaulticinitorientationfee"] !== undefined && xrmPage.getAttribute("cwm_initorientationfee").getValue() == undefined){
                                xrmPage.getAttribute("cwm_initorientationfee").setValue(myData["cwm_defaulticinitorientationfee"]);
                            }
                            if(myData["cwm_defaulticinitorientationfeepayments"] !== undefined  && xrmPage.getAttribute("cwm_initorientationfeepayments").getValue() == undefined){
                                xrmPage.getAttribute("cwm_initorientationfeepayments").setValue(myData["cwm_defaulticinitorientationfeepayments"]);
                            }
                        }
                        if(myData["cwm_usingbc"] === null || myData["cwm_usingbc"] === false ){
                            xrmPage.getControl("cwm_sharewithaccounting").setDisabled(true);
                        }
                    }
                }
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



function shareWithAccounting(data)
{
    var xrmPage = Xrm.Page;
    var missingFields = "";
    var saveData = false;
    var recordID = xrmPage.data.entity.getId();

    //If Unchecking
    if(xrmPage.getAttribute("cwm_sharewithaccounting").getValue() === false)
    {
        Xrm.Page.getAttribute("cwm_runmap").setValue(false);
        return;
    }

    //Check Name
    if(xrmPage.getAttribute("cwm_name").getValue() === null)
        missingFields += "• IC Name \n";

    //Check Address
    if(xrmPage.getAttribute("cwm_street1").getValue() === null || xrmPage.getAttribute("cwm_city").getValue() === null|| 
        xrmPage.getAttribute("cwm_state").getValue() === null || xrmPage.getAttribute("cwm_zipcode").getValue() === null)
        missingFields += "• Complete Address \n";
    
    //Check Contact
    if(xrmPage.getAttribute("cwm_primarycontact").getValue() === null)
        missingFields += "• Primary Contact \n";

    //Check IC Type
    if(xrmPage.getAttribute("cwm_ictype").getValue() === null)
        missingFields += "• IC Type \n";

    //Check Insurance
    if(xrmPage.getAttribute("cwm_glexempt").getValue() === null || xrmPage.getAttribute("cwm_glexempt").getValue() === false)
    {
        if(xrmPage.getAttribute("cwm_glinsuranceexp").getValue() === null)
            missingFields += "• GL Expiration Date \n";
    }
    if(xrmPage.getAttribute("cwm_wcexempt").getValue() === null || xrmPage.getAttribute("cwm_wcexempt").getValue() === false)
    {
        if(xrmPage.getAttribute("cwm_wcinsuranceexp").getValue() === null)
           missingFields += "• WC Expiration Date \n";
    }

    //Check Phone Number
    if(xrmPage.getAttribute("cwm_mainphone").getValue() === null)
        missingFields += "• Main Phone \n";


    if(missingFields !== "")
    {
        alert("The following fields are required before submitting: \n" + missingFields);
        xrmPage.getAttribute("cwm_sharewithaccounting").setValue(false);
    }
    else
    {
        Xrm.Page.getAttribute("cwm_runmap").setValue(true);

        //Default Start Date
        var cwStartDate = xrmPage.getAttribute("cwm_startdate").getValue();
        if(cwStartDate === "" || cwStartDate == null)
        {
            xrmPage.getAttribute("cwm_startdate").setValue(new Date());
            saveData = true;
        }

        //Set status
        if(xrmPage.getAttribute("cwm_ictype").getValue() === 122190000 || xrmPage.getAttribute("cwm_ictype").getValue() === 122190002)
        {
            xrmPage.getAttribute("cwm_relationshiptype").setValue(100000002);
            saveData = true;
        }
        else  if(xrmPage.getAttribute("cwm_ictype").getValue() === 122190001)
        {
            xrmPage.getAttribute("cwm_relationshiptype").setValue(122190000);
            saveData = true;
        }

        if(saveData === true && recordID != "" && recordID != null)
        {
            Xrm.Page.data.save();
        }
    }
}



//####################### Modified Flag  ####################

var original_shareWithAccounting;
var original_name;
var original_checkName;
var original_dba;

var original_address;
var original_EINNo;
var original_initOrientationFeesPayments;
var original_initOrientationFeesAmounts;
var original_glExpiration;
var original_glExempt;
var original_wcExpiration;
var original_wcExempt;

var original_Address_Street1;
var original_Address_Street2;
var original_Address_City;
var original_Address_State;
var original_Address_Zip;
var original_Address_Territory;

function getOriginalValues()
{
    var xrmPage = Xrm.Page;

    original_shareWithAccounting = xrmPage.getAttribute("cwm_sharewithaccounting").getValue();
    original_name = xrmPage.getAttribute("cwm_name").getValue();
    original_checkName = xrmPage.getAttribute("cwm_checkname").getValue();
    original_dba = xrmPage.getAttribute("cwm_dba").getValue();

    original_EINNo = xrmPage.getAttribute("cwm_einnumber").getValue();
    original_initOrientationFeesPayments = xrmPage.getAttribute("cwm_initorientationfeepayments").getValue();
    original_initOrientationFeesAmounts = xrmPage.getAttribute("cwm_initorientationfee").getValue();

    original_Address_Street1 = xrmPage.getAttribute("cwm_street1").getValue();
    original_Address_Street2 = xrmPage.getAttribute("cwm_street2").getValue();
    original_Address_City = xrmPage.getAttribute("cwm_city").getValue();
    original_Address_State = xrmPage.getAttribute("cwm_state").getValue();
    original_Address_Zip = xrmPage.getAttribute("cwm_zipcode").getValue();
    original_Address_Territory = xrmPage.getAttribute("cwm_territory").getValue();

    original_glExpiration = xrmPage.getAttribute("cwm_glinsuranceexp").getValue();
    original_glExempt = xrmPage.getAttribute("cwm_glexempt").getValue();
    original_wcExpiration = xrmPage.getAttribute("cwm_wcinsuranceexp").getValue();
    original_wcExempt = xrmPage.getAttribute("cwm_wcexempt").getValue();
}

function setModified()
{
    var xrmPage = Xrm.Page;

    var isModified = false;
    var runMap = false;
    
    if(xrmPage.getAttribute("cwm_sharewithaccounting").getValue() != original_shareWithAccounting)
    {
        if(xrmPage.getAttribute("cwm_sharewithaccounting").getValue() === true) {
            runMap = true;
        }
    }
    if(xrmPage.getAttribute("cwm_name").getValue() != original_name)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_checkname").getValue() != original_checkName)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_dba").getValue() != original_dba)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_initorientationfeepayments").getValue() != original_initOrientationFeesPayments)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_einnumber").getValue() != original_EINNo)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_initorientationfee").getValue() != original_initOrientationFeesAmounts)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_street1").getValue() != original_Address_Street1)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_street2").getValue() != original_Address_Street2)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_city").getValue() != original_Address_City)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_state").getValue() != original_Address_State)
    {
        isModified = true; runMap = true;
    }
    if(xrmPage.getAttribute("cwm_zipcode").getValue() != original_Address_Zip)
    {
        isModified = true; runMap = true;
    }
    if(getLookupID(xrmPage.getAttribute("cwm_territory").getValue()) != getLookupID(original_Address_Territory))
    {
        isModified = true;
    }
    if(String(xrmPage.getAttribute("cwm_glinsuranceexp").getValue()) != String(original_glExpiration))
    {
        runMap = true;
    }
    if(xrmPage.getAttribute("cwm_glexempt").getValue() != original_glExempt)
    {
        runMap = true;
    }
    if(String(xrmPage.getAttribute("cwm_wcinsuranceexp").getValue()) != String(original_wcExpiration))
    {
        runMap = true;
    }
    if(xrmPage.getAttribute("cwm_wcexempt").getValue() != original_wcExempt)
    {
        runMap = true;
    }

    if(xrmPage.getAttribute("cwm_sharewithaccounting").getValue() != null && xrmPage.getAttribute("cwm_sharewithaccounting").getValue() === true)
    {
        Xrm.Page.data.refresh(true).then(successSubmitCallback(runMap, isModified), errorSubmitCallback());
    }
}

function successSubmitCallback(runMap, isModified)
{
    if(!runMap) return;

    setTimeout(function(){  
        
        var errorDialog = window.top.document.getElementById('InlineDialog');
        if(errorDialog != null){ return; }
    
        if(isModified === true) {
            Xrm.Page.getAttribute("cwm_modified").setValue(true);
        } 
        if(runMap === true) {
            Xrm.Page.getAttribute("cwm_runmap").setValue(true);   
        }
        if(runMap || isModified)
            Xrm.Page.data.save();
    }, 1000);
}

function errorSubmitCallback()
{
    return;
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
    } catch (error)
    {
         console.log(error);
    }

    return null;
}