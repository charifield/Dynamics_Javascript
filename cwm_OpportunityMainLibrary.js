function SetRequiredFields(data)
{
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
              if (this.status === 200)
              {
                try{
                  var myData = JSON.parse(this.response);
                  
                  //Get Using BC from Business Unit
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

                        //Lock and unlock necessary fields
                        usingBC = myData["cwm_usingbc"];
                        if(usingBC === null || usingBC === false ){
                            if(Xrm.Page.getAttribute("cwm_primaryserviceofinterest").getValue() == 1) {
                                Xrm.Page.getAttribute("estimatedclosedate").setRequiredLevel("required");
                            } else {
                                Xrm.Page.getAttribute("estimatedclosedate").setRequiredLevel("none");
                            }
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