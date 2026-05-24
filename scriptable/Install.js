const url = "https://raw.githubusercontent.com/esschul/italia/main/scriptable/ItalyWidget.js";
const fm  = FileManager.iCloud();
const req = new Request(url);
fm.writeString(fm.joinPath(fm.documentsDirectory(), "Italia.js"), await req.loadString());
Script.complete();
