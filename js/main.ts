var xml2json:(input:any) => any;
class StaticApp {
  private static _reader:FileReader = new FileReader();

  public static init() {
    StaticApp._reader.onload = StaticApp._readFile;
  }

  public static openFile(e:any) {
    StaticApp._reader.readAsText(e.target.files[0]);    
  }

  private static _readFile() {
    var data = JSON.parse(xml2json($.parseXML(StaticApp._reader.result)).replace(/^{\s+undefined/, "{"));
    document.write('<pre>DONE\n');
//        document.write(data);
    document.write('</pre>');
  }
}
StaticApp.init();

$("#import_file").change(StaticApp.openFile);
