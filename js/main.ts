var xml2json:(input:any) => any;

interface Post {
  id:number;
  postTime:number;
  originalUrl:string;
  path:string;
  type:string;
  title:string;
  content:string;
  excerpt:string;
}

const WORDPRESS_PATHS = {
  blogTitle: '/rss/channel/title',
  blogUrl: '/rss/channel/link',
  posts: '/rss/channel/item'
}

class WordPressImport {
  private _doc:XMLDocument;

  constructor(xmlString:string) {
    this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
  }

  public get blogTitle():string {
    return this._doc.evaluate (WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
  }

  public get blogUrl():string {
    return this._doc.evaluate (WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
  }

  public get posts():Array<Post> {
    var posts:Array<Post> = [];
    var results = this._doc.evaluate (WORDPRESS_PATHS.posts, this._doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var post = results.iterateNext();
    while(post) {
      posts.push({
        id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
        postTime: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML)).getTime(),
        type: post["getElementsByTagName"]("post_type")[0].innerHTML,
        originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
        path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
        title: post["getElementsByTagName"]("title")[0].innerHTML,
        content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
        excerpt: post["getElementsByTagName"]("encoded")[1].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "")
      });
      post = results.iterateNext();
    }
    return posts;
  }

  public toJSON() {
    return {
      blogTitle: this.blogTitle,
      blogUrl: this.blogUrl,
      posts: this.posts
    }
  }

  public get toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

class StaticApp {
  private static _reader:FileReader = new FileReader();
  private static _import:WordPressImport;

  public static init() {
    StaticApp._reader.onload = StaticApp._readFile;
  }

  public static openFile(e:any) {
    StaticApp._reader.readAsText(e.target.files[0]);    
  }

  private static _readFile() {
    StaticApp._import = new WordPressImport(StaticApp._reader.result);

    // var str = xml2json(doc);
    // var data = JSON.parse(str.replace(/^{\sundefined/, "{"));
    document.write('<pre>DONE\n');
//        document.write(data);
    document.write('</pre>');
  }
}
StaticApp.init();

$("#import_file").change(StaticApp.openFile);
