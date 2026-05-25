const req = new Request("https://raw.githubusercontent.com/esschul/italia/main/scriptable/ItalyWidget.js");
const code = await req.loadString();

const fm = FileManager.local();
fm.writeString(fm.joinPath(fm.documentsDirectory(), "Italia.js"), code);

const a = new Alert();
a.title = "✅ Italia installed!";
a.message = "Now add a medium Scriptable widget to your home screen and pick 'Italia'.";
a.addAction("OK");
await a.present();
Script.complete();
