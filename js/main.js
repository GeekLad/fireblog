var xml2json;
var StaticApp = (function () {
    function StaticApp() {
    }
    StaticApp.init = function () {
        StaticApp._reader.onload = StaticApp._readFile;
    };
    StaticApp.openFile = function (e) {
        StaticApp._reader.readAsText(e.target.files[0]);
    };
    StaticApp._readFile = function () {
        var data = JSON.parse(xml2json($.parseXML(StaticApp._reader.result)).replace(/^{\s+undefined/, "{"));
        document.write('<pre>DONE\n');
        //        document.write(data);
        document.write('</pre>');
    };
    return StaticApp;
}());
StaticApp._reader = new FileReader();
StaticApp.init();
$("#import_file").change(StaticApp.openFile);
//# sourceMappingURL=main.js.map