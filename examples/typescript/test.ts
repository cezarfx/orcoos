module m {

    function syncF(str: String = "") {
        console.log(str + " - syncF('" + str + "')          {");

        // let r = await asyncF(str + '   ');
        // console.log(str + " - syncF() result: " + r);
        asyncF(str + '   ').then(r => console.log(str + " - syncF() result: " + r));
        

        console.log(str + " - syncF('" + str + "')          }");
        return "resOfSyncF";
    }
    
    async function asyncF(str: String = "") {
        console.log(str + " - asyncF()          {");

        // let r = syncF(str + "   ");
        // console.log(str + " - asyncF() result: " + r);

        console.log(str + " - asyncF()          }");
        return "resOfAsyncF";
    }
    
    
    asyncF().then().catch();
    console.log("\n");
    syncF();

}
